import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Download, TrendingUp, ShoppingCart, Users, DollarSign, ArrowLeft, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getOrders, Order } from '@/services/ordersService';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import * as XLSX from 'xlsx';

const ManagerReports: React.FC = () => {
  const [dateRange, setDateRange] = useState('30'); // 30 дней по умолчанию
  const { toast } = useToast();
  const navigate = useNavigate();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => getOrders(),
  });

  const reportData = useMemo(() => {
    if (!orders.length) return {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      totalCustomers: 0,
      ordersByStatus: {},
      recentOrders: []
    };

    const days = parseInt(dateRange);
    const cutoffDate = subDays(new Date(), days);
    const filteredOrders = orders.filter((order: Order) => 
      order.createdAt?.toDate && order.createdAt.toDate() >= cutoffDate
    );

    // Базовая статистика
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum: number, order: Order) => 
      order.status !== 'cancelled' ? sum + order.totalPrice : sum, 0
    );
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalCustomers = new Set(filteredOrders.map((order: Order) => order.orderData.email)).size;

    // Заказы по статусам
    const ordersByStatus = filteredOrders.reduce((acc: Record<string, number>, order: Order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    // Последние заказы
    const recentOrders = filteredOrders
      .sort((a: Order, b: Order) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 20);

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      totalCustomers,
      ordersByStatus,
      recentOrders
    };
  }, [orders, dateRange]);

  const handleExportReport = () => {
    // Создаем книгу Excel
    const wb = XLSX.utils.book_new();
    
    // 1. Таблица основных показателей
    const metricsData = [
      ['ОСНОВНЫЕ ПОКАЗАТЕЛИ', '', ''],
      ['', '', ''],
      ['Период анализа: ' + dateRange + ' дней', '', ''],
      ['Дата генерации: ' + format(new Date(), 'dd.MM.yyyy HH:mm', { locale: ru }), '', ''],
      ['', '', ''],
      ['Метрика', 'Значение', 'Единица'],
      ['Всего заказов', reportData.totalOrders, 'шт.'],
      ['Общая выручка', reportData.totalRevenue, 'руб.'],
      ['Средний чек', Math.round(reportData.averageOrderValue), 'руб.'],
      ['Уникальных клиентов', reportData.totalCustomers, 'чел.']
    ];
    const wsMetrics = XLSX.utils.aoa_to_sheet(metricsData);
    
    // Форматирование для таблицы показателей
    wsMetrics['!cols'] = [
      { width: 30 }, // Метрика
      { width: 20 }, // Значение  
      { width: 15 }  // Единица
    ];
    
    // Объединение ячеек для заголовка
    wsMetrics['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, // Заголовок
      { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } }, // Период
      { s: { r: 3, c: 0 }, e: { r: 3, c: 2 } }, // Дата
    ];
    
    XLSX.utils.book_append_sheet(wb, wsMetrics, 'Показатели');
    
    // 2. Таблица статусов заказов
    const statusData = [
      ['СТАТУСЫ ЗАКАЗОВ', '', '', ''],
      ['', '', '', ''],
      ['Статус', 'Количество', 'Процент', 'Приоритет']
    ];
    Object.entries(reportData.ordersByStatus).forEach(([status, count]) => {
      const percentage = reportData.totalOrders > 0 ? ((count / reportData.totalOrders) * 100).toFixed(1) : '0';
      const statusName = statusLabels[status as keyof typeof statusLabels];
      let priority = '';
      if (status === 'pending') priority = 'ВЫСОКИЙ';
      else if (status === 'processing') priority = 'СРЕДНИЙ';
      else if (status === 'completed') priority = 'НИЗКИЙ';
      else if (status === 'cancelled') priority = 'ОТМЕНЕН';
      
      statusData.push([statusName, count, percentage + '%', priority]);
    });
    
    const wsStatus = XLSX.utils.aoa_to_sheet(statusData);
    wsStatus['!cols'] = [
      { width: 25 }, // Статус
      { width: 15 }, // Количество
      { width: 15 }, // Процент
      { width: 15 }  // Приоритет
    ];
    
    wsStatus['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Заголовок
    ];
    
    XLSX.utils.book_append_sheet(wb, wsStatus, 'Статусы');
    
    // 3. Детальная таблица заказов с контактами
    const ordersData = [
      ['СПИСОК ЗАКАЗОВ', '', '', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', '', '', ''],
      ['ID заказа', 'Дата', 'Время', 'Клиент', 'Телефон', 'Email', 'Город', 'Адрес', 'Сумма (₽)', 'Статус', 'Товаров']
    ];
    
    reportData.recentOrders.forEach((order) => {
      const customerName = `${order.orderData.firstName} ${order.orderData.lastName}`;
      const orderDate = order.createdAt?.toDate ? 
                       format(order.createdAt.toDate(), 'dd.MM.yyyy HH:mm', { locale: ru }) : 
                       'N/A';
      const [date, time] = orderDate.split(' ');
      const statusName = statusLabels[order.status];
      
      ordersData.push([
        '#' + order.id.slice(-6),
        date,
        time,
        customerName,
        order.orderData.phone,
        order.orderData.email,
        order.orderData.city,
        order.orderData.address,
        order.totalPrice,
        statusName,
        order.totalItems
      ]);
    });
    
    const wsOrders = XLSX.utils.aoa_to_sheet(ordersData);
    wsOrders['!cols'] = [
      { width: 12 }, // ID
      { width: 12 }, // Дата
      { width: 10 }, // Время
      { width: 30 }, // Клиент
      { width: 18 }, // Телефон
      { width: 35 }, // Email
      { width: 20 }, // Город
      { width: 35 }, // Адрес
      { width: 15 }, // Сумма
      { width: 20 }, // Статус
      { width: 10 }  // Товаров
    ];
    
    wsOrders['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }, // Заголовок
    ];
    
    XLSX.utils.book_append_sheet(wb, wsOrders, 'Заказы');
    
    // Добавляем цветовое форматирование
    const addStyling = (ws: XLSX.WorkSheet, range: string, bgColor: string, fontColor: string = '000000', bold: boolean = false) => {
      if (!ws['!cols']) ws['!cols'] = [];
      if (!ws['!rows']) ws['!rows'] = [];
      
      // Применяем стили к диапазону ячеек
      const cells = range.split(':');
      const start = XLSX.utils.decode_cell(cells[0]);
      const end = cells.length > 1 ? XLSX.utils.decode_cell(cells[1]) : start;
      
      for (let R = start.r; R <= end.r; R++) {
        for (let C = start.c; C <= end.c; C++) {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellRef]) ws[cellRef] = {};
          if (!ws[cellRef].s) ws[cellRef].s = {};
          
          ws[cellRef].s.fill = { fgColor: { rgb: bgColor } };
          ws[cellRef].s.font = { color: { rgb: fontColor }, bold: bold };
          ws[cellRef].s.alignment = { vertical: 'center', horizontal: 'center' };
          ws[cellRef].s.border = {
            top: { style: 'thin', color: { rgb: 'D0D0D0' } },
            bottom: { style: 'thin', color: { rgb: 'D0D0D0' } },
            left: { style: 'thin', color: { rgb: 'D0D0D0' } },
            right: { style: 'thin', color: { rgb: 'D0D0D0' } }
          };
        }
      }
    };

    // Применяем стили к заголовкам
    addStyling(wsMetrics, 'A1:C1', '2E86AB', 'FFFFFF', true); // Синий заголовок
    addStyling(wsMetrics, 'A6:C6', '4A90E2', 'FFFFFF', true); // Заголовки таблицы
    
    addStyling(wsStatus, 'A1:D1', '2E86AB', 'FFFFFF', true); // Синий заголовок
    addStyling(wsStatus, 'A3:D3', '4A90E2', 'FFFFFF', true); // Заголовки таблицы
    
    addStyling(wsOrders, 'A1:K1', '2E86AB', 'FFFFFF', true); // Синий заголовок
    addStyling(wsOrders, 'A3:K3', '4A90E2', 'FFFFFF', true); // Заголовки таблицы

    // Условное форматирование для данных
    const addConditionalFormatting = (ws: XLSX.WorkSheet, data: any[][], startRow: number) => {
      for (let i = 0; i < data.length; i++) {
        const row = startRow + i;
        
        // Чередующиеся строки для лучшей читаемости
        const bgColor = i % 2 === 0 ? 'F8F9FA' : 'FFFFFF';
        
        for (let col = 0; col < data[i].length; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          if (!ws[cellRef]) ws[cellRef] = {};
          if (!ws[cellRef].s) ws[cellRef].s = {};
          
          ws[cellRef].s.fill = { fgColor: { rgb: bgColor } };
          ws[cellRef].s.alignment = { vertical: 'center' };
          ws[cellRef].s.border = {
            top: { style: 'thin', color: { rgb: 'E0E0E0' } },
            bottom: { style: 'thin', color: { rgb: 'E0E0E0' } },
            left: { style: 'thin', color: { rgb: 'E0E0E0' } },
            right: { style: 'thin', color: { rgb: 'E0E0E0' } }
          };
          
          // Выравнивание для числовых данных
          if (typeof data[i][col] === 'number') {
            ws[cellRef].s.alignment.horizontal = 'right';
          } else {
            ws[cellRef].s.alignment.horizontal = 'left';
          }
        }
      }
    };

    // Применяем условное форматирование к данным
    const metricsRows = [
      ['Всего заказов', reportData.totalOrders, 'шт.'],
      ['Общая выручка', reportData.totalRevenue, 'руб.'],
      ['Средний чек', Math.round(reportData.averageOrderValue), 'руб.'],
      ['Уникальных клиентов', reportData.totalCustomers, 'чел.']
    ];
    addConditionalFormatting(wsMetrics, metricsRows, 7);

    // Форматирование для статусов с цветовой индикацией
    const statusRows = [];
    Object.entries(reportData.ordersByStatus).forEach(([status, count]) => {
      const percentage = reportData.totalOrders > 0 ? ((count / reportData.totalOrders) * 100).toFixed(1) : '0';
      const statusName = statusLabels[status as keyof typeof statusLabels];
      let priority = '';
      let priorityColor = '';
      if (status === 'pending') { priority = 'ВЫСОКИЙ'; priorityColor = 'FF6B6B'; }
      else if (status === 'processing') { priority = 'СРЕДНИЙ'; priorityColor = 'FFA500'; }
      else if (status === 'completed') { priority = 'НИЗКИЙ'; priorityColor = '51CF66'; }
      else if (status === 'cancelled') { priority = 'ОТМЕНЕН'; priorityColor = '868E96'; }
      
      statusRows.push([statusName, count, percentage + '%', priority]);
      
      // Применяем цвет к приоритету
      const priorityCellRef = XLSX.utils.encode_cell({ r: 3 + statusRows.length, c: 3 });
      if (!wsStatus[priorityCellRef]) wsStatus[priorityCellRef] = {};
      if (!wsStatus[priorityCellRef].s) wsStatus[priorityCellRef].s = {};
      wsStatus[priorityCellRef].s.fill = { fgColor: { rgb: priorityColor } };
      wsStatus[priorityCellRef].s.font = { color: { rgb: 'FFFFFF' }, bold: true };
    });
    addConditionalFormatting(wsStatus, statusRows, 4);

    // Улучшенное именование файла с датой и периодом
    const fileName = `Отчет_заказов_${format(new Date(), 'dd.MM.yyyy')}_(${dateRange}дн).xlsx`;
    
    // Сохраняем Excel файл
    XLSX.writeFile(wb, fileName);

    toast({
      title: "Excel отчет создан",
      description: `Файл ${fileName} сохранен с красивым форматированием`,
    });
  };

  const statusLabels = {
    pending: 'Ожидает обработки',
    processing: 'В обработке',
    completed: 'Выполнен',
    cancelled: 'Отменен'
  };

  const statusColors = {
    pending: 'default',
    processing: 'secondary',
    completed: 'default',
    cancelled: 'destructive'
  } as const;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/orders')}
            className="flex items-center gap-2 min-h-[44px] w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            К заказам
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Отчетность по заказам</h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Статистика заказов и информация о клиентах
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full sm:w-32 min-h-[44px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 дней</SelectItem>
              <SelectItem value="30">30 дней</SelectItem>
              <SelectItem value="90">90 дней</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportReport} className="min-h-[44px] w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            <span className="sm:hidden">Excel</span>
            <span className="hidden sm:inline">Экспорт Excel</span>
          </Button>
        </div>
      </div>

      {/* Ключевые метрики */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card className="touch-manipulation">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Всего заказов</p>
                <p className="text-xl sm:text-2xl font-bold">{reportData.totalOrders}</p>
              </div>
              <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>
        <Card className="touch-manipulation">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Выручка</p>
                <p className="text-xl sm:text-2xl font-bold truncate">{reportData.totalRevenue.toLocaleString('ru-RU')} ₽</p>
              </div>
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>
        <Card className="touch-manipulation">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Средний чек</p>
                <p className="text-xl sm:text-2xl font-bold truncate">{Math.round(reportData.averageOrderValue).toLocaleString('ru-RU')} ₽</p>
              </div>
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>
        <Card className="touch-manipulation">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Клиентов</p>
                <p className="text-xl sm:text-2xl font-bold">{reportData.totalCustomers}</p>
              </div>
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Заказы по статусам */}
      <Card className="mb-6">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle>Заказы по статусам</CardTitle>
          <CardDescription>
            Распределение заказов по текущему статусу
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {Object.entries(reportData.ordersByStatus).map(([status, count]) => (
              <Card key={status} className="touch-manipulation">
                <CardContent className="p-3 sm:p-4 text-center">
                  <Badge variant={statusColors[status as keyof typeof statusColors]} className="mb-2 text-xs sm:text-sm">
                    {statusLabels[status as keyof typeof statusLabels]}
                  </Badge>
                  <div className="text-xl sm:text-2xl font-bold">{count}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {reportData.totalOrders > 0 ? Math.round((count / reportData.totalOrders) * 100) : 0}%
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Последние заказы */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle>Последние заказы</CardTitle>
          <CardDescription>
            Детальная информация о последних заказах
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[80px]">ID</TableHead>
                  <TableHead className="min-w-[150px]">Клиент</TableHead>
                  <TableHead className="min-w-[130px]">Телефон</TableHead>
                  <TableHead className="min-w-[100px]">Сумма</TableHead>
                  <TableHead className="min-w-[120px]">Статус</TableHead>
                  <TableHead className="min-w-[130px]">Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Заказы за выбранный период отсутствуют
                    </TableCell>
                  </TableRow>
                ) : (
                  reportData.recentOrders.map((order: Order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">
                        {order.id.slice(-8)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm sm:text-base">
                            {order.orderData.firstName} {order.orderData.lastName}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            {order.orderData.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm sm:text-base whitespace-nowrap">{order.orderData.phone}</TableCell>
                      <TableCell className="font-medium text-sm sm:text-base">
                        {order.totalPrice.toLocaleString('ru-RU')} ₽
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[order.status]} className="text-xs sm:text-sm">
                          {statusLabels[order.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm sm:text-base whitespace-nowrap">
                        {order.createdAt?.toDate ? 
                          format(order.createdAt.toDate(), 'dd.MM.yyyy HH:mm', { locale: ru }) : 
                          'N/A'
                        }
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerReports;
