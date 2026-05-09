import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ShoppingCart, Search, Filter, Package, Grid, List } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { categories, brands } from '@/data/products';
import { useToast } from '@/hooks/use-toast';
import { getProducts } from '@/services/productsService';

// Функция санитизации поискового запроса
const sanitizeSearchQuery = (query: string): string => {
  // Удаляем потенциально опасные символы и HTML-теги
  return query
    .replace(/[<>\"'&]/g, '') // Удаляем < > " ' &
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Удаляем script теги
    .replace(/<\/?[^>]+(>|$)/g, '') // Удаляем все HTML теги
    .trim()
    .slice(0, 100); // Ограничиваем длину до 100 символов
};

const Catalog: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все товары');
  const [selectedBrand, setSelectedBrand] = useState('Все бренды');
  const [priceRange, setPriceRange] = useState([0, 20000]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState('name');

  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Получаем поисковый запрос из URL при загрузке
  useEffect(() => {
    const searchFromUrl = searchParams.get('search');
    if (searchFromUrl) {
      const sanitizedQuery = sanitizeSearchQuery(searchFromUrl);
      setSearchTerm(sanitizedQuery);
    }
  }, [searchParams]);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Все товары' || product.category === selectedCategory;
      const matchesBrand = selectedBrand === 'Все бренды' || product.brand === selectedBrand;
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      
      return matchesSearch && matchesCategory && matchesBrand && matchesPrice;
    });

    // Сортировка
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return filtered;
  }, [products, searchTerm, selectedCategory, selectedBrand, priceRange, sortBy]);

  const handleAddToCart = (product: any) => {
    addToCart(product);
    toast({
      title: "Товар добавлен в корзину",
      description: `${product.name} успешно добавлен в корзину`,
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('Все товары');
    setSelectedBrand('Все бренды');
    setPriceRange([0, 20000]);
  };

  return (
    <div className="min-h-screen bg-background py-6">
      <div className="container mx-auto px-4">
        {/* Заголовок */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Каталог товаров
          </h1>
          <p className="text-sm text-muted-foreground">
            Широкий ассортимент табачной и кальянной продукции
          </p>
        </div>

        {/* Фильтры */}
        <div className="bg-card rounded-lg border p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Фильтры</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">
              Сбросить
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {/* Поиск */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск товаров..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(sanitizeSearchQuery(e.target.value))}
                className="pl-10 h-9 text-sm"
              />
            </div>

            {/* Категория */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Категория" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Бренд */}
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger>
                <SelectValue placeholder="Бренд" />
              </SelectTrigger>
              <SelectContent>
                {brands.map(brand => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Сортировка */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Сортировка" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">По названию</SelectItem>
                <SelectItem value="price-asc">Цена по возрастанию</SelectItem>
                <SelectItem value="price-desc">Цена по убыванию</SelectItem>
              </SelectContent>
            </Select>

            {/* Ценовой диапазон */}
            <div className="col-span-2">
              <label className="text-xs font-medium mb-2 block">
                Цена: {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()} ₽
              </label>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                max={20000}
                min={0}
                step={100}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Панель управления отображением */}
        <div className="flex justify-between items-center mb-4 sticky top-16 bg-background/95 backdrop-blur z-10 py-3 border-b border-border">
          <div className="text-xs text-muted-foreground">
            Найдено: {filteredProducts.length}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Каталог товаров */}
        {isLoading ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-semibold text-foreground mb-1">Загрузка товаров...</h3>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-semibold text-foreground mb-1">
              Товары не найдены
            </h3>
            <p className="text-sm text-muted-foreground">
              Попробуйте изменить параметры поиска или фильтры
            </p>
          </div>
        ) : (
          <div className={`grid gap-3 ${
            viewMode === 'grid' 
              ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              : 'grid-cols-1'
          }`}>
            {filteredProducts.map((product) => (
              viewMode === 'grid' ? (
                // Компактная карточка как на главной - адаптированная для тёмной темы
                <div key={product.id} className="group bg-card rounded-lg border border-border overflow-hidden product-card-hover dark:shadow-none">
                  <Link to={`/catalog`} className="block relative aspect-square bg-secondary/50 dark:bg-secondary/20 overflow-hidden">
                    {product.image ? (
                      <>
                        <img
                          src={product.image}
                          alt={product.name}
                          className={`object-cover w-full h-full group-hover:scale-105 transition-transform duration-300 ${!isAuthenticated ? 'blur-sm' : ''}`}
                        />
                        {!isAuthenticated && (
                          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-full">Авторизуйтесь</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                    )}
                    {product.inStock ? (
                      <span className="absolute top-2 left-2 w-2 h-2 bg-green-500 rounded-full" />
                    ) : (
                      <span className="absolute top-2 left-2 w-2 h-2 bg-muted-foreground/50 rounded-full" />
                    )}
                  </Link>
                  <div className="p-3">
                    {product.brand && (
                      <p className="text-[10px] text-primary font-medium uppercase tracking-wide mb-1">{product.brand}</p>
                    )}
                    <Link to={`/catalog`}>
                      <h3 className="text-xs font-medium text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors min-h-[32px]">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-foreground">
                          {product.price.toLocaleString('ru-RU')} ₽
                        </span>
                        <Button 
                          size="sm" 
                          className="h-7 px-2 shadow-primary dark:shadow-none"
                          onClick={() => handleAddToCart(product)}
                          disabled={!product.inStock || product.quantity === 0}
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        В наличии: {product.quantity} шт.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Списочный вид - адаптированный для тёмной темы
                <div key={product.id} className="flex gap-4 bg-card rounded-lg border border-border p-3 product-card-hover dark:shadow-none">
                  <Link to={`/catalog`} className="relative w-24 h-24 bg-secondary/50 dark:bg-secondary/20 rounded-lg overflow-hidden flex-shrink-0">
                    {product.image ? (
                      <>
                        <img src={product.image} alt={product.name} className={`object-cover w-full h-full ${!isAuthenticated ? 'blur-sm' : ''}`} />
                        {!isAuthenticated && (
                          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="text-white text-[10px] font-medium bg-black/50 px-2 py-1 rounded-full">Войти</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {product.brand && (
                          <p className="text-[10px] text-primary font-medium uppercase tracking-wide">{product.brand}</p>
                        )}
                        <h3 className="text-sm font-medium text-foreground line-clamp-1">{product.name}</h3>
                      </div>
                      <Badge variant={product.inStock ? "default" : "secondary"} className="text-[10px] shrink-0">
                        {product.inStock ? "В наличии" : "Нет"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{product.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-foreground">
                          {product.price.toLocaleString('ru-RU')} ₽
                        </span>
                        <Button 
                          size="sm" 
                          className="h-8 shadow-primary dark:shadow-none"
                          onClick={() => handleAddToCart(product)}
                          disabled={!product.inStock || product.quantity === 0}
                        >
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          В корзину
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        В наличии: {product.quantity} шт.
                      </div>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Catalog;