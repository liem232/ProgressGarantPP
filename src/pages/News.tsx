import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Calendar, 
  Tag, 
  Search, 
  Plus,
  Edit,
  Trash2,
  Gift,
  TrendingUp,
  Star
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: 'action' | 'news' | 'announcement';
  date: string;
  author: string;
}

const News: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [newNews, setNewNews] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'news' as const
  });

  const { isAdmin } = useAuth();
  const { toast } = useToast();

  // Загружаем новости при монтировании компонента
  useEffect(() => {
    const savedNews = localStorage.getItem('progressgarant_news');
    if (savedNews) {
      setNews(JSON.parse(savedNews));
    } else {
      // Добавляем начальные новости
      const initialNews: NewsItem[] = [
        {
          id: '1',
          title: '🎉 Скидка 20% на премиальные бренды табака!',
          excerpt: 'Специальное предложение на Must Have, Darkside и Spectrum. Только до конца месяца!',
          content: 'Уважаемые партнеры! Рады сообщить об акции на премиальные бренды кальянного табака. Скидка 20% действует на всю линейку Must Have, Darkside и Spectrum. Акция распространяется на заказы от 15 000 рублей. Также для постоянных клиентов предусмотрены дополнительные бонусы: бесплатная доставка по Оренбургу и расширенная отсрочка платежа. Количество товара ограничено – успейте пополнить запасы!',
          category: 'action',
          date: '2025-04-01',
          author: 'Отдел продаж'
        },
        {
          id: '2',
          title: 'Новое поступление: кальяны Alpha Hookah 2025',
          excerpt: 'В каталоге появились новые модели премиальных кальянов от российского производителя.',
          content: 'Представляем новинку в нашем ассортименте – кальяны Alpha Hookah 2025 года выпуска. Модели отличаются улучшенной эргономикой, системой Click-Clack и расширенной комплектацией. В наличии доступны цвета: Onyx, Space, Forest и Limited Edition Gold. Все кальяны сертифицированы и имеют официальную гарантию производителя 2 года. Предварительные заказы уже открыты.',
          category: 'news',
          date: '2025-03-28',
          author: 'Отдел закупок'
        },
        {
          id: '3',
          title: 'Расширение склада – увеличение ассортимента',
          excerpt: 'Открытие нового складского помещения позволило расширить складские запасы на 40%.',
          content: 'Мы рады сообщить об открытии дополнительного складского помещения площадью 500 кв.м. Это позволило значительно расширить ассортимент продукции и увеличить складские запасы наиболее популярных позиций на 40%. Теперь мы можем оперативно выполнять крупные заказы и поддерживать стабильное наличие товара даже в пиковые сезоны.',
          category: 'news',
          date: '2025-03-15',
          author: 'Администрация'
        },
        {
          id: '4',
          title: '⚠️ Изменение цен на импортную продукцию',
          excerpt: 'С 1 апреля ожидается корректировка цен на ряд импортных товаров.',
          content: 'Уважаемые партнеры! Информируем вас о предстоящем изменении цен на импортную продукцию с 1 апреля 2025 года. Корректировка связана с изменением курса валют и логистических издержек. Рекомендуем сформировать заказы на импортные позиции заранее по текущим ценам. Точный перечень товаров и новые цены будут опубликованы дополнительно.',
          category: 'announcement',
          date: '2025-03-20',
          author: 'Отдел закупок'
        },
        {
          id: '5',
          title: '🎁 Бонусная программа для оптовых клиентов',
          excerpt: 'Запуск новой системы накопительных скидок и кэшбэка для постоянных покупателей.',
          content: 'С радостью представляем обновленную бонусную программу "ПрогрессПартнер Плюс". Теперь помимо скидок вы получаете кэшбэк на каждую покупку – до 5% от суммы заказа. Накопленные бонусы можно использовать для частичной оплаты следующих заказов или обменять на подарочную продукцию. Также в программе предусмотрены персональные предложения и ранний доступ к новинкам.',
          category: 'news',
          date: '2025-03-10',
          author: 'Отдел продаж'
        },
        {
          id: '6',
          title: 'График работы на майские праздники 2025',
          excerpt: 'Режим работы офиса и склада в праздничные дни.',
          content: 'Уважаемые партнеры! Сообщаем график работы на майские праздники 2025: 1 мая – выходной день, 2-3 мая – рабочие дни с 10:00 до 16:00, 9 мая – выходной день, 10-11 мая – рабочие дни в обычном режиме 9:00-18:00. Онлайн-заказы принимаются круглосуточно через сайт. Срочные вопросы можно решить по телефону горячей линии.',
          category: 'announcement',
          date: '2025-04-15',
          author: 'Администрация'
        },
        {
          id: '7',
          title: 'Эксклюзив: новые вкусы табака Serbetli',
          excerpt: 'Первые в Оренбурге – уникальные вкусы от турецкого производителя.',
          content: 'Мы стали первым дистрибьютором в Оренбурге, получившим новую линейку вкусов Serbetli 2025. В ассортименте: Tropical Mango, Berry Blast, Cooling Melon и другие экзотические сочетания. Табак уже доступен к заказу. Для первых 50 покупателей – специальная цена на пробную партию.',
          category: 'news',
          date: '2025-03-25',
          author: 'Отдел закупок'
        },
        {
          id: '8',
          title: 'Весенняя распродажа аксессуаров',
          excerpt: 'Скидки до 50% на чаши, калауды, щипцы и другие аксессуары.',
          content: 'Весенняя распродажа стартовала! Скидки до 50% на весь ассортимент кальянных аксессуаров: чаши из различных материалов, калауды для разных типов табака, щипцы, мундштуки, шланги и многое другое. Акция действует до конца апреля или до окончания запасов. Отличная возможность обновить инвентарь по выгодным ценам.',
          category: 'action',
          date: '2025-04-05',
          author: 'Отдел продаж'
        }
      ];
      setNews(initialNews);
      localStorage.setItem('progressgarant_news', JSON.stringify(initialNews));
    }
  }, []);

  const saveNews = (newsData: NewsItem[]) => {
    setNews(newsData);
    localStorage.setItem('progressgarant_news', JSON.stringify(newsData));
  };

  const filteredNews = news.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAddNews = () => {
    if (!newNews.title || !newNews.content) {
      toast({
        title: "Ошибка",
        description: "Заполните обязательные поля",
        variant: "destructive"
      });
      return;
    }

    const newsItem: NewsItem = {
      id: Date.now().toString(),
      ...newNews,
      excerpt: newNews.excerpt || newNews.content.slice(0, 150) + '...',
      date: new Date().toISOString().split('T')[0],
      author: 'Администратор'
    };

    saveNews([newsItem, ...news]);
    setNewNews({ title: '', content: '', excerpt: '', category: 'news' });
    setIsAddDialogOpen(false);
    
    toast({
      title: "Новость добавлена",
      description: "Новость успешно опубликована",
    });
  };

  const handleDeleteNews = (id: string) => {
    saveNews(news.filter(item => item.id !== id));
    toast({
      title: "Новость удалена",
      description: "Новость успешно удалена",
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'action':
        return <Gift className="h-4 w-4" />;
      case 'news':
        return <TrendingUp className="h-4 w-4" />;
      case 'announcement':
        return <Star className="h-4 w-4" />;
      default:
        return <Tag className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'action':
        return 'Акция';
      case 'news':
        return 'Новость';
      case 'announcement':
        return 'Объявление';
      default:
        return 'Новость';
    }
  };

  const getCategoryVariant = (category: string) => {
    switch (category) {
      case 'action':
        return 'default' as const;
      case 'news':
        return 'secondary' as const;
      case 'announcement':
        return 'outline' as const;
      default:
        return 'secondary' as const;
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Заголовок */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Новости и акции
            </h1>
            <p className="text-lg text-muted-foreground">
              Актуальная информация о скидках, новинках и важных событиях
            </p>
          </div>
          
          {isAdmin && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить новость
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Добавить новость</DialogTitle>
                  <DialogDescription>
                    Создайте новую новость или объявление для клиентов
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Заголовок *</Label>
                    <Input
                      id="title"
                      value={newNews.title}
                      onChange={(e) => setNewNews(prev => ({...prev, title: e.target.value}))}
                      placeholder="Введите заголовок новости"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="excerpt">Краткое описание</Label>
                    <Input
                      id="excerpt"
                      value={newNews.excerpt}
                      onChange={(e) => setNewNews(prev => ({...prev, excerpt: e.target.value}))}
                      placeholder="Краткое описание (необязательно)"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Категория</Label>
                    <select
                      id="category"
                      value={newNews.category}
                      onChange={(e) => setNewNews(prev => ({...prev, category: e.target.value as any}))}
                      className="w-full p-2 border border-input rounded-md bg-background"
                    >
                      <option value="news">Новость</option>
                      <option value="action">Акция</option>
                      <option value="announcement">Объявление</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="content">Содержание *</Label>
                    <Textarea
                      id="content"
                      value={newNews.content}
                      onChange={(e) => setNewNews(prev => ({...prev, content: e.target.value}))}
                      placeholder="Полный текст новости"
                      rows={8}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button onClick={handleAddNews}>
                    Опубликовать
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Фильтры */}
        <div className="bg-card rounded-lg border p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск новостей..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                Все
              </Button>
              <Button
                variant={selectedCategory === 'action' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('action')}
              >
                Акции
              </Button>
              <Button
                variant={selectedCategory === 'news' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('news')}
              >
                Новости
              </Button>
              <Button
                variant={selectedCategory === 'announcement' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('announcement')}
              >
                Объявления
              </Button>
            </div>
          </div>
        </div>

        {/* Список новостей */}
        <div className="space-y-6">
          {filteredNews.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Новости не найдены
              </h3>
              <p className="text-muted-foreground">
                Попробуйте изменить параметры поиска
              </p>
            </div>
          ) : (
            filteredNews.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getCategoryVariant(item.category)} className="flex items-center gap-1">
                          {getCategoryIcon(item.category)}
                          {getCategoryLabel(item.category)}
                        </Badge>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.date).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                      <CardTitle className="text-xl mb-2">{item.title}</CardTitle>
                      <CardDescription className="text-base">
                        {item.excerpt}
                      </CardDescription>
                    </div>
                    
                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteNews(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none text-muted-foreground">
                    <p>{item.content}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
                    Автор: {item.author}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default News;