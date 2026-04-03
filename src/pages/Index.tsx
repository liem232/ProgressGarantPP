import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Star,
  CheckCircle,
  Truck,
  Shield,
  Clock,
  Users,
  Package,
  Cigarette,
  Flame,
  Zap,
  ArrowRight,
  TrendingUp,
  Award,
  Phone,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import ParticleBackground from '@/components/ParticleBackground';
import { getProducts } from '@/services/productsService';

const useCountUp = (end: number, duration: number = 2000) => {
  const [count, setCount] = React.useState(0);
  const countRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    
    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);

  return { count, ref: countRef };
};

const Index = () => {
  const { addToCart } = useCart();
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

  const popularProducts = products.slice(0, 4);

  const { count: clientsCount, ref: clientsRef } = useCountUp(500);
  const { count: brandsCount, ref: brandsRef } = useCountUp(50);
  const { count: yearsCount, ref: yearsRef } = useCountUp(5);

  const categories = [
    {
      title: 'Кальяны',
      description: 'Премиальные кальяны от ведущих производителей',
      icon: Flame,
      count: '50+',
      gradient: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/30'
    },
    {
      title: 'Табак',
      description: 'Широкий ассортимент кальянного табака',
      icon: Cigarette,
      count: '200+',
      gradient: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30'
    },
    {
      title: 'Бестабачные',
      description: 'Альтернатива табаку для здорового курения',
      icon: Package,
      count: '30+',
      gradient: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30'
    },
    {
      title: 'Электронные',
      description: 'Современные устройства и аксессуары',
      icon: Zap,
      count: '80+',
      gradient: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30'
    }
  ];

  const advantages = [
    {
      icon: Package,
      title: 'Актуальный ассортимент',
      description: 'Самый актуальный ассортимент + закупки по вашему запросу',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      icon: Shield,
      title: 'Высокое качество',
      description: 'Высокое качество, которое оценит каждый ценитель',
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      icon: Clock,
      title: 'Быстрая обработка',
      description: 'Быстрая обработка вашего заказа',
      color: 'text-amber-600',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30'
    },
    {
      icon: Truck,
      title: 'Бесплатная доставка',
      description: 'Доставка в удобное время бесплатно от 3000₽',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    }
  ];

  const renderIcon = (IconComponent: any, className: string) => {
    return <IconComponent className={className} />;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero секция с улучшенным дизайном */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <ParticleBackground className="absolute inset-0 z-0" />
        
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent to-primary/10 z-0" />
        
        {/* Floating shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Официальный дистрибьютор в Оренбурге</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
              ПрогрессГарант
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-glow mt-2">
                Табак и Кальяны
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
              Ведущий дистрибьютор табачной и кальянной продукции. 
              Качественные товары для вашего бизнеса по выгодным ценам.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                asChild 
                className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 px-8 h-14 text-lg"
              >
                <Link to="/catalog">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Перейти в каталог
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                asChild
                className="h-14 px-8 text-lg border-2"
              >
                <Link to="/contacts">
                  <Phone className="mr-2 h-5 w-5" />
                  Связаться с нами
                </Link>
              </Button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
              <div className="text-center" ref={clientsRef}>
                <div className="text-4xl md:text-5xl font-bold text-primary">{clientsCount}+</div>
                <div className="text-sm text-muted-foreground mt-1">Клиентов</div>
              </div>
              <div className="text-center" ref={brandsRef}>
                <div className="text-4xl md:text-5xl font-bold text-primary">{brandsCount}+</div>
                <div className="text-sm text-muted-foreground mt-1">Брендов</div>
              </div>
              <div className="text-center" ref={yearsRef}>
                <div className="text-4xl md:text-5xl font-bold text-primary">{yearsCount}+</div>
                <div className="text-sm text-muted-foreground mt-1">Лет опыта</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-primary/30 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-primary/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Категории товаров */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 px-4 py-1">Каталог</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Популярные категории
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Широкий ассортимент качественной продукции от ведущих мировых брендов
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <Link 
                key={index} 
                to="/catalog"
                className="group block"
              >
                <Card className={`h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden ${category.bgColor}`}>
                  <CardHeader className="pb-4">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${category.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      {renderIcon(category.icon, "h-8 w-8 text-white")}
                    </div>
                    <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                      {category.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-3">{category.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="font-semibold">
                        {category.count} товаров
                      </Badge>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Бренды */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 px-4 py-1">Наши партнёры</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Работаем с ведущими брендами
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Являемся крупным дистрибьютором по Оренбургу
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3 md:gap-4">
            {[
              'BLACKBURN / OVERDOSE',
              'NUR',
              'ADAIYA',
              'MUSTHAVE',
              'MONGOL',
              'Sapphire Crown',
              'Morpheus',
              'JAM',
              'Mr.Brew',
              'HUSKY',
              'ELEMENT',
              'RELL'
            ].map((brand) => (
              <div 
                key={brand}
                className="px-4 py-2 md:px-6 md:py-3 bg-background rounded-full border border-border/50 shadow-sm hover:border-primary/50 hover:shadow-md transition-all duration-300"
              >
                <span className="font-medium text-foreground whitespace-nowrap">{brand}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Преимущества */}
      <section className="py-24 bg-muted/30 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 px-4 py-1">Почему мы</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Наши преимущества
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Работаем с 2019 года, обеспечивая клиентов качественной продукцией
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {advantages.map((advantage, index) => (
              <div 
                key={index} 
                className="group text-center p-8 rounded-3xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-500"
              >
                <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl ${advantage.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  {renderIcon(advantage.icon, `h-10 w-10 ${advantage.color}`)}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {advantage.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {advantage.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Популярные товары */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-4">
            <div>
              <Badge variant="outline" className="mb-4 px-4 py-1">Хиты продаж</Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Популярные товары
              </h2>
              <p className="text-lg text-muted-foreground mt-2">
                Самые востребованные позиции нашего каталога
              </p>
            </div>
            <Button variant="outline" size="lg" asChild className="self-start md:self-auto">
              <Link to="/catalog">
                Смотреть всё
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularProducts.map((product) => (
              <Card key={product.id} className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden">
                <CardHeader className="p-0">
                  <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 relative overflow-hidden">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-20 w-20 text-muted-foreground/30" />
                      </div>
                    )}
                    {product.inStock && (
                      <Badge className="absolute top-4 left-4 bg-green-500 hover:bg-green-600">
                        В наличии
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {product.brand && (
                    <p className="text-sm text-primary font-medium mb-1">{product.brand}</p>
                  )}
                  <CardTitle className="text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-sm">
                    {product.description}
                  </CardDescription>
                </CardContent>
                <CardFooter className="p-6 pt-0 flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">
                    {product.price.toLocaleString('ru-RU')} ₽
                  </span>
                  <Button 
                    size="sm"
                    onClick={() => handleAddToCart(product)}
                    disabled={!product.inStock}
                    className="rounded-full w-10 h-10 p-0"
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-glow" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '30px 30px'
          }} />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-primary-foreground">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Готовы стать партнером?
            </h2>
            <p className="text-xl mb-10 opacity-90 max-w-2xl mx-auto">
              Присоединяйтесь к сети успешных предпринимателей. 
              Специальные условия для оптовых покупателей.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary" 
                asChild
                className="h-14 px-8 text-lg"
              >
                <Link to="/partners">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Стать партнером
                </Link>
              </Button>
              <Button 
                size="lg" 
                className="h-14 px-8 text-lg bg-background text-foreground hover:bg-background/90 shadow-lg"
                asChild
              >
                <Link to="/contacts">
                  <Phone className="mr-2 h-5 w-5" />
                  Получить консультацию
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* О компании */}
      <section className="py-24 bg-gradient-to-br from-muted/50 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <Badge variant="outline" className="mb-4 px-4 py-1">О компании</Badge>
                <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                  ПрогрессГарант — <br />
                  <span className="text-primary">надежный партнер</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  Компания была основана в 2019 году с целью создания надежной 
                  дистрибьюторской сети табачной продукции в Оренбургской области.
                </p>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  За годы работы мы установили прочные партнерские отношения с ведущими 
                  производителями, что позволяет предлагать только качественные 
                  и сертифицированные товары.
                </p>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle className="h-7 w-7 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">100%</div>
                      <div className="text-sm text-muted-foreground">Оригинал</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Clock className="h-7 w-7 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">24/7</div>
                      <div className="text-sm text-muted-foreground">Поддержка</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-2xl" />
                <div className="relative space-y-4">
                  <Card className="border-0 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Star className="h-5 w-5 text-primary" />
                        </div>
                        Наша миссия
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">
                        Обеспечить предпринимателей Оренбурга и области качественной 
                        табачной продукцией по конкурентным ценам с высоким уровнем сервиса.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 shadow-xl ml-8">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Award className="h-5 w-5 text-primary" />
                        </div>
                        Наши ценности
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">
                        Честность, надежность, качество продукции и индивидуальный подход 
                        к каждому клиенту — основа наших деловых отношений.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
