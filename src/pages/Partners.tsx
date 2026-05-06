import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Handshake, 
  TrendingUp, 
  Users, 
  Shield,
  Truck,
  Clock,
  DollarSign,
  Award,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Partners: React.FC = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    businessType: '',
    experience: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Имитация отправки заявки
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Сохраняем заявку в localStorage
    const application = {
      ...formData,
      id: Date.now().toString(),
      date: new Date().toISOString(),
      status: 'pending'
    };

    const applications = JSON.parse(localStorage.getItem('progressgarant_applications') || '[]');
    applications.push(application);
    localStorage.setItem('progressgarant_applications', JSON.stringify(applications));

    toast({
      title: "Заявка отправлена!",
      description: "Мы свяжемся с вами в течение 24 часов для обсуждения деталей сотрудничества.",
    });

    // Очищаем форму
    setFormData({
      companyName: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      businessType: '',
      experience: '',
      message: ''
    });

    setIsSubmitting(false);
  };

  const advantages = [
    {
      icon: <DollarSign className="h-8 w-8 text-primary" />,
      title: "Конкурентные цены",
      description: "Прямые поставки от производителей позволяют предлагать лучшие цены на рынке"
    },
    {
      icon: <Truck className="h-8 w-8 text-primary" />,
      title: "Надежная логистика",
      description: "Собственная служба доставки обеспечивает своевременные поставки"
    },
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: "Гарантия качества",
      description: "100% оригинальная продукция с полным пакетом документов"
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Персональный менеджер",
      description: "Индивидуальное обслуживание и поддержка на всех этапах сотрудничества"
    },
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      title: "Гибкие условия",
      description: "Отсрочка платежа, индивидуальные скидки и специальные предложения"
    },
    {
      icon: <Award className="h-8 w-8 text-primary" />,
      title: "Программа лояльности",
      description: "Накопительная система скидок и бонусов для постоянных партнеров"
    }
  ];

  const requirements = [
    "Наличие действующей лицензии на розничную торговлю табачными изделиями",
    "Опыт работы в сфере розничной торговли от 6 месяцев",
    "Стабильный товарооборот и платежеспособность",
    "Соблюдение требований законодательства в области торговли табачными изделиями"
  ];

  const supportTypes = [
    {
      title: "Маркетинговая поддержка",
      items: ["Рекламные материалы", "Обучение персонала", "Консультации по ассортименту"]
    },
    {
      title: "Техническая поддержка",
      items: ["Помощь в оформлении документов", "Консультации по законодательству", "Поддержка CRM-системы"]
    },
    {
      title: "Логистическая поддержка",
      items: ["Быстрая доставка", "Гибкий график поставок", "Возможность срочных заказов"]
    }
  ];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Hero секция */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
            <Handshake className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Станьте нашим <span className="text-primary">партнером</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Присоединяйтесь к сети успешных предпринимателей, которые развивают свой бизнес 
            вместе с ПрогрессГарант. Предлагаем выгодные условия сотрудничества и полную поддержку.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">500+</div>
              <div className="text-sm text-muted-foreground">Активных партнеров</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">50+</div>
              <div className="text-sm text-muted-foreground">Брендов в каталоге</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">99%</div>
              <div className="text-sm text-muted-foreground">Довольных клиентов</div>
            </div>
          </div>
        </div>

        {/* Преимущества партнерства */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            Преимущества партнерства
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {advantages.map((advantage, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    {advantage.icon}
                  </div>
                  <CardTitle className="text-xl">{advantage.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {advantage.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Условия партнерства */}
        <section className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-8">
                Условия сотрудничества
              </h2>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    Требования к партнерам
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {requirements.map((requirement, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground text-sm">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-foreground mb-8">
                Поддержка партнеров
              </h2>
              <div className="space-y-4">
                {supportTypes.map((support, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{support.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {support.items.map((item, itemIndex) => (
                          <Badge key={itemIndex} variant="secondary">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Форма заявки */}
        <section className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Подать заявку на партнерство
              </h2>
              <p className="text-muted-foreground mb-8">
                Заполните форму, и наш менеджер свяжется с вами в течение 24 часов 
                для обсуждения условий сотрудничества.
              </p>

              <form
                id="orderForm"
                className="order-form space-y-6"
                action="https://api.web3forms.com/submit"
                method="POST"
              >
                <input type="hidden" name="access_key" value="83d99d26-1cd2-4c09-8c64-1395b05e31f1" />
                <input type="hidden" name="subject" value="Заявка на партнерство" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Название компании *</Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      required
                      maxLength={100}
                      placeholder="ООО 'Название'"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPerson">Контактное лицо *</Label>
                    <Input
                      id="contactPerson"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleInputChange}
                      required
                      maxLength={100}
                      placeholder="Имя Фамилия"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Телефон *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      maxLength={20}
                      placeholder="+7 (999) 123-45-67"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      maxLength={100}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Адрес точки продаж</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    maxLength={200}
                    placeholder="Город, улица, дом"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-red">
                  <div>
                    <Label htmlFor="businessType">Тип бизнеса</Label>
                    <select
                      id="businessType"
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-input rounded-md bg-background"
                    >
                      <option value="">Выберите тип</option>
                      <option value="tobacco-shop">Табачный магазин</option>
                      <option value="hookah-bar">Кальян-бар</option>
                      <option value="convenience-store">Продуктовый магазин</option>
                      <option value="gas-station">АЗС</option>
                      <option value="other">Другое</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="experience">Опыт работы</Label>
                    <select
                      id="experience"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-input rounded-md bg-background"
                    >
                      <option value="">Выберите опыт</option>
                      <option value="less-1">Менее 1 года</option>
                      <option value="1-3">1-3 года</option>
                      <option value="3-5">3-5 лет</option>
                      <option value="more-5">Более 5 лет</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="message">Дополнительная информация</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    maxLength={1000}
                    placeholder="Расскажите о ваших планах, ожиданиях от сотрудничества"
                    rows={4}
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-red flex items-center justify-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Отправка..."
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Отправить заявку
                    </>
                  )}
                </button>
              </form>
            </div>

            <div>
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 h-fit">
                <CardHeader>
                  <CardTitle>Контакты для партнеров</CardTitle>
                  <CardDescription>
                    Свяжитесь с нами удобным способом
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Отдел по работе с партнерами</p>
                      <p className="text-muted-foreground">+7 (3532) 123-456</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Email для партнеров</p>
                      <p className="text-muted-foreground">partners@progressgarant.ru</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Офис</p>
                      <p className="text-muted-foreground">
                        г. Оренбург, улица диагностики, 7<br />
                        Пн-Пт: 9:00-18:00
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-semibold">Этапы сотрудничества:</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-xs">1</div>
                        <span>Подача заявки</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-xs">2</div>
                        <span>Рассмотрение заявки (1-2 дня)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-xs">3</div>
                        <span>Встреча с менеджером</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-xs">4</div>
                        <span>Подписание договора</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-xs">5</div>
                        <span>Начало сотрудничества</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Partners;