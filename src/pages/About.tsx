import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  Award, 
  TrendingUp, 
  Clock,
  MapPin,
  Phone,
  Mail,
  Star,
  CheckCircle,
  Target,
  Heart
} from 'lucide-react';

const About: React.FC = () => {
  const achievements = [
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      number: "500+",
      title: "Довольных клиентов",
      description: "Более 500 предпринимателей доверяют нам"
    },
    {
      icon: <Award className="h-8 w-8 text-primary" />,
      number: "50+",
      title: "Брендов в каталоге",
      description: "Работаем только с проверенными производителями"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-primary" />,
      number: "5",
      title: "Лет на рынке",
      description: "Стабильная работа с 2019 года"
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-primary" />,
      number: "99%",
      title: "Качественных товаров",
      description: "Строгий контроль качества продукции"
    }
  ];

  const values = [
    {
      icon: <Target className="h-6 w-6 text-primary" />,
      title: "Профессионализм",
      description: "Глубокие знания рынка и индивидуальный подход к каждому клиенту"
    },
    {
      icon: <Heart className="h-6 w-6 text-primary" />,
      title: "Надежность",
      description: "Строгое соблюдение договоренностей и гарантии качества"
    },
    {
      icon: <Star className="h-6 w-6 text-primary" />,
      title: "Качество",
      description: "Только сертифицированная продукция от ведущих производителей"
    }
  ];

  const timeline = [
    {
      year: "2019",
      title: "Основание компании",
      description: "Пастухов А.И. основал ПрогрессГарант с целью развития рынка табачной продукции в регионе"
    },
    {
      year: "2020",
      title: "Расширение ассортимента",
      description: "Добавили в каталог электронные сигареты и аксессуары для кальянов"
    },
    {
      year: "2021",
      title: "Партнерства с брендами",
      description: "Заключили дистрибьюторские соглашения с ведущими производителями"
    },
    {
      year: "2022",
      title: "Цифровизация",
      description: "Запустили онлайн-каталог и систему электронного документооборота"
    },
    {
      year: "2023",
      title: "Новый офис",
      description: "Переехали в более просторное помещение с собственным складом"
    },
    {
      year: "2024",
      title: "Развитие сервиса",
      description: "Запустили программу лояльности и улучшили систему доставки"
    }
  ];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Hero секция */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            О компании <span className="text-primary">ПрогрессГарант</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Мы - ведущий дистрибьютор табачной и кальянной продукции в Оренбургской области, 
            помогающий предпринимателям развивать свой бизнес с 2019 года.
          </p>
        </div>

        {/* Основная информация */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-6">Наша история</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Компания "ПрогрессГарант" была основана в 2019 году предпринимателем 
                Пастуховым Андреем Игоревичем с целью создания надежной дистрибьюторской 
                сети табачной продукции в Оренбургской области.
              </p>
              <p>
                Начав с небольшого ассортимента кальянного табака, мы быстро расширили 
                линейку товаров, включив в неё кальяны премиум-класса, электронные сигареты, 
                бестабачные смеси и широкий спектр аксессуаров.
              </p>
              <p>
                Сегодня ПрогрессГарант - это современная компания с собственным складом, 
                налаженной логистикой и командой профессионалов, которые знают рынок 
                табачной продукции изнутри.
              </p>
            </div>
          </div>

          <div>
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-primary" />
                  Контактная информация
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Адрес офиса:</p>
                    <p className="text-muted-foreground">г. Оренбург, пр-д Автоматики д.19</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Телефон:</p>
                    <p className="text-muted-foreground">+7 (3532) 123-456</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Email:</p>
                    <p className="text-muted-foreground">info@progressgarant.ru</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Режим работы:</p>
                    <p className="text-muted-foreground">Пн-Пт: 9:00-18:00</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Достижения */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            Наши достижения
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {achievements.map((achievement, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    {achievement.icon}
                  </div>
                  <div className="text-3xl font-bold text-primary mb-2">
                    {achievement.number}
                  </div>
                  <CardTitle className="text-lg">{achievement.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    {achievement.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Ценности */}
        <section className="mb-16 bg-muted/30 rounded-2xl p-8 md:p-12">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            Наши ценности
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="mx-auto mb-4 w-12 h-12 bg-background rounded-full flex items-center justify-center">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {value.title}
                </h3>
                <p className="text-muted-foreground">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* История развития */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            История развития
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {timeline.map((item, index) => (
                <div key={index} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <Badge variant="outline" className="text-primary border-primary bg-primary/10">
                      {item.year}
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Миссия и видение */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl">Наша миссия</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Обеспечить предпринимателей Оренбурга и области качественной табачной 
                  продукцией по конкурентным ценам, предоставляя высокий уровень сервиса 
                  и поддержки для развития их бизнеса.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Наше видение</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Стать ведущей дистрибьюторской компанией в сфере табачной продукции 
                  в Приволжском федеральном округе, известной своим профессионализмом, 
                  надежностью и инновационным подходом к бизнесу.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;