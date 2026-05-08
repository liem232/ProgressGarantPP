import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Package, Plus, Minus, Save, RefreshCw, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getProducts, updateProduct } from '@/services/productsService';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ProductInput } from '@/lib/validation';

const StockManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все товары');
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  const updateStockMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      updateProduct(id, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Наличие обновлено",
        description: "Количество товара успешно обновлено",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить наличие товара",
        variant: "destructive",
      });
    },
  });

  const filteredProducts = products.filter((product: any) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Все товары' || product.category === selectedCategory;
    const matchesStock = !showOutOfStock || product.quantity === 0;
    return matchesSearch && matchesCategory && matchesStock;
  });

  const outOfStockCount = products.filter((product: any) => product.quantity === 0).length;

  const categories = ['Все товары', ...Array.from(new Set(products.map((p: any) => p.category)))];

  const handleStockUpdate = (productId: string, newQuantity: number) => {
    if (newQuantity < 0) {
      toast({
        title: "Ошибка",
        description: "Количество не может быть отрицательным",
        variant: "destructive",
      });
      return;
    }
    updateStockMutation.mutate({ id: productId, quantity: newQuantity });
  };

  const bulkStockUpdate = (productId: string, delta: number) => {
    const product = products.find((p: any) => p.id === productId);
    if (product) {
      const newQuantity = Math.max(0, product.quantity + delta);
      handleStockUpdate(productId, newQuantity);
    }
  };

  const handleExportStock = () => {
    // Создаем книгу Excel
    const wb = XLSX.utils.book_new();
    
    // Подготавливаем данные
    const stockData = [
      ['ОТЧЕТ ПО НАЛИЧИЮ ТОВАРОВ', '', '', '', '', ''],
      ['', '', '', '', '', ''],
      ['Дата генерации: ' + format(new Date(), 'dd.MM.yyyy HH:mm', { locale: ru }), '', '', '', '', ''],
      ['Всего товаров: ' + products.length, '', '', '', '', ''],
      ['Товаров в наличии: ' + products.filter((p: any) => p.quantity > 0).length, '', '', '', '', ''],
      ['Товаров отсутствует: ' + products.filter((p: any) => p.quantity === 0).length, '', '', '', '', ''],
      ['', '', '', '', '', ''],
      ['№', 'Наименование', 'Категория', 'Бренд', 'Количество', 'Статус', 'Цена (₽)']
    ];
    
    // Сортируем товары: сначала по наличию (0 в конце), затем по категории
    const sortedProducts = [...products].sort((a: any, b: any) => {
      if (a.quantity === 0 && b.quantity > 0) return 1;
      if (a.quantity > 0 && b.quantity === 0) return -1;
      return (a.category || '').localeCompare(b.category || '');
    });
    
    sortedProducts.forEach((product: any, index: number) => {
      const status = product.quantity === 0 ? 'НЕТ В НАЛИЧИИ' : 
                     product.quantity < 10 ? 'ЗАКАНЧИВАЕТСЯ' : 'В НАЛИЧИИ';
      
      stockData.push([
        index + 1,
        product.name,
        product.category || '-',
        product.brand || '-',
        product.quantity || 0,
        status,
        product.price || 0
      ]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(stockData);
    
    // Настройка ширины колонок
    ws['!cols'] = [
      { width: 6 },   // №
      { width: 40 },  // Наименование
      { width: 20 },  // Категория
      { width: 15 },  // Бренд
      { width: 12 },  // Количество
      { width: 15 },  // Статус
      { width: 12 }   // Цена
    ];
    
    // Объединение ячеек для заголовка
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Заголовок
      { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } }, // Дата
      { s: { r: 3, c: 0 }, e: { r: 3, c: 6 } }, // Всего товаров
      { s: { r: 4, c: 0 }, e: { r: 4, c: 6 } }, // В наличии
      { s: { r: 5, c: 0 }, e: { r: 5, c: 6 } }, // Отсутствует
    ];
    
    // Функция для стилей
    const addStyling = (ws: XLSX.WorkSheet, range: string, bgColor: string, fontColor: string = '000000', bold: boolean = false) => {
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
    
    // Применяем стили
    addStyling(ws, 'A1:G1', '2E86AB', 'FFFFFF', true); // Заголовок
    addStyling(ws, 'A8:G8', '4A90E2', 'FFFFFF', true); // Заголовки таблицы
    
    // Условное форматирование для данных
    for (let i = 0; i < sortedProducts.length; i++) {
      const row = 9 + i;
      const product = sortedProducts[i];
      const bgColor = i % 2 === 0 ? 'F8F9FA' : 'FFFFFF';
      
      for (let col = 0; col < 7; col++) {
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
      }
      
      // Цветовая индикация статуса
      const statusCellRef = XLSX.utils.encode_cell({ r: row, c: 5 });
      let statusColor = '51CF66'; // Зеленый - в наличии
      if (product.quantity === 0) statusColor = 'FF6B6B'; // Красный - нет
      else if (product.quantity < 10) statusColor = 'FFA500'; // Оранжевый - заканчивается
      
      ws[statusCellRef].s.fill = { fgColor: { rgb: statusColor } };
      ws[statusCellRef].s.font = { color: { rgb: 'FFFFFF' }, bold: true };
    }
    
    XLSX.utils.book_append_sheet(wb, ws, 'Наличие товаров');
    
    // Имя файла
    const fileName = `Отчет_наличия_${format(new Date(), 'dd.MM.yyyy')}.xlsx`;
    
    // Сохраняем
    XLSX.writeFile(wb, fileName);
    
    toast({
      title: "Отчет по наличию создан",
      description: `Файл ${fileName} сохранен`,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Управление наличием</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Управление количеством товаров на складе
          </p>
        </div>
        <Button onClick={handleExportStock} variant="outline" className="min-h-[44px] w-full sm:w-auto">
          <Download className="h-4 w-4 mr-2" />
          <span className="sm:hidden">Excel</span>
          <span className="hidden sm:inline">Экспорт наличия</span>
        </Button>
      </div>

      {/* Фильтры */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по названию или бренду..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <Button
              variant={showOutOfStock ? "default" : "outline"}
              onClick={() => setShowOutOfStock(!showOutOfStock)}
              className="flex items-center gap-2 min-h-[44px]"
            >
              <Package className="h-4 w-4" />
              <span className="sm:hidden">{showOutOfStock ? 'Все' : `Нет (${outOfStockCount})`}</span>
              <span className="hidden sm:inline">{showOutOfStock ? 'Все товары' : `Отсутствуют (${outOfStockCount})`}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Статистика */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card className="touch-manipulation">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Всего товаров</p>
                <p className="text-xl sm:text-2xl font-bold">{products.length}</p>
              </div>
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>
        <Card className="touch-manipulation">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">В наличии</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {products.filter((p: any) => p.quantity > 0).length}
                </p>
              </div>
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>
        <Card className="touch-manipulation">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Отсутствуют</p>
                <p className="text-xl sm:text-2xl font-bold text-red-600">
                  {products.filter((p: any) => p.quantity === 0).length}
                </p>
              </div>
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>
        <Card className="touch-manipulation">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">На складе</p>
                <p className="text-xl sm:text-2xl font-bold truncate">
                  {products.reduce((sum: number, p: any) => sum + p.quantity, 0)}
                </p>
              </div>
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Таблица товаров */}
      <Card>
        <CardHeader>
          <CardTitle>Список товаров</CardTitle>
          <CardDescription>
            Управление количеством товаров на складе
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[60px]">Фото</TableHead>
                  <TableHead className="min-w-[150px]">Название</TableHead>
                  <TableHead className="min-w-[100px] hidden sm:table-cell">Бренд</TableHead>
                  <TableHead className="min-w-[120px] hidden md:table-cell">Категория</TableHead>
                  <TableHead className="min-w-[90px]">Цена</TableHead>
                  <TableHead className="min-w-[140px]">Кол-во</TableHead>
                  <TableHead className="min-w-[100px] hidden sm:table-cell">Статус</TableHead>
                  <TableHead className="min-w-[120px]">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product: any) => (
                  <TableRow 
                    key={product.id}
                    className={product.quantity === 0 ? 'bg-red-50 dark:bg-red-950/20' : ''}
                  >
                    <TableCell>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary rounded-md overflow-hidden flex-shrink-0">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-4 w-4 sm:h-6 sm:w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <p className="max-w-[120px] sm:max-w-[200px] truncate text-sm sm:text-base">{product.name}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">{product.brand || '-'} • {product.category}</p>
                        {product.quantity === 0 && (
                          <Badge variant="destructive" className="mt-1 text-xs sm:hidden">
                            Нет в наличии
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{product.brand || '-'}</TableCell>
                    <TableCell className="hidden md:table-cell">{product.category}</TableCell>
                    <TableCell className="text-sm sm:text-base whitespace-nowrap">{product.price.toLocaleString('ru-RU')} ₽</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => bulkStockUpdate(product.id, -1)}
                          disabled={updateStockMutation.isPending}
                          className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                        >
                          <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={product.quantity}
                          onChange={(e) => {
                            const newQuantity = parseInt(e.target.value) || 0;
                            handleStockUpdate(product.id, newQuantity);
                          }}
                          className={`w-14 sm:w-20 text-center text-sm sm:text-base h-8 sm:h-9 ${
                            product.quantity === 0 ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : ''
                          }`}
                          min="0"
                          disabled={updateStockMutation.isPending}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => bulkStockUpdate(product.id, 1)}
                          disabled={updateStockMutation.isPending}
                          className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={product.quantity > 0 ? "default" : "destructive"} className="text-xs sm:text-sm">
                        {product.quantity > 0 ? `В наличии (${product.quantity})` : 'Отсутствует'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStockUpdate(product.id, product.quantity + 10)}
                          disabled={updateStockMutation.isPending}
                          className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                        >
                          <span className="sm:hidden">+10</span>
                          <span className="hidden sm:inline">+10</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStockUpdate(product.id, Math.max(0, product.quantity - 10))}
                          disabled={updateStockMutation.isPending}
                          className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                        >
                          <span className="sm:hidden">-10</span>
                          <span className="hidden sm:inline">-10</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockManagement;
