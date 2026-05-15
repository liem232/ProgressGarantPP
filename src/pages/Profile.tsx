import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  User, Package, Clock, CheckCircle2, XCircle, LogOut,
  MapPin, Phone, Mail, Calendar, TrendingUp, ShoppingBag,
  CreditCard, Truck, Camera, Edit
} from 'lucide-react';
import { getOrders, Order } from '@/services/ordersService';

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

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'admin': return 'Администратор';
    case 'manager': return 'Менеджер';
    default: return 'Клиент';
  }
};

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
    case 'manager': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
    default: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
  }
};

const Profile: React.FC = () => {
  const { user, logout, updateUser, isPartner } = useAuth();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    photoURL: user?.photoURL || ''
  });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: () => getOrders(user?.id),
    enabled: !!user,
  });

  if (!user) return null;

  const handleSaveProfile = async () => {
    // Валидация
    if (editForm.firstName && editForm.firstName.length > 50) {
      toast({
        title: "Ошибка",
        description: "Имя не должно превышать 50 символов",
        variant: "destructive"
      });
      return;
    }
    if (editForm.lastName && editForm.lastName.length > 50) {
      toast({
        title: "Ошибка",
        description: "Фамилия не должна превышать 50 символов",
        variant: "destructive"
      });
      return;
    }
    if (editForm.phone && editForm.phone.length > 20) {
      toast({
        title: "Ошибка",
        description: "Телефон не должен превышать 20 символов",
        variant: "destructive"
      });
      return;
    }
    if (editForm.photoURL && editForm.photoURL.length > 500) {
      toast({
        title: "Ошибка",
        description: "Ссылка на аватар слишком длинная",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateUser({
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phone: editForm.phone,
        photoURL: editForm.photoURL
      });
      
      setIsEditDialogOpen(false);
      toast({
        title: "Профиль обновлён",
        description: "Ваши изменения сохранены"
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось сохранить изменения",
        variant: "destructive"
      });
    }
  };

  const completedOrders = orders.filter(o => o.status === 'completed');
  const pendingOrders = orders.filter(o => ['pending', 'processing'].includes(o.status));
  const totalSpent = completedOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const memberSince = new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Header with avatar */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
          <Avatar className="h-24 w-24 border-4 border-primary/20">
            <AvatarImage src={user.photoURL} />
            <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
              {(user.firstName?.[0] || user.username[0]).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">
              {user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.username}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge className={getRoleBadgeColor(user.role)}>
                {getRoleLabel(user.role)}
              </Badge>
              {isPartner && (
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                  Партнер
                </Badge>
              )}
              <span className="text-muted-foreground text-sm">{user.email}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setEditForm({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: user.phone || '',
                photoURL: user.photoURL || ''
              });
              setIsEditDialogOpen(true);
            }} className="gap-2">
              <Edit className="h-4 w-4" />
              Редактировать
            </Button>
            <Button variant="outline" onClick={logout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Выйти
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{orders.length}</p>
                  <p className="text-xs text-muted-foreground">Всего заказов</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedOrders.length}</p>
                  <p className="text-xs text-muted-foreground">Выполнено</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingOrders.length}</p>
                  <p className="text-xs text-muted-foreground">В обработке</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <CreditCard className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalSpent.toLocaleString('ru-RU')} ₽</p>
                  <p className="text-xs text-muted-foreground">Потрачено</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Профиль</TabsTrigger>
            <TabsTrigger value="orders">Мои заказы ({orders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Личная информация
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Телефон</p>
                        <p className="font-medium">{user.phone}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Клиент с</p>
                      <p className="font-medium">{memberSince}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Order Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Активность
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Успешных заказов</span>
                      <span className="font-medium">
                        {orders.length > 0 ? Math.round((completedOrders.length / orders.length) * 100) : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={orders.length > 0 ? (completedOrders.length / orders.length) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-sm">Выполнено</span>
                      </div>
                      <span className="font-medium">{completedOrders.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-sm">В обработке</span>
                      </div>
                      <span className="font-medium">{pendingOrders.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-sm">Отменено</span>
                      </div>
                      <span className="font-medium">
                        {orders.filter(o => o.status === 'cancelled').length}
                      </span>
                    </div>
                  </div>
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
                    <p className="text-muted-foreground">У вас пока нет заказов</p>
                  </CardContent>
                </Card>
              ) : (
                orders.map((order) => {
                  const StatusIcon = statusIcons[order.status];
                  return (
                    <Card key={order.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            Заказ №{order.id}
                          </CardTitle>
                          <Badge variant={statusColors[order.status]}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusLabels[order.status]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.date).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </CardHeader>
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

                          {/* Доставка */}
                          <div className="pt-2 border-t">
                            {order.orderData.address && (
                              <div className="flex justify-between text-sm">
                                <span>Адрес:</span>
                                <span className="text-right max-w-xs">{order.orderData.address}</span>
                              </div>
                            )}
                            {order.orderData.comment && (
                              <div className="flex justify-between text-sm">
                                <span>Комментарий:</span>
                                <span className="text-right max-w-xs">{order.orderData.comment}</span>
                              </div>
                            )}
                          </div>

                          {/* Итого */}
                          <div className="pt-2 border-t">
                            <div className="flex justify-between font-medium">
                              <span>Итого ({order.totalItems} шт.):</span>
                              <span className="text-primary">{order.totalPrice.toLocaleString('ru-RU')} ₽</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Диалог редактирования профиля */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Редактировать профиль</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="firstName">Имя</Label>
                <Input
                  id="firstName"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                  maxLength={50}
                  placeholder="Ваше имя"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Фамилия</Label>
                <Input
                  id="lastName"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                  maxLength={50}
                  placeholder="Ваша фамилия"
                />
              </div>
              <div>
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  value={editForm.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9+\-\s()]/g, '');
                    setEditForm({...editForm, phone: value});
                  }}
                  maxLength={20}
                  placeholder="+7 (999) 123-45-67"
                />
              </div>
              <div>
                <Label htmlFor="photoURL">Ссылка на аватар</Label>
                <Input
                  id="photoURL"
                  value={editForm.photoURL}
                  onChange={(e) => setEditForm({...editForm, photoURL: e.target.value})}
                  maxLength={500}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleSaveProfile}>
                Сохранить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Profile;