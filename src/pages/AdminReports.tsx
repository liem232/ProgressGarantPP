import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Download, TrendingUp, ShoppingCart, Users, DollarSign, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getOrders, Order } from '@/services/ordersService';
import { getProducts } from '@/services/productsService';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface ReportData {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalCustomers: number;
  ordersByStatus: Record<string, number>;
  salesByDay: Array<{ date: string; sales: number; orders: number }>;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  recentOrders: Order[];
  categoryStats: Array<{ category: string; orders: number; revenue: number; percentage: number }>;
  monthlyGrowth: number;
  dailyAverage: number;
}

const AdminReports: React.FC = () => {
  const [dateRange, setDateRange] = useState('30'); // 30 дней по умолчанию
  const { toast } = useToast();

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => getOrders(),
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  const reportData = useMemo(() => {
    if (!orders.length) return {} as ReportData;

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

    // Продажи по дням
    const salesByDay: Array<{ date: string; sales: number; orders: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const dayOrders = filteredOrders.filter((order: Order) => {
        const orderDate = order.createdAt?.toDate();
        return orderDate && orderDate >= dayStart && orderDate <= dayEnd;
      });

      const daySales = dayOrders.reduce((sum: number, order: Order) => 
        order.status !== 'cancelled' ? sum + order.totalPrice : sum, 0
      );

      salesByDay.push({
        date: format(date, 'dd.MM', { locale: ru }),
        sales: daySales,
        orders: dayOrders.length
      });
    }

    // Топ товаров
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    filteredOrders.forEach((order: Order) => {
      if (order.status !== 'cancelled') {
        order.items.forEach(item => {
          if (!productSales[item.id]) {
            productSales[item.id] = { name: item.name, quantity: 0, revenue: 0 };
          }
          productSales[item.id].quantity += item.quantity;
          productSales[item.id].revenue += item.price * item.quantity;
        });
      }
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Статистика по категориям
    const categorySales: Record<string, { orders: number; revenue: number }> = {};
    filteredOrders.forEach((order: Order) => {
      if (order.status !== 'cancelled') {
        order.items.forEach(item => {
          // Определяем категорию по названию товара (упрощенно)
          let category = 'Другое';
          if (item.name.toLowerCase().includes('кальян')) category = 'Кальяны';
          else if (item.name.toLowerCase().includes('табак')) category = 'Табак';
          else if (item.name.toLowerCase().includes('бкс') || item.name.toLowerCase().includes('смесь')) category = 'Бестабачные смеси';
          else if (item.name.toLowerCase().includes('сигарет') || item.name.toLowerCase().includes('split')) category = 'Электронные сигареты';
          else if (item.name.toLowerCase().includes('уголь') || item.name.toLowerCase().includes('щипц')) category = 'Аксессуары';

          if (!categorySales[category]) {
            categorySales[category] = { orders: 0, revenue: 0 };
          }
          categorySales[category].orders += 1;
          categorySales[category].revenue += item.price * item.quantity;
        });
      }
    });

    const categoryStats = Object.entries(categorySales).map(([category, data]) => ({
      category,
      orders: data.orders,
      revenue: data.revenue,
      percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
    })).sort((a, b) => b.revenue - a.revenue);

    // Последние заказы
    const recentOrders = filteredOrders
      .sort((a: Order, b: Order) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 20);

    // Рост по сравнению с предыдущим периодом
    const previousPeriodStart = subDays(cutoffDate, days);
    const previousPeriodOrders = orders.filter((order: Order) => {
      const orderDate = order.createdAt?.toDate();
      return orderDate && orderDate >= previousPeriodStart && orderDate < cutoffDate;
    });
    const previousRevenue = previousPeriodOrders.reduce((sum: number, order: Order) => 
      order.status !== 'cancelled' ? sum + order.totalPrice : sum, 0
    );
    const monthlyGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    // Средний дневной доход
    const dailyAverage = totalRevenue / days;

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      totalCustomers,
      ordersByStatus,
      salesByDay,
      topProducts,
      recentOrders,
      categoryStats,
      monthlyGrowth,
      dailyAverage
    } as ReportData;
  }, [orders, dateRange]);

  const handleExportReport = () => {
    // Создаем книгу Excel
    const wb = XLSX.utils.book_new();
    
    // 1. Таблица основных показателей
    const metricsData = [
      ['ПОКАЗАТЕЛИ', '', ''],
      ['', '', ''],
      ['Период анализа: ' + dateRange + ' дней', '', ''],
      ['Дата генерации: ' + format(new Date(), 'dd.MM.yyyy HH:mm', { locale: ru }), '', ''],
      ['', '', ''],
      ['Метрика', 'Значение', 'Единица'],
      ['Всего заказов', reportData.totalOrders, 'шт.'],
      ['Общая выручка', reportData.totalRevenue, 'руб.'],
      ['Средний чек', Math.round(reportData.averageOrderValue), 'руб.'],
      ['Клиентов всего', reportData.totalCustomers, 'чел.'],
      ['Рост к прошлому периоду', (reportData.monthlyGrowth >= 0 ? '+' : '') + reportData.monthlyGrowth.toFixed(1) + '%', ''],
      ['Средний дневной доход', Math.round(reportData.dailyAverage), 'руб.']
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
    
    // 3. Таблица категорий
    const categoryData = [
      ['АНАЛИЗ ПО КАТЕГОРИЯМ', '', '', '', ''],
      ['', '', '', '', ''],
      ['Категория', 'Заказы', 'Выручка (₽)', 'Средний чек (₽)', 'Доля (%)']
    ];
    reportData.categoryStats.forEach(category => {
      const avgCheck = category.orders > 0 ? Math.round(category.revenue / category.orders) : 0;
      categoryData.push([
        category.category, 
        category.orders, 
        category.revenue, 
        avgCheck, 
        category.percentage.toFixed(1)
      ]);
    });
    
    const wsCategory = XLSX.utils.aoa_to_sheet(categoryData);
    wsCategory['!cols'] = [
      { width: 25 }, // Категория
      { width: 12 }, // Заказы
      { width: 18 }, // Выручка
      { width: 18 }, // Средний чек
      { width: 12 }  // Доля
    ];
    
    wsCategory['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Заголовок
    ];
    
    XLSX.utils.book_append_sheet(wb, wsCategory, 'Категории');
    
    // 4. Таблица топ товаров
    const productsData = [
      ['ТОП-10 ТОВАРОВ', '', '', '', '', ''],
      ['', '', '', '', '', ''],
      ['№', 'Наименование товара', 'Продано (шт.)', 'Выручка (₽)', 'Средняя цена (₽)', 'Рейтинг']
    ];
    reportData.topProducts.forEach((product, index) => {
      const avgPrice = product.quantity > 0 ? Math.round(product.revenue / product.quantity) : 0;
      const rating = '★'.repeat(Math.min(5, Math.ceil(product.quantity / 5)));
      
      productsData.push([
        index + 1,
        product.name,
        product.quantity,
        product.revenue,
        avgPrice,
        rating
      ]);
    });
    
    const wsProducts = XLSX.utils.aoa_to_sheet(productsData);
    wsProducts['!cols'] = [
      { width: 8 },  // №
      { width: 45 }, // Наименование
      { width: 15 }, // Продано
      { width: 18 }, // Выручка
      { width: 18 }, // Цена средняя
      { width: 12 }  // Рейтинг
    ];
    
    wsProducts['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Заголовок
    ];
    
    XLSX.utils.book_append_sheet(wb, wsProducts, 'Товары');
    
    // 5. Детальная таблица заказов
    const ordersData = [
      ['ДЕТАЛИЗАЦИЯ ЗАКАЗОВ', '', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', ''],
      ['ID заказа', 'Дата', 'Время', 'Клиент', 'Телефон', 'Email', 'Сумма (₽)', 'Статус', 'Товаров']
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
      { width: 30 }, // Email
      { width: 15 }, // Сумма
      { width: 20 }, // Статус
      { width: 10 }  // Товаров
    ];
    
    wsOrders['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // Заголовок
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
    
    addStyling(wsCategory, 'A1:E1', '2E86AB', 'FFFFFF', true); // Синий заголовок
    addStyling(wsCategory, 'A3:E3', '4A90E2', 'FFFFFF', true); // Заголовки таблицы
    
    addStyling(wsProducts, 'A1:F1', '2E86AB', 'FFFFFF', true); // Синий заголовок
    addStyling(wsProducts, 'A3:F3', '4A90E2', 'FFFFFF', true); // Заголовки таблицы
    
    addStyling(wsOrders, 'A1:I1', '2E86AB', 'FFFFFF', true); // Синий заголовок
    addStyling(wsOrders, 'A3:I3', '4A90E2', 'FFFFFF', true); // Заголовки таблицы

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
      ['Клиентов всего', reportData.totalCustomers, 'чел.'],
      ['Рост к прошлому периоду', (reportData.monthlyGrowth >= 0 ? '+' : '') + reportData.monthlyGrowth.toFixed(1) + '%', ''],
      ['Средний дневной доход', Math.round(reportData.dailyAverage), 'руб.']
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
    const fileName = `Отчет_продаж_${format(new Date(), 'dd.MM.yyyy')}_(${dateRange}дн).xlsx`;
    
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

  if (ordersLoading || productsLoading) {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Отчетность</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Анализ продаж и статистика заказов
          </p>
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
              <SelectItem value="365">Год</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportReport} className="min-h-[44px] w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            <span className="sm:hidden">Excel</span>
            <span className="hidden sm:inline">Экспорт CSV</span>
          </Button>
        </div>
      </div>

      {/* Ключевые метрики */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
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
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 flex-shrink-0 ml-2" />
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
        <Card className="touch-manipulation">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Рост</p>
                <p className={`text-xl sm:text-2xl font-bold ${reportData.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {reportData.monthlyGrowth >= 0 ? '+' : ''}{reportData.monthlyGrowth.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className={`h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0 ml-2 ${reportData.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>
        <Card className="touch-manipulation">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Средний день</p>
                <p className="text-xl sm:text-2xl font-bold truncate">{Math.round(reportData.dailyAverage).toLocaleString('ru-RU')} ₽</p>
              </div>
              <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* График продаж по дням */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Продажи по дням</CardTitle>
            <CardDescription>
              Динамика продаж за выбранный период
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <div className="space-y-2">
                {reportData.salesByDay.slice(-7).map((day, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-12 text-xs text-muted-foreground">{day.date}</div>
                    <div className="flex-1 bg-secondary rounded-full h-6 relative">
                      <div 
                        className="absolute left-0 top-0 h-full bg-primary rounded-full"
                        style={{ 
                          width: `${Math.min((day.sales / Math.max(...reportData.salesByDay.map(d => d.sales))) * 100, 100)}%` 
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                        {day.sales.toLocaleString('ru-RU')} ₽
                      </div>
                    </div>
                    <div className="w-8 text-xs text-muted-foreground text-right">{day.orders}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Заказы по статусам */}
        <Card>
          <CardHeader>
            <CardTitle>Заказы по статусам</CardTitle>
            <CardDescription>
              Распределение заказов
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(reportData.ordersByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={statusColors[status as keyof typeof statusColors]}>
                      {statusLabels[status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-secondary rounded-full h-4 relative">
                      <div 
                        className="absolute left-0 top-0 h-full bg-primary rounded-full"
                        style={{ 
                          width: `${(count / reportData.totalOrders) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Статистика по категориям */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Статистика по категориям</CardTitle>
          <CardDescription>
            Анализ продаж по категориям товаров
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Категория</TableHead>
                  <TableHead className="text-right min-w-[80px]">Заказы</TableHead>
                  <TableHead className="text-right min-w-[100px]">Выручка</TableHead>
                  <TableHead className="text-right min-w-[100px]">Доля</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.categoryStats.map((category, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{category.category}</TableCell>
                    <TableCell className="text-right">{category.orders}</TableCell>
                    <TableCell className="text-right font-medium">
                      {category.revenue.toLocaleString('ru-RU')} ₽
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-secondary rounded-full h-2 relative flex-shrink-0">
                          <div 
                            className="absolute left-0 top-0 h-full bg-primary rounded-full"
                            style={{ width: `${category.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          {category.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Топ товаров */}
        <Card>
          <CardHeader>
            <CardTitle>Топ товаров</CardTitle>
            <CardDescription>
              Самые популярные товары за выбранный период
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Название товара</TableHead>
                    <TableHead className="text-right min-w-[80px]">Кол-во</TableHead>
                    <TableHead className="text-right min-w-[100px]">Выручка</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.topProducts.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-right">{product.quantity}</TableCell>
                      <TableCell className="text-right">{product.revenue.toLocaleString('ru-RU')} ₽</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Последние заказы */}
        <Card>
          <CardHeader>
            <CardTitle>Последние заказы</CardTitle>
            <CardDescription>
              Детальная информация о последних заказах
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {reportData.recentOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Заказы отсутствуют</p>
              ) : (
                reportData.recentOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={statusColors[order.status]}>
                          {statusLabels[order.status]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          #{order.id.slice(-6)}
                        </span>
                      </div>
                      <span className="font-bold">
                        {order.totalPrice.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">
                        {order.orderData.firstName} {order.orderData.lastName}
                      </p>
                      <p className="text-muted-foreground">{order.orderData.email}</p>
                      <p className="text-muted-foreground">
                        {order.totalItems} товар(ов) • {
                          order.createdAt?.toDate ? 
                          format(order.createdAt.toDate(), 'dd.MM.yyyy HH:mm', { locale: ru }) : 
                          'N/A'
                        }
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminReports;
