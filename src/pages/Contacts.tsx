import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  User, 
  MessageCircle,
  ExternalLink,
  Navigation,
  Copy,
  Users,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Contacts: React.FC = () => {
  const { toast } = useToast();

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Скопировано",
      description: `${label} скопирован в буфер обмена`,
    });
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Адрес',
      value: 'г. Оренбург, ул. Диагностики, 7',
      action: 'Открыть на карте',
      actionUrl: 'https://yandex.ru/maps/-/CDaQGT',
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-950/30'
    },
    {
      icon: Phone,
      title: 'Телефон',
      value: '+7 (3532) 123-456',
      action: 'Позвонить',
      actionUrl: 'tel:+73532123456',
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950/30'
    },
    {
      icon: Mail,
      title: 'Email',
      value: 'info@progressgarant.ru',
      action: 'Написать',
      actionUrl: 'mailto:info@progressgarant.ru',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30'
    },
    {
      icon: Clock,
      title: 'Режим работы',
      value: 'Пн-Пт: 9:00-18:00',
      subValue: 'Сб: 10:00-15:00 (по записи)',
      color: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/5 via-accent to-primary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-4 px-4 py-1">Контакты</Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Свяжитесь с нами
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Мы всегда рады ответить на ваши вопросы и помочь с выбором продукции
            </p>
          </div>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="py-16 -mt-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((item, index) => (
              <Card key={index} className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-500">
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-2xl ${item.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className={`h-7 w-7 ${item.color}`} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-foreground font-medium mb-1">{item.value}</p>
                  {item.subValue && (
                    <p className="text-sm text-muted-foreground">{item.subValue}</p>
                  )}
                  {item.action && item.actionUrl && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-4 p-0 h-auto font-medium"
                      asChild
                    >
                      <a href={item.actionUrl} target="_blank" rel="noopener noreferrer">
                        {item.action}
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Map and Details */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Map */}
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="aspect-video relative bg-muted">
                <iframe 
                  src="https://yandex.ru/map-widget/v1/?ll=55.0977%2C51.7682&z=16&text=проспект%20Автоматики%2012%20Оренбург" 
                  width="100%" 
                  height="100%" 
                  frameBorder="0"
                  className="absolute inset-0"
                  allowFullScreen
                />
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Офис и склад</p>
                    <p className="text-sm text-muted-foreground">ул. Диагностики, 7</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://yandex.ru/maps/-/CDaQGT" target="_blank" rel="noopener noreferrer">
                      <Navigation className="mr-2 h-4 w-4" />
                      Маршрут
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Details */}
            <div className="space-y-6">
              {/* Managers Card */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    Наши менеджеры
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { name: 'Мигель', phone: '+7 (3532) 123-456' },
                    { name: 'Ильич', phone: '+7 (3532) 123-456' },
                    { name: 'Кристина', phone: '+7 (3532) 123-456' }
                  ].map((manager, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{manager.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{manager.phone}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    Руководитель
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-semibold text-lg">Пастухов Андрей Игоревич</p>
                    <p className="text-muted-foreground">Генеральный директор</p>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">+7 (3532) 123-456</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="ml-auto h-8 w-8"
                      onClick={() => handleCopy('+73532123456', 'Телефон')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Реквизиты</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 hover:bg-muted rounded-lg">
                    <span className="text-muted-foreground">Организация</span>
                    <span className="font-medium">ООО "ПрогрессГарант"</span>
                  </div>
                  <div className="flex justify-between p-2 hover:bg-muted rounded-lg">
                    <span className="text-muted-foreground">ИНН</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">5614123456</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => handleCopy('5614123456', 'ИНН')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between p-2 hover:bg-muted rounded-lg">
                    <span className="text-muted-foreground">КПП</span>
                    <span className="font-medium">561401001</span>
                  </div>
                  <div className="flex justify-between p-2 hover:bg-muted rounded-lg">
                    <span className="text-muted-foreground">ОГРН</span>
                    <span className="font-medium">1125614004789</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Chat CTA */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary-glow">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 drop-shadow-sm">
              Готовы стать партнером?
            </h2>
            <p className="text-xl mb-10 max-w-2xl mx-auto opacity-95 drop-shadow-sm">
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
                className="h-14 px-8 text-lg bg-white text-primary hover:bg-white/90 shadow-lg"
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
    </div>
  );
};

export default Contacts;