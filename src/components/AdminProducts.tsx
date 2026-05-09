import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import { getProducts, Product } from '@/services/productsService';
import { getCategories, Category } from '@/services/categoriesService';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const AdminProducts: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    price: 0,
    category: '',
    brand: '',
    description: '',
    inStock: true,
    image: '',
    volume: '',
    strength: '',
    quantity: 0,
  });

  const { data: productsData = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  const { data: categoriesData = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  // Fallback категории из каталога (если из БД ничего не загрузилось)
  const defaultCategories: Category[] = [
    { id: '1', name: 'Кальяны', slug: 'hookahs', image: '/img/catalog1.jpg', order: 1 },
    { id: '2', name: 'Табак', slug: 'tobacco', image: '/img/catalog2.jpg', order: 2 },
    { id: '3', name: 'Бестабачные смеси', slug: 'herbal', image: '/img/catalog3.jpg', order: 3 },
    { id: '4', name: 'Электронные сигареты', slug: 'electronic', image: '/img/catalog4.jpg', order: 4 },
    { id: '5', name: 'Аксессуары', slug: 'accessories', image: '/img/catalog6.png', order: 5 },
  ];

  const categories = categoriesData.length > 0 ? categoriesData : defaultCategories;

  const products = productsData as Product[];

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        price: 0,
        category: '',
        brand: '',
        description: '',
        inStock: true,
        image: '',
        volume: '',
        strength: '',
        quantity: 0,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      toast({
        title: 'Ошибка',
        description: 'Заполните обязательные поля',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (!isFirebaseConfigured || !db) {
        toast({
          title: 'Firebase не настроен',
          description: 'Сохранение невозможно без Firebase',
          variant: 'destructive',
        });
        return;
      }

      const productId = editingProduct?.id || Date.now().toString();
      const productData: Product = {
        id: productId,
        name: formData.name || '',
        price: Number(formData.price) || 0,
        category: formData.category || '',
        brand: formData.brand || '',
        description: formData.description || '',
        inStock: formData.inStock ?? true,
        image: formData.image || '/img/placeholder.png',
        volume: formData.volume || '',
        strength: formData.strength || '',
        quantity: Number(formData.quantity) || 0,
      };

      await setDoc(doc(db, 'products', productId), productData);

      toast({
        title: editingProduct ? 'Товар обновлен' : 'Товар создан',
        description: `${productData.name} сохранен`,
      });

      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось сохранить товар',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Удалить товар "${product.name}"?`)) return;

    try {
      if (!isFirebaseConfigured || !db) {
        toast({
          title: 'Firebase не настроен',
          description: 'Удаление невозможно без Firebase',
          variant: 'destructive',
        });
        return;
      }

      await deleteDoc(doc(db, 'products', product.id));

      toast({
        title: 'Товар удален',
        description: product.name,
      });

      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось удалить товар',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Управление товарами</CardTitle>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить товар
          </Button>
        </div>
        <div className="flex gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск товаров..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Загрузка...</div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Изображение</TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead>Бренд</TableHead>
                <TableHead>Цена</TableHead>
                <TableHead>Наличие</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="w-[100px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>{product.brand}</TableCell>
                  <TableCell>{product.price.toLocaleString('ru-RU')} ₽</TableCell>
                  <TableCell>
                    <span className={product.quantity === 0 ? 'text-red-500 font-medium' : 'text-green-600 font-medium'}>
                      {product.quantity || 0} шт.
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.inStock ? 'default' : 'secondary'}>
                      {product.inStock ? 'В наличии' : 'Нет в наличии'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Товары не найдены
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Редактировать товар' : 'Добавить товар'}
            </DialogTitle>
            <DialogDescription>
              Заполните информацию о товаре
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Название товара"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Цена *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Категория *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Бренд</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="Бренд"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="volume">Объем</Label>
                <Input
                  id="volume"
                  value={formData.volume}
                  onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                  placeholder="Например: 50г"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Количество на складе *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="strength">Крепость</Label>
                <Input
                  id="strength"
                  value={formData.strength}
                  onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                  placeholder="Например: Средняя"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">URL изображения</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="/img/product.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Описание товара"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="inStock"
                checked={formData.inStock}
                onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="inStock" className="cursor-pointer">В наличии</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave}>
              {editingProduct ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AdminProducts;
