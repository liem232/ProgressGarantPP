import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ShoppingCart, Search, Filter, Package, Grid, List } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { categories, brands } from '@/data/products';
import { useToast } from '@/hooks/use-toast';
import { getProducts } from '@/services/productsService';

const Catalog: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все товары');
  const [selectedBrand, setSelectedBrand] = useState('Все бренды');
  const [priceRange, setPriceRange] = useState([0, 20000]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState('name');

  const { addToCart } = useCart();
  const { toast } = useToast();

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
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Каталог товаров
          </h1>
          <p className="text-lg text-muted-foreground">
            Широкий ассортимент табачной и кальянной продукции
          </p>
        </div>

        {/* Фильтры */}
        <div className="bg-card rounded-lg border p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Фильтры</h2>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Сбросить
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {/* Поиск */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск товаров..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
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
              <label className="text-sm font-medium mb-2 block">
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
        <div className="flex justify-between items-center mb-6 sticky top-16 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 py-3 -mx-4 px-4 border-b border-border">
          <div className="text-sm text-muted-foreground">
            Найдено товаров: {filteredProducts.length}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Каталог товаров */}
        {isLoading ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Загрузка товаров...</h3>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Товары не найдены
            </h3>
            <p className="text-muted-foreground">
              Попробуйте изменить параметры поиска или фильтры
            </p>
          </div>
        ) : (
          <div className={`grid gap-4 sm:gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1'
          }`}>
            {filteredProducts.map((product) => (
              <Card key={product.id} className={`hover:shadow-lg transition-shadow overflow-hidden ${
                viewMode === 'list' ? 'flex flex-col sm:flex-row' : ''
              }`}>
                <div className={viewMode === 'list' ? 'w-full sm:w-56 flex-shrink-0' : ''}>
                  <CardHeader className={`p-4 ${viewMode === 'list' ? 'pb-2' : ''}`}>
                    <div className={`bg-muted rounded-xl flex items-center justify-center overflow-hidden ${
                      viewMode === 'list' ? 'aspect-[16/10] sm:aspect-square w-full' : 'aspect-square'
                    }`}>
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <Package className={`text-muted-foreground ${
                          viewMode === 'list' ? 'h-12 w-12' : 'h-16 w-16'
                        }`} />
                      )}
                    </div>
                  </CardHeader>
                </div>
                
                <div className="flex-1">
                  <CardHeader className={`${viewMode === 'list' ? 'pt-0' : 'pt-0'} px-4`}>
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-lg sm:text-lg line-clamp-2">
                      {product.name}
                      </CardTitle>
                      <Badge variant={product.inStock ? "default" : "secondary"} className="shrink-0">
                        {product.inStock ? "В наличии" : "Нет"}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {product.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl sm:text-2xl font-bold text-primary">
                          {product.price.toLocaleString('ru-RU')} ₽
                        </span>
                        <div className="text-xs text-muted-foreground">
                          {product.brand || ''}
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                        {product.volume && <p>Объем: {product.volume}</p>}
                        {product.strength && <p>Крепость: {product.strength}</p>}
                        {product.category && <p>Категория: {product.category}</p>}
                        {product.brand && <p>Бренд: {product.brand}</p>}
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="p-4 pt-0">
                    <Button 
                      className="w-full" 
                      onClick={() => handleAddToCart(product)}
                      disabled={!product.inStock}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      В корзину
                    </Button>
                  </CardFooter>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Catalog;