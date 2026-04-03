import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getOrders } from '@/services/ordersService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Clock, CheckCircle2, XCircle, CreditCard } from 'lucide-react';

const statusLabels = {
  pending: 'Ожидает обработки',
  processing: 'В обработке',
  completed: 'Выполнен',
  cancelled: 'Отменен'
} as const;

const statusIcons = {
  pending: Clock,
  processing: Package,
  completed: CheckCircle2,
  cancelled: XCircle
} as const;

const statusColors = {
  pending: 'default',
  processing: 'secondary',
  completed: 'default',
  cancelled: 'destructive'
} as const;

const Orders: React.FC = () => {
  const { user } = useAuth();

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: () => getOrders(user?.id),
    enabled: !!user,
  });

  if (!user) return null;

  const completedOrders = orders.filter(o => o.status === 'completed');
  const pendingOrders = orders.filter(o => ['pending', 'processing'].includes(o.status));
  const totalSpent = completedOrders.reduce((sum, o) => sum + o.totalPrice, 0);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold">Мои заказы</h1>
          <div className="text-sm text-muted-foreground">{isLoading ? 'Загрузка…' : `Всего: ${orders.length}`}</div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="h-5 w-5 text-primary" />
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

        {error ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Не удалось загрузить заказы</p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Загрузка…</p>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">У вас пока нет заказов</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const StatusIcon = statusIcons[order.status];
              return (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Заказ №{order.id}</CardTitle>
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
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
