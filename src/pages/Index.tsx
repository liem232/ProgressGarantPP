import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Truck,
  Shield,
  Clock,
  Package,
  ArrowRight,
  Heart,
  TrendingUp,
  Award,
  Phone,
  Star,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getProducts } from '@/services/productsService';

const Index = () => {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  const handleAddToCart = (product: any) => {
    addToCart(product);
    toast({
      title: "Товар добавлен в корзину",
      description: `${product.name} успешно добавлен в корзину`,
    });
  };

  const popularProducts = products.slice(0, 8);
  const newProducts = products.slice(0, 4);

  // Слайдер баннеров - 3 слайда с разными переходами
  const slides = [
    {
      id: 1,
      title: 'ПрогрессГарант',
      subtitle: 'Надёжный партнёр с 2019 года',
      description: 'Более 500 довольных клиентов, 50+ брендов, быстрая доставка по Оренбургу и области',
      bg: 'bg-gradient-to-r from-primary to-primary/80',
      link: '/about',
      linkText: 'О нас',
      image: '/img/company.jpg'
    },
    {
      id: 2,
      title: 'Более 500 вкусов',
      subtitle: 'Табак от ведущих производителей',
      description: 'BlackBurn, Musthave, Adalya, Overdose и другие премиальные бренды в наличии',
      bg: 'bg-gradient-to-r from-orange-600 to-primary',
      link: '/catalog',
      linkText: 'В каталог',
      image: '/img/slider2.jpg'
    },
    {
      id: 3,
      title: 'Партнёрская программа',
      subtitle: 'Специальные условия для бизнеса',
      description: 'Оптовые цены, индивидуальный подход, консультации по ассортименту',
      bg: 'bg-gradient-to-r from-primary to-orange-600',
      link: '/partners',
      linkText: 'Партнёрам',
      image: '/img/slider3.jpg'
    }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  // Автоматическое перелистывание каждые 5 секунд
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isUserInteracting) {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length, isUserInteracting]);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Обработка свайпов (touch)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // Обработка drag мышью
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setIsUserInteracting(true);
    setDragStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setDragEnd(e.clientX);
  };

  const handleMouseUp = () => {
    if (!dragStart || !dragEnd) {
      setIsDragging(false);
      setIsUserInteracting(false);
      setDragStart(null);
      setDragEnd(null);
      return;
    }
    const distance = dragStart - dragEnd;
    const minDragDistance = 50;

    if (distance > minDragDistance) {
      nextSlide();
    } else if (distance < -minDragDistance) {
      prevSlide();
    }

    setIsDragging(false);
    setIsUserInteracting(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleMouseUp();
    }
    setIsUserInteracting(false);
  };

  // Категории с изображениями
  const categories = [
    { title: 'Кальяны', count: 50, image: '/img/catalog1.jpg' },
    { title: 'Табак', count: 200, image: '/img/catalog2.jpg' },
    { title: 'Бестабачные', count: 30, image: '/img/catalog3.jpg' },
    { title: 'Электронные', count: 80, image: '/img/catalog4.jpg' },
    { title: 'Чаши', count: 40, image: '/img/catalog5.jpg' },
    { title: 'Аксессуары', count: 120, image: '/img/catalog6.png' },
    { title: 'Уголь', count: 25, image: '/img/catalog7.jpg' },
    { title: 'Мундштуки', count: 60, image: '/img/catalog8.jpg' },
  ];

  // Компактная карточка товара - адаптированная для светлой и тёмной тем
  const ProductCard = ({ product }: { product: any }) => (
    <div className="group bg-card rounded-lg border border-border overflow-hidden product-card-hover dark:shadow-none">
      {/* Фото товара */}
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
            <Package className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        {/* Бейджи */}
        {product.inStock ? (
          <span className="absolute top-2 left-2 w-2 h-2 bg-green-500 rounded-full" />
        ) : (
          <span className="absolute top-2 left-2 w-2 h-2 bg-muted-foreground/50 rounded-full" />
        )}
        {/* Кнопка избранного */}
        <button className="absolute top-2 right-2 w-8 h-8 bg-card/90 dark:bg-background/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm dark:shadow-none border border-border/50">
          <Heart className="h-4 w-4 text-muted-foreground hover:text-red-500" />
        </button>
      </Link>
      
      {/* Информация о товаре */}
      <div className="p-3">
        {product.brand && (
          <p className="text-[11px] text-primary font-medium uppercase tracking-wide mb-1">{product.brand}</p>
        )}
        <Link to={`/catalog`} className="block">
          <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors min-h-[40px]">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-foreground">
            {product.price.toLocaleString('ru-RU')} ₽
          </span>
          <Button 
            size="sm" 
            className="h-8 px-3 shadow-primary dark:shadow-none"
            onClick={() => handleAddToCart(product)}
            disabled={!product.inStock}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Полноэкранный слайдер под прозрачным хеддером */}
      <section 
        className="relative h-[70vh] md:h-[80vh] overflow-hidden cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Слайды */}
        <div className="relative h-full">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                index === currentSlide 
                  ? 'opacity-100 translate-x-0' 
                  : index < currentSlide 
                    ? 'opacity-0 -translate-x-full' 
                    : 'opacity-0 translate-x-full'
              }`}
            >
              {/* Фон - изображение на весь экран */}
              <div 
                className={`absolute inset-0 bg-cover bg-center ${!isAuthenticated ? 'blur-[2px]' : ''}`}
                style={{ backgroundImage: `url(${slide.image})` }}
              >
                {/* Затемнение для читаемости текста */}
                <div className="absolute inset-0 bg-black/60" />
              </div>
              
              {/* Контент */}
              <div className="relative h-full flex items-center">
                <div className="container mx-auto px-4">
                  <div className="max-w-2xl">
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 tracking-tight">
                      {slide.title}
                    </h1>
                    <p className="text-xl md:text-2xl text-white/90 mb-3">
                      {slide.subtitle}
                    </p>
                    <p className="text-base md:text-lg text-white/70 mb-8">
                      {slide.description}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button 
                        size="lg" 
                        className="bg-white text-gray-900 hover:bg-white/90 shadow-lg"
                        asChild
                      >
                        <Link to={slide.link}>{slide.linkText}</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Кнопки навигации (только на десктопе) */}
        <button
          onClick={prevSlide}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full items-center justify-center text-white hover:bg-white/20 transition-colors z-20"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={nextSlide}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full items-center justify-center text-white hover:bg-white/20 transition-colors z-20"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Индикаторы (точки) */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`slider-dot ${index === currentSlide ? 'active' : ''}`}
            />
          ))}
        </div>

        {/* Подсказка про свайп (только на мобильных) */}
        <div className="md:hidden absolute bottom-20 left-1/2 -translate-x-1/2 text-white/50 text-xs">
          Свайпайте для переключения
        </div>
      </section>

      {/* Категории с фото - как у конкурента сетка 4x2 */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Каталог</h2>
            <Link to="/catalog" className="text-sm text-primary hover:underline flex items-center">
              Весь каталог <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map((category, index) => (
              <Link 
                key={index} 
                to="/catalog"
                className="group relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all"
              >
                {/* Фото категории */}
                <img 
                  src={category.image} 
                  alt={category.title}
                  className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${!isAuthenticated ? 'blur-sm' : ''}`}
                />
                {/* Затемнение снизу */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                {/* Текст */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-bold text-lg mb-1">{category.title}</h3>
                  <p className="text-white/90 text-sm">{category.count} товаров</p>
                </div>
                {/* Блюр оверлей для неавторизованных */}
                {!isAuthenticated && (
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center">
                    <span className="text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-full">Войти</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Хиты - компактные карточки как у конкурента */}
      <section className="py-10 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">Хиты</h2>
              <Star className="h-4 w-4 text-primary fill-primary" />
            </div>
            <Link to="/catalog" className="text-sm text-primary hover:underline flex items-center">
              Смотреть всё <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {popularProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Новинки */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Новинки</h2>
            <Link to="/catalog" className="text-sm text-primary hover:underline flex items-center">
              Все новинки <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {newProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Акции - баннеры с брендами */}
      <section className="py-10 bg-secondary/20">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold mb-6">Спецпредложения</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Баннер BlackBurn - BBbanner */}
            <Link to="/catalog" className="relative aspect-[16/9] md:aspect-[4/3] rounded-xl overflow-hidden group">
              <img 
                src="/img/BBbanner.jpg" 
                alt="BlackBurn Banner" 
                className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${!isAuthenticated ? 'blur-[2px]' : ''}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <p className="text-[10px] uppercase tracking-widest mb-2 text-white/70 font-medium">Популярные вкусы</p>
                <h3 className="text-xl font-bold mb-2 tracking-tight">BLACKBURN</h3>
                <p className="text-sm text-white/95 mb-3 leading-relaxed">Bananini & Blueberry — яркие тропические ноты</p>
                <span className="inline-flex items-center text-sm text-white font-semibold group-hover:text-primary transition-colors">
                  Перейти в каталог <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </div>
            </Link>
            {/* Баннер Overdose - overdoseBanner */}
            <Link to="/catalog" className="relative aspect-[16/9] md:aspect-[4/3] rounded-xl overflow-hidden group">
              <img 
                src="/img/overdoseBanner.jpg" 
                alt="Overdose Banner" 
                className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${!isAuthenticated ? 'blur-[2px]' : ''}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <p className="text-[10px] uppercase tracking-widest mb-2 text-white/70 font-medium">Эксклюзивные вкусы</p>
                <h3 className="text-xl font-bold mb-2 tracking-tight">OVERDOSE</h3>
                <p className="text-sm text-white/95 mb-3 leading-relaxed">Samarkand Melon & Wintergreen — восточная свежесть</p>
                <span className="inline-flex items-center text-sm text-white font-semibold group-hover:text-primary transition-colors">
                  Перейти в каталог <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </div>
            </Link>
            {/* Баннер Musthave - musthavebanner */}
            <Link to="/catalog" className="relative aspect-[16/9] md:aspect-[4/3] rounded-xl overflow-hidden group">
              <img 
                src="/img/musthavebanner.jpg" 
                alt="Musthave Banner" 
                className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${!isAuthenticated ? 'blur-[2px]' : ''}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <p className="text-[10px] uppercase tracking-widest mb-2 text-white/70 font-medium">Премиум табак</p>
                <h3 className="text-xl font-bold mb-2 tracking-tight">MUSTHAVE</h3>
                <p className="text-sm text-white/95 mb-3 leading-relaxed">25+ вкусов — от классики до экзотики</p>
                <span className="inline-flex items-center text-sm text-white font-semibold group-hover:text-primary transition-colors">
                  Перейти в каталог <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Преимущества — минималистично */}
      <section className="py-12 border-y border-border">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold text-center mb-8">Почему выбирают нас</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x-0 md:divide-x divide-border">
            {/* Преимущество 1 */}
            <div className="flex flex-col items-center text-center p-6 md:px-8">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1">Широкий выбор</h3>
              <p className="text-xs text-muted-foreground">500+ товаров в наличии</p>
            </div>
            {/* Преимущество 2 */}
            <div className="flex flex-col items-center text-center p-6 md:px-8">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1">Быстрая доставка</h3>
              <p className="text-xs text-muted-foreground">От 2 часов по Оренбургу</p>
            </div>
            {/* Преимущество 3 */}
            <div className="flex flex-col items-center text-center p-6 md:px-8">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1">Оригинал 100%</h3>
              <p className="text-xs text-muted-foreground">Только сертифицированный товар</p>
            </div>
            {/* Преимущество 4 */}
            <div className="flex flex-col items-center text-center p-6 md:px-8">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1">Поддержка 24/7</h3>
              <p className="text-xs text-muted-foreground">Всегда на связи</p>
            </div>
          </div>
        </div>
      </section>

      {/* Партнеры */}
      <section className="py-12 bg-gradient-to-b from-muted/50 to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-2">Наши партнеры</h2>
            <p className="text-sm text-muted-foreground">Официальные дистрибьюторы ведущих брендов</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Карточки партнеров с подсветкой */}
            <a 
              href="/catalog" 
              className="group flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-white to-secondary/30 dark:from-card dark:to-secondary/20 rounded-xl border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <img src="/img/BlackBurn.png" alt="BlackBurn" className="h-12 sm:h-14 md:h-16 w-auto max-w-[80px] sm:max-w-[100px] md:max-w-[120px] object-contain" />
            </a>
            <a 
              href="/catalog" 
              className="group flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-white to-secondary/30 dark:from-card dark:to-secondary/20 rounded-xl border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <img src="/img/musthave.png" alt="Musthave" className="h-12 sm:h-14 md:h-16 w-auto max-w-[80px] sm:max-w-[100px] md:max-w-[120px] object-contain" />
            </a>
            <a 
              href="/catalog" 
              className="group flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-white to-secondary/30 dark:from-card dark:to-secondary/20 rounded-xl border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <img src="/img/overdose.png" alt="Overdose" className="h-12 sm:h-14 md:h-16 w-auto max-w-[80px] sm:max-w-[100px] md:max-w-[120px] object-contain" />
            </a>
            <a 
              href="/catalog" 
              className="group flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-white to-secondary/30 dark:from-card dark:to-secondary/20 rounded-xl border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <img src="/img/nur.png" alt="NUR" className="h-12 sm:h-14 md:h-16 w-auto max-w-[80px] sm:max-w-[100px] md:max-w-[120px] object-contain" />
            </a>
            <a 
              href="/catalog" 
              className="group flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-white to-secondary/30 dark:from-card dark:to-secondary/20 rounded-xl border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <img src="/img/adalya.png" alt="Adalya" className="h-12 sm:h-14 md:h-16 w-auto max-w-[80px] sm:max-w-[100px] md:max-w-[120px] object-contain" />
            </a>
            <a 
              href="/catalog" 
              className="group flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-white to-secondary/30 dark:from-card dark:to-secondary/20 rounded-xl border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <img src="/img/mongol.png" alt="Mongol" className="h-12 sm:h-14 md:h-16 w-auto max-w-[80px] sm:max-w-[100px] md:max-w-[120px] object-contain" />
            </a>
            <a 
              href="/catalog" 
              className="group flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-white to-secondary/30 dark:from-card dark:to-secondary/20 rounded-xl border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <img src="/img/sapphire.png" alt="Sapphire Crown" className="h-12 sm:h-14 md:h-16 w-auto max-w-[80px] sm:max-w-[100px] md:max-w-[120px] object-contain" />
            </a>
            <a 
              href="/catalog" 
              className="group flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-white to-secondary/30 dark:from-card dark:to-secondary/20 rounded-xl border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <img src="/img/husky.png" alt="Husky" className="h-12 sm:h-14 md:h-16 w-auto max-w-[80px] sm:max-w-[100px] md:max-w-[120px] object-contain" />
            </a>
            <a 
              href="/catalog" 
              className="group flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-white to-secondary/30 dark:from-card dark:to-secondary/20 rounded-xl border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <img src="/img/element.png" alt="Element" className="h-12 sm:h-14 md:h-16 w-auto max-w-[80px] sm:max-w-[100px] md:max-w-[120px] object-contain" />
            </a>
            <a 
              href="/catalog" 
              className="group flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-white to-secondary/30 dark:from-card dark:to-secondary/20 rounded-xl border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <img src="/img/rell.png" alt="Rell" className="h-12 sm:h-14 md:h-16 w-auto max-w-[80px] sm:max-w-[100px] md:max-w-[120px] object-contain" />
            </a>
          </div>
        </div>
      </section>

      {/* О компании - компактно */}
      <section className="py-10 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">О компании</Badge>
              <h2 className="text-2xl font-bold mb-4">ПрогрессГарант — надёжный партнёр</h2>
              <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                С 2019 года мы обеспечиваем предпринимателей Оренбурга качественной 
                табачной и кальянной продукцией. Работаем только с проверенными брендами.
              </p>
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gradient">500+</div>
                  <div className="text-xs text-muted-foreground">Клиентов</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gradient">50+</div>
                  <div className="text-xs text-muted-foreground">Брендов</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gradient">5+</div>
                  <div className="text-xs text-muted-foreground">Лет опыта</div>
                </div>
              </div>
              <Button asChild className="shadow-primary">
                <Link to="/about">Подробнее о нас</Link>
              </Button>
            </div>
            {/* Изображение rasprodaja.jpg */}
            <div className="aspect-video rounded-xl overflow-hidden">
              <img 
                src="/img/rasprodaja.jpg" 
                alt="Распродажа" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Index;
