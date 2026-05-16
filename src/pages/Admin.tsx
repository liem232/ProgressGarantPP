import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Users, Package, FileText, Clock, CheckCircle2, XCircle, Eye, Ban, ShieldCheck, Warehouse, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { seedProducts } from '@/services/seedService';
import { isFirebaseConfigured } from '@/lib/firebase';
import { getOrders, updateOrderStatus, deleteOrder, Order } from '@/services/ordersService';
import AdminProducts from '@/components/AdminProducts';
import StockManagement from '@/pages/StockManagement';
import AdminReports from '@/pages/AdminReports';
import PartnershipRequests from '@/components/PartnershipRequests';
import { getCollection, updateDoc, getDocById } from '@/services/firestoreService';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: 'user' | 'manager' | 'admin';
  photoURL?: string;
  isBlocked?: boolean;
}

const statusLabels = {
  pending: 'Ожидает обработки',
  processing: 'В обработке',
  completed: 'Выполнен',
  cancelled: 'Отменен'
};

const statusIcons = {
  pending: Clock,
  processing: Package,
  completed: CheckCircle2,
  cancelled: XCircle
};

const statusColors = {
  pending: 'default',
  processing: 'secondary',
  completed: 'default',
  cancelled: 'destructive'
} as const;

const Admin: React.FC = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [isSeedingProducts, setIsSeedingProducts] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');
  
  // Получаем активный таб из URL параметра или используем 'overview' по умолчанию
  const defaultTab = searchParams.get('tab') || 'overview';

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: () => getOrders(),
    enabled: isAdmin,
  });

  // Фильтрация заказов по статусу
  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [roleConfirmDialog, setRoleConfirmDialog] = useState<{ userId: string; newRole: 'user' | 'manager' | 'admin' } | null>(null);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{ orderId: string; orderNumber: string } | null>(null);

  // Загрузка пользователей
  useEffect(() => {
    const loadUsers = async () => {
      if (!isAdmin) return;
      setUsersLoading(true);
      try {
        if (isFirebaseConfigured) {
          const usersData = await getCollection('users');
          setUsers(usersData.map((u: any) => ({
            id: u.id || u.uid,
            username: u.username,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            phone: u.phone,
            role: u.role || 'user',
            photoURL: u.photoURL,
            isBlocked: u.isBlocked || false
          })));
        } else {
          // Fallback к localStorage
          const savedUsers = JSON.parse(localStorage.getItem('progressgarant_users') || '[]');
          setUsers(savedUsers.map((u: any) => ({
            id: u.id,
            username: u.username,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            phone: u.phone,
            role: u.role || 'user',
            photoURL: u.photoURL,
            isBlocked: u.isBlocked || false
          })));
        }
      } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
      } finally {
        setUsersLoading(false);
      }
    };
    loadUsers();
  }, [isAdmin]);

  const handleSeedProducts = async () => {
    if (!isFirebaseConfigured) {
      toast({
        title: 'Firebase не настроен',
        description: 'Заполни .env и перезапусти dev-сервер, затем повтори',
        variant: 'destructive',
      });
      return;
    }

    setIsSeedingProducts(true);
    try {
      const res = await seedProducts();
      toast({
        title: 'Товары загружены',
        description: `Добавлено товаров: ${res.total}`,
      });
    } catch (e: any) {
      toast({
        title: 'Ошибка загрузки товаров',
        description: e?.message || 'Не удалось загрузить товары в Firestore',
        variant: 'destructive',
      });
    } finally {
      setIsSeedingProducts(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: 'Статус обновлен',
        description: `Заказ №${orderId.slice(-6)} - ${statusLabels[newStatus]}`,
      });
    } catch (err: any) {
      toast({
        title: 'Ошибка',
        description: err?.message || 'Не удалось обновить статус',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteOrder = async () => {
    if (!deleteConfirmDialog) return;

    try {
      await deleteOrder(deleteConfirmDialog.orderId);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: 'Заказ удален',
        description: `Заказ №${deleteConfirmDialog.orderNumber} успешно удален`,
      });
      setDeleteConfirmDialog(null);
    } catch (err: any) {
      toast({
        title: 'Ошибка',
        description: err?.message || 'Не удалось удалить заказ',
        variant: 'destructive',
      });
    }
  };

  const handleToggleBlock = async (userId: string, isBlocked: boolean) => {
    try {
      if (isFirebaseConfigured) {
        await updateDoc('users', userId, { isBlocked: !isBlocked });
      } else {
        const savedUsers = JSON.parse(localStorage.getItem('progressgarant_users') || '[]');
        const updatedUsers = savedUsers.map((u: any) => 
          u.id === userId ? { ...u, isBlocked: !isBlocked } : u
        );
        localStorage.setItem('progressgarant_users', JSON.stringify(updatedUsers));
      }
      
      setUsers(users.map(u => 
        u.id === userId ? { ...u, isBlocked: !isBlocked } : u
      ));
      
      toast({
        title: isBlocked ? "Пользователь разблокирован" : "Пользователь заблокирован",
        description: isBlocked ? "Доступ восстановлен" : "Доступ ограничен",
      });
    } catch (err: any) {
      toast({
        title: "Ошибка",
        description: err.message || "Не удалось обновить статус блокировки",
        variant: "destructive",
      });
    }
  };

  const handleChangeRole = (userId: string, newRole: 'user' | 'manager' | 'admin') => {
    setRoleConfirmDialog({ userId, newRole });
  };

  const confirmRoleChange = async () => {
    if (!roleConfirmDialog) return;
    
    const { userId, newRole } = roleConfirmDialog;
    try {
      if (isFirebaseConfigured) {
        await updateDoc('users', userId, { role: newRole });
      } else {
        const savedUsers = JSON.parse(localStorage.getItem('progressgarant_users') || '[]');
        const updatedUsers = savedUsers.map((u: any) => 
          u.id === userId ? { ...u, role: newRole } : u
        );
        localStorage.setItem('progressgarant_users', JSON.stringify(updatedUsers));
      }
      
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
      
      toast({
        title: "Роль обновлена",
        description: `Новая роль: ${newRole === 'admin' ? 'Администратор' : newRole === 'manager' ? 'Менеджер' : 'Пользователь'}`,
      });
    } catch (err: any) {
      toast({
        title: "Ошибка",
        description: err.message || "Не удалось обновить роль",
        variant: "destructive",
      });
    } finally {
      setRoleConfirmDialog(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Доступ запрещен</h1>
          <p className="text-muted-foreground">У вас нет прав администратора</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-8">Админ-панель</h1>
        
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="flex flex-wrap w-full gap-1 sm:gap-2 h-auto min-h-[40px]">
            <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">Обзор</TabsTrigger>
            <TabsTrigger value="orders" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">Заказы ({orders.length})</TabsTrigger>
            <TabsTrigger value="products" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">Товары</TabsTrigger>
            <TabsTrigger value="stock" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">Наличие</TabsTrigger>
            <TabsTrigger value="reports" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">Отчетность</TabsTrigger>
            <TabsTrigger value="partnerships" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">Партнерство</TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2">Пользователи ({users.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="flex justify-end mb-6">
              <Button onClick={handleSeedProducts} disabled={isSeedingProducts} className="min-h-[44px] text-xs sm:text-sm">
                <Shield className="h-4 w-4 mr-2" />
                <span className="sm:hidden">Загрузить товары</span>
                <span className="hidden sm:inline">{isSeedingProducts ? 'Загрузка товаров...' : 'Залить товары в Firestore'}</span>
              </Button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 sm:gap-6">
              <Card className="touch-manipulation">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">Пользователи</p>
                      <p className="text-xl sm:text-2xl font-bold text-primary">{users.length}</p>
                      <p className="text-xs text-muted-foreground hidden sm:block">Зарегистрированных</p>
                    </div>
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0 ml-2" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="touch-manipulation">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">Заказы</p>
                      <p className="text-xl sm:text-2xl font-bold text-primary">{orders.length}</p>
                      <p className="text-xs text-muted-foreground hidden sm:block">Всего заказов</p>
                    </div>
                    <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0 ml-2" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="touch-manipulation">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">Выполнено</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-600">
                        {orders.filter(order => order.status === 'completed').length}
                      </p>
                      <p className="text-xs text-muted-foreground hidden sm:block">Доставлено</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0 ml-2" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="touch-manipulation">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">В работе</p>
                      <p className="text-xl sm:text-2xl font-bold text-blue-600">
                        {orders.filter(order => ['pending', 'processing'].includes(order.status)).length}
                      </p>
                      <p className="text-xs text-muted-foreground hidden sm:block">Активных</p>
                    </div>
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0 ml-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            {/* Фильтр по статусу */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h2 className="text-lg sm:text-xl font-semibold">Управление заказами</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">Фильтр:</span>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as Order['status'] | 'all')}>
                  <SelectTrigger className="w-full sm:w-44 min-h-[44px] text-xs sm:text-sm">
                    <SelectValue placeholder="Все статусы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все заказы ({orders.length})</SelectItem>
                    <SelectItem value="pending">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Ожидает ({orders.filter(o => o.status === 'pending').length})</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="processing">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">В работе ({orders.filter(o => o.status === 'processing').length})</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="completed">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Выполнен ({orders.filter(o => o.status === 'completed').length})</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="cancelled">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Отменен ({orders.filter(o => o.status === 'cancelled').length})</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-6">
              {filteredOrders.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {statusFilter === 'all' ? 'Заказов пока нет' : `Заказов со статусом "${statusLabels[statusFilter]}" нет`}
                    </p>
                    {statusFilter !== 'all' && (
                      <Button 
                        variant="outline" 
                        className="mt-4" 
                        onClick={() => setStatusFilter('all')}
                      >
                        Показать все заказы
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                filteredOrders.map((order) => {
                  const StatusIcon = statusIcons[order.status];
                  const isExpanded = expandedOrder === order.id;
                  
                  return (
                    <Card key={order.id}>
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="space-y-1">
                            <CardTitle className="text-base sm:text-lg">
                              Заказ №{order.id.slice(-8)}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {order.orderData.firstName} {order.orderData.lastName} • {order.orderData.email}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.date).toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <Select
                              value={order.status}
                              onValueChange={(value) => handleUpdateStatus(order.id, value as Order['status'])}
                            >
                              <SelectTrigger className="w-full sm:w-36 min-h-[44px] text-xs sm:text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending" className="text-xs sm:text-sm">
                                  <span className="sm:hidden">Ожидает</span>
                                  <span className="hidden sm:inline">Ожидает обработки</span>
                                </SelectItem>
                                <SelectItem value="processing" className="text-xs sm:text-sm">В обработке</SelectItem>
                                <SelectItem value="completed" className="text-xs sm:text-sm">Выполнен</SelectItem>
                                <SelectItem value="cancelled" className="text-xs sm:text-sm">Отменен</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto"
                              onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                            >
                              <Eye className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Подробнее</span>
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="w-full sm:w-auto"
                              onClick={() => setDeleteConfirmDialog({ orderId: order.id, orderNumber: order.id.slice(-8) })}
                            >
                              <Trash2 className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Удалить</span>
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      {isExpanded && (
                        <CardContent>
                          <div className="space-y-4">
                            {/* Товары */}
                            <div>
                              <h4 className="font-medium mb-2">Товары:</h4>
                              <div className="space-y-2">
                                {order.items.map((item) => (
                                  <div key={item.id} className="flex justify-between text-sm">
                                    <span>{item.name} × {item.quantity}</span>
                                    <div className="text-right">
                                      <div className={item.isWholesale ? 'text-green-600 font-medium' : ''}>
                                        {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {item.price.toLocaleString('ru-RU')} ₽/шт
                                        {item.isWholesale && (
                                          <span className="text-green-600 ml-1">(Опт)</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Контакты и доставка */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                              <div>
                                <h4 className="font-medium mb-2">Контакты:</h4>
                                <div className="space-y-1 text-sm">
                                  <p>Телефон: {order.orderData.phone}</p>
                                  <p>Email: {order.orderData.email}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Доставка:</h4>
                                <div className="space-y-1 text-sm">
                                  {order.orderData.address && <p>{order.orderData.address}</p>}
                                  <p>Город: {order.orderData.city}</p>
                                </div>
                              </div>
                            </div>

                            {order.orderData.comment && (
                              <div className="pt-2 border-t">
                                <h4 className="font-medium mb-2">Комментарий:</h4>
                                <p className="text-sm text-muted-foreground">{order.orderData.comment}</p>
                              </div>
                            )}

                            {/* Итого */}
                            <div className="pt-2 border-t">
                              <div className="flex justify-between font-medium">
                                <span>Итого ({order.totalItems} шт.):</span>
                                <span className="text-primary">{order.totalPrice.toLocaleString('ru-RU')} ₽</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            <AdminProducts />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <AdminReports />
          </TabsContent>

          <TabsContent value="partnerships" className="mt-6">
            <PartnershipRequests />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <div className="space-y-6">
              {usersLoading ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">Загрузка пользователей...</p>
                  </CardContent>
                </Card>
              ) : users.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Пользователей пока нет</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {users.map((user) => (
                    <Card key={user.id} className={user.isBlocked ? 'opacity-60' : ''}>
                      <CardHeader className="p-3 sm:p-6">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                            <AvatarImage src={user.photoURL} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                              {(user.firstName?.[0] || user.username[0]).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm sm:text-lg truncate">
                              {user.firstName || user.username}
                              {user.lastName && ` ${user.lastName}`}
                            </CardTitle>
                            {user.isBlocked && (
                              <Badge variant="destructive" className="mt-1 text-xs">
                                <Ban className="h-3 w-3 mr-1" />
                                <span className="sm:hidden">Блок</span>
                                <span className="hidden sm:inline">Заблокирован</span>
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                        <div className="space-y-2 sm:space-y-3">
                          <div className="space-y-1 text-xs sm:text-sm">
                            <p className="truncate"><span className="font-medium">Логин:</span> {user.username}</p>
                            <p className="truncate"><span className="font-medium">Email:</span> {user.email}</p>
                            {user.phone && <p className="truncate"><span className="font-medium">Тел:</span> {user.phone}</p>}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={user.role === 'admin' ? 'destructive' : user.role === 'manager' ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              <ShieldCheck className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">
                                {user.role === 'admin' ? 'Админ' : user.role === 'manager' ? 'Менеджер' : 'Юзер'}
                              </span>
                            </Badge>
                          </div>

                          <div className="flex flex-col gap-2 pt-2 border-t">
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Роль:</span>
                              <Select
                                value={user.role}
                                onValueChange={(value) => handleChangeRole(user.id, value as any)}
                              >
                                <SelectTrigger className="w-full min-h-[36px] h-auto text-xs sm:text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user" className="text-xs sm:text-sm">Юзер</SelectItem>
                                  <SelectItem value="manager" className="text-xs sm:text-sm">Менеджер</SelectItem>
                                  <SelectItem value="admin" className="text-xs sm:text-sm">Админ</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <Button
                              variant={user.isBlocked ? "outline" : "destructive"}
                              size="sm"
                              className="w-full min-h-[40px] text-xs sm:text-sm"
                              onClick={() => handleToggleBlock(user.id, user.isBlocked || false)}
                            >
                              {user.isBlocked ? (
                                <>
                                  <ShieldCheck className="h-4 w-4 mr-2 flex-shrink-0" />
                                  <span className="sm:hidden">Разблок</span>
                                  <span className="hidden sm:inline">Разблокировать</span>
                                </>
                              ) : (
                                <>
                                  <Ban className="h-4 w-4 mr-2 flex-shrink-0" />
                                  <span className="sm:hidden">Блок</span>
                                  <span className="hidden sm:inline">Заблокировать</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="stock" className="mt-6">
            <StockManagement />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <AdminReports />
          </TabsContent>

        </Tabs>

        {/* Dialog подтверждения смены роли */}
        <Dialog open={!!roleConfirmDialog} onOpenChange={(open) => !open && setRoleConfirmDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Подтверждение смены роли</DialogTitle>
              <DialogDescription>
                Вы действительно хотите изменить роль пользователя? Это действие изменит права доступа.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRoleConfirmDialog(null)}>
                Отмена
              </Button>
              <Button onClick={confirmRoleChange}>
                Подтвердить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog подтверждения удаления заказа */}
        <Dialog open={!!deleteConfirmDialog} onOpenChange={(open) => !open && setDeleteConfirmDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Подтверждение удаления заказа</DialogTitle>
              <DialogDescription>
                Вы действительно хотите удалить заказ №{deleteConfirmDialog?.orderNumber}?
                Если заказ был в обработке или выполнен, товары будут возвращены на склад.
                Это действие нельзя отменить.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmDialog(null)}>
                Отмена
              </Button>
              <Button variant="destructive" onClick={handleDeleteOrder}>
                Удалить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Admin;