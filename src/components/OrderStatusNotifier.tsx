import React, { useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getOrders, Order } from '@/services/ordersService';

const ORDER_STATUS_SNAPSHOT_PREFIX = 'progressgarant_order_status_snapshot';

const statusLabels: Record<Order['status'], string> = {
  pending: 'ожидает обработки',
  processing: 'переведен в обработку',
  completed: 'выполнен',
  cancelled: 'отменен',
};

type OrderStatusSnapshot = Record<string, Order['status']>;

const parseSnapshot = (value: string | null): OrderStatusSnapshot | null => {
  if (!value) return null;

  try {
    return JSON.parse(value) as OrderStatusSnapshot;
  } catch {
    return null;
  }
};

const buildSnapshot = (orders: Order[]): OrderStatusSnapshot => {
  return orders.reduce<OrderStatusSnapshot>((snapshot, order) => {
    snapshot[order.id] = order.status;
    return snapshot;
  }, {});
};

const OrderStatusNotifier: React.FC = () => {
  const { user, isAdmin, isManager } = useAuth();
  const { toast } = useToast();
  const previousSnapshotRef = useRef<OrderStatusSnapshot | null>(null);

  const isClientUser = !!user && !isAdmin && !isManager;
  const storageKey = useMemo(
    () => (user ? `${ORDER_STATUS_SNAPSHOT_PREFIX}_${user.id}` : ''),
    [user]
  );

  const { data: orders = [] } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: () => getOrders(user?.id),
    enabled: isClientUser,
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (!storageKey) {
      previousSnapshotRef.current = null;
      return;
    }

    const persistedSnapshot = parseSnapshot(localStorage.getItem(storageKey));
    previousSnapshotRef.current = persistedSnapshot;
  }, [storageKey]);

  useEffect(() => {
    if (!isClientUser || !storageKey) return;

    const nextSnapshot = buildSnapshot(orders);
    const previousSnapshot = previousSnapshotRef.current;

    if (previousSnapshot) {
      const changedOrders = orders.filter((order) => {
        const previousStatus = previousSnapshot[order.id];
        return previousStatus && previousStatus !== order.status;
      });

      if (changedOrders.length > 0) {
        const lastChangedOrder = [...changedOrders].sort(
          (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()
        )[0];

        toast({
          title: `Статус заказа №${lastChangedOrder.id} обновлен`,
          description: `Текущий статус заказа: ${statusLabels[lastChangedOrder.status]}.`,
        });
      }
    }

    previousSnapshotRef.current = nextSnapshot;
    localStorage.setItem(storageKey, JSON.stringify(nextSnapshot));
  }, [isClientUser, orders, storageKey, toast]);

  return null;
};

export default OrderStatusNotifier;
