import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getOrders, updateOrderStatus, Order } from '@/services/ordersService';
import { ArrowLeft, Eye, Package, Clock, CheckCircle2, XCircle, BarChart3 } from 'lucide-react';

const statusLabels: Record<Order['status'], string> = {
  pending: 'Ожидает обработки',
  processing: 'В обработке',
  completed: 'Выполнен',
  cancelled: 'Отменен',
};

const statusIcons = {
  pending: Clock,
  processing: Package,
  completed: CheckCircle2,
  cancelled: XCircle,
} as const;

const ManagerOrders: React.FC = () => {
  const { isManager, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');

  const canAccess = isManager;

  const { data: orders = [], isLoading, error } = useQuery<Order[]>({
    queryKey: ['orders', 'manager'],
    queryFn: () => getOrders(),
    enabled: canAccess,
  });

  // Фильтрация заказов по статусу
  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  const errorShownRef = React.useRef(false);

  useEffect(() => {
    if (!error || errorShownRef.current) return;
    errorShownRef.current = true;
    const errMsg =
      (error && typeof error === 'object' && 'code' in (error as any) && (error as any).code)
        ? `${(error as any).code}: ${(error as any).message || ''}`
        : (error as any)?.message || String(error);
    toast({
      title: 'Ошибка загрузки заказов',
      description: errMsg,
      variant: 'destructive',
    });
  }, [error, toast]);

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      queryClient.invalidateQueries({ queryKey: ['orders', 'manager'] });
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

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Доступ запрещен</h1>
          <p className="text-muted-foreground">У вас нет прав менеджера</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Заказы (менеджер)</h1>
            <Badge variant="secondary">Manager</Badge>
          </div>
          
          {/* Кнопки управления */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/manager/reports')}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Отчетность
            </Button>
            
            {/* Фильтр по статусу */}
            <span className="text-sm font-medium text-muted-foreground">Фильтр:</span>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as Order['status'] | 'all')}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все заказы ({orders.length})</SelectItem>
                <SelectItem value="pending">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Ожидает обработки ({orders.filter(o => o.status === 'pending').length})
                  </div>
                </SelectItem>
                <SelectItem value="processing">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    В обработке ({orders.filter(o => o.status === 'processing').length})
                  </div>
                </SelectItem>
                <SelectItem value="completed">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Выполнен ({orders.filter(o => o.status === 'completed').length})
                  </div>
                </SelectItem>
                <SelectItem value="cancelled">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Отменен ({orders.filter(o => o.status === 'cancelled').length})
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Загрузка заказов...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-foreground font-medium mb-2">Не удалось загрузить заказы</p>
              <p className="text-sm text-muted-foreground break-words">
                {(error as any)?.message || String(error)}
              </p>
            </CardContent>
          </Card>
        ) : filteredOrders.length === 0 ? (
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
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const StatusIcon = statusIcons[order.status];
              const isExpanded = expandedOrder === order.id;

              return (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <StatusIcon className="h-5 w-5 text-primary" />
                          Заказ №{order.id}
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
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleUpdateStatus(order.id, value as Order['status'])}
                        >
                          <SelectTrigger className="w-44">
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
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Товары:</h4>
                          <div className="space-y-2">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span>
                                  {item.name} × {item.quantity}
                                </span>
                                <span>{(item.price * item.quantity).toLocaleString('ru-RU')} ₽</span>
                              </div>
                            ))}
                          </div>
                        </div>

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
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerOrders;
