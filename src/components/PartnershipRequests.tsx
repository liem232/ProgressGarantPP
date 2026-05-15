import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getPartnershipRequests, approvePartnershipRequest, rejectPartnershipRequest, PartnershipRequest } from '@/services/partnershipService';
import { CheckCircle2, XCircle, Clock, Building2, User, Mail, Phone, MapPin, Briefcase } from 'lucide-react';

const statusLabels: Record<PartnershipRequest['status'], string> = {
  pending: 'На рассмотрении',
  approved: 'Одобрено',
  rejected: 'Отклонено',
};

const statusIcons = {
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
} as const;

const PartnershipRequests: React.FC = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<PartnershipRequest['status'] | 'all'>('all');
  const [selectedRequest, setSelectedRequest] = useState<PartnershipRequest | null>(null);
  const [dialogType, setDialogType] = useState<'approve' | 'reject' | null>(null);
  const [adminComment, setAdminComment] = useState('');

  const { data: requests = [], isLoading, error } = useQuery<PartnershipRequest[]>({
    queryKey: ['partnershipRequests'],
    queryFn: () => getPartnershipRequests(),
    enabled: isAdmin,
  });

  const filteredRequests = statusFilter === 'all'
    ? requests
    : requests.filter(request => request.status === statusFilter);

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      const success = await approvePartnershipRequest(
        selectedRequest.id!,
        selectedRequest.userId,
        isAdmin ? 'admin' : 'unknown',
        adminComment || undefined
      );

      if (success) {
        toast({
          title: 'Заявка одобрена',
          description: `Пользователь ${selectedRequest.userName} теперь является партнером`,
        });
        queryClient.invalidateQueries({ queryKey: ['partnershipRequests'] });
        queryClient.invalidateQueries({ queryKey: ['users'] });
        setSelectedRequest(null);
        setDialogType(null);
        setAdminComment('');
      } else {
        toast({
          title: 'Ошибка',
          description: 'Не удалось одобрить заявку',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при одобрении заявки',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    try {
      const success = await rejectPartnershipRequest(
        selectedRequest.id!,
        isAdmin ? 'admin' : 'unknown',
        adminComment || undefined
      );

      if (success) {
        toast({
          title: 'Заявка отклонена',
          description: 'Заявка была отклонена с комментарием',
        });
        queryClient.invalidateQueries({ queryKey: ['partnershipRequests'] });
        setSelectedRequest(null);
        setDialogType(null);
        setAdminComment('');
      } else {
        toast({
          title: 'Ошибка',
          description: 'Не удалось отклонить заявку',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при отклонении заявки',
        variant: 'destructive',
      });
    }
  };

  const openDialog = (request: PartnershipRequest, type: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setDialogType(type);
    setAdminComment('');
  };

  const closeDialog = () => {
    setSelectedRequest(null);
    setDialogType(null);
    setAdminComment('');
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Заявки на партнерство</h1>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Фильтр:</span>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PartnershipRequest['status'] | 'all')}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Все статусы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все заявки ({requests.length})</SelectItem>
                <SelectItem value="pending">На рассмотрении ({requests.filter(r => r.status === 'pending').length})</SelectItem>
                <SelectItem value="approved">Одобрено ({requests.filter(r => r.status === 'approved').length})</SelectItem>
                <SelectItem value="rejected">Отклонено ({requests.filter(r => r.status === 'rejected').length})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Загрузка заявок...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Не удалось загрузить заявки</p>
            </CardContent>
          </Card>
        ) : filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {statusFilter === 'all' ? 'Заявок пока нет' : `Заявок со статусом "${statusLabels[statusFilter]}" нет`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredRequests.map((request) => {
              const StatusIcon = statusIcons[request.status];

              return (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          {request.companyName}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {request.contactPerson} • {request.userEmail}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {request.createdAt?.toDate ? request.createdAt.toDate().toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }) : new Date(request.createdAt.seconds * 1000).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={request.status === 'approved' ? 'default' : request.status === 'rejected' ? 'destructive' : 'secondary'}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusLabels[request.status]}
                        </Badge>

                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => openDialog(request, 'approve')}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Одобрить
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openDialog(request, 'reject')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Отклонить
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Пользователь:</span>
                          <span>{request.userName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Email:</span>
                          <span>{request.userEmail}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Телефон:</span>
                          <span>{request.userPhone}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Адрес:</span>
                          <span>{request.address || 'Не указан'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Тип бизнеса:</span>
                          <span>
                            {request.businessType === 'tobacco-shop' && 'Табачный магазин'}
                            {request.businessType === 'hookah-bar' && 'Кальян-бар'}
                            {request.businessType === 'convenience-store' && 'Продуктовый магазин'}
                            {request.businessType === 'gas-station' && 'АЗС'}
                            {request.businessType === 'other' && 'Другое'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Опыт:</span>
                          <span>
                            {request.experience === 'less-1' && 'Менее 1 года'}
                            {request.experience === '1-3' && '1-3 года'}
                            {request.experience === '3-5' && '3-5 лет'}
                            {request.experience === 'more-5' && 'Более 5 лет'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {request.message && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground">{request.message}</p>
                      </div>
                    )}

                    {request.adminComment && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium">Комментарий администратора:</p>
                        <p className="text-sm text-muted-foreground">{request.adminComment}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={!!dialogType} onOpenChange={closeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {dialogType === 'approve' ? 'Одобрить заявку на партнерство' : 'Отклонить заявку на партнерство'}
              </DialogTitle>
              <DialogDescription>
                {dialogType === 'approve'
                  ? `Вы уверены, что хотите одобрить заявку от ${selectedRequest?.companyName}? Пользователь получит статус партнера и доступ к оптовым ценам.`
                  : `Вы уверены, что хотите отклонить заявку от ${selectedRequest?.companyName}?`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="adminComment">Комментарий (необязательно)</Label>
                <Textarea
                  id="adminComment"
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  placeholder={dialogType === 'approve' ? 'Укажите условия сотрудничества...' : 'Укажите причину отклонения...'}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Отмена
              </Button>
              <Button
                variant={dialogType === 'approve' ? 'default' : 'destructive'}
                onClick={dialogType === 'approve' ? handleApprove : handleReject}
              >
                {dialogType === 'approve' ? 'Одобрить' : 'Отклонить'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PartnershipRequests;
