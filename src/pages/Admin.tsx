import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Users, Package, FileText, Clock, CheckCircle2, XCircle, Eye, Ban, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { seedProducts } from '@/services/seedService';
import { isFirebaseConfigured } from '@/lib/firebase';
import { getOrders, updateOrderStatus, Order } from '@/services/ordersService';
import AdminProducts from '@/components/AdminProducts';
import { getCollection, updateDoc, getDoc } from '@/services/firestoreService';

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
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [isSeedingProducts, setIsSeedingProducts] = useState(false);

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: () => getOrders(),
    enabled: isAdmin,
  });

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [roleConfirmDialog, setRoleConfirmDialog] = useState<{ userId: string; newRole: 'user' | 'manager' | 'admin' } | null>(null);

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
        title: "Статус обновлен",
        description: `Заказ №${orderId.slice(-6)} - ${statusLabels[newStatus]}`,
      });
    } catch (err: any) {
      toast({
        title: "Ошибка",
        description: err.message || "Не удалось обновить статус",
        variant: "destructive",
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
        <h1 className="text-3xl font-bold text-foreground mb-8">Админ-панель</h1>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="flex flex-wrap w-full gap-1 sm:gap-2">
            <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-3">Обзор</TabsTrigger>
            <TabsTrigger value="orders" className="text-xs sm:text-sm px-2 sm:px-3">Заказы ({orders.length})</TabsTrigger>
            <TabsTrigger value="products" className="text-xs sm:text-sm px-2 sm:px-3">Товары</TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm px-2 sm:px-3">Пользователи ({users.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="flex justify-end mb-6">
              <Button onClick={handleSeedProducts} disabled={isSeedingProducts}>
                <Shield className="h-4 w-4 mr-2" />
                {isSeedingProducts ? 'Загрузка товаров...' : 'Залить товары в Firestore'}
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Пользователи
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">{users.length}</p>
                  <p className="text-sm text-muted-foreground">Зарегистрированных</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Заказы
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">{orders.length}</p>
                  <p className="text-sm text-muted-foreground">Всего заказов</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Выполнено
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">
                    {orders.filter(order => order.status === 'completed').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Доставлено</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    В работе
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-600">
                    {orders.filter(order => ['pending', 'processing'].includes(order.status)).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Активных</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <div className="space-y-6">
              {orders.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Заказов пока нет</p>
                  </CardContent>
                </Card>
              ) : (
                orders.map((order) => {
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
                              <SelectTrigger className="w-full sm:w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Ожидает обработки</SelectItem>
                                <SelectItem value="processing">В обработке</SelectItem>
                                <SelectItem value="completed">Выполнен</SelectItem>
                                <SelectItem value="cancelled">Отменен</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto"
                              onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                            >
                              <Eye className="h-4 w-4 sm:mr-2" />
                              <span className="sm:hidden">Подробнее</span>
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
                                    <span>{(item.price * item.quantity).toLocaleString('ru-RU')} ₽</span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {users.map((user) => (
                    <Card key={user.id} className={user.isBlocked ? 'opacity-60' : ''}>
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={user.photoURL} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {(user.firstName?.[0] || user.username[0]).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <CardTitle className="text-lg">
                              {user.firstName || user.username}
                              {user.lastName && ` ${user.lastName}`}
                            </CardTitle>
                            {user.isBlocked && (
                              <Badge variant="destructive" className="mt-1">
                                <Ban className="h-3 w-3 mr-1" />
                                Заблокирован
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Логин:</span> {user.username}</p>
                            <p><span className="font-medium">Email:</span> {user.email}</p>
                            {user.phone && <p><span className="font-medium">Телефон:</span> {user.phone}</p>}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={user.role === 'admin' ? 'destructive' : user.role === 'manager' ? 'secondary' : 'outline'}
                            >
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              {user.role === 'admin' ? 'Администратор' : user.role === 'manager' ? 'Менеджер' : 'Пользователь'}
                            </Badge>
                          </div>

                          <div className="flex flex-col gap-2 pt-2 border-t">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">Роль:</span>
                              <Select
                                value={user.role}
                                onValueChange={(value) => handleChangeRole(user.id, value as any)}
                              >
                                <SelectTrigger className="w-full h-8 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">Пользователь</SelectItem>
                                  <SelectItem value="manager">Менеджер</SelectItem>
                                  <SelectItem value="admin">Администратор</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <Button
                              variant={user.isBlocked ? "outline" : "destructive"}
                              size="sm"
                              className="w-full"
                              onClick={() => handleToggleBlock(user.id, user.isBlocked || false)}
                            >
                              {user.isBlocked ? (
                                <>
                                  <ShieldCheck className="h-4 w-4 mr-2" />
                                  Разблокировать
                                </>
                              ) : (
                                <>
                                  <Ban className="h-4 w-4 mr-2" />
                                  Заблокировать
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
      </div>
    </div>
  );
};

export default Admin;