import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Terms: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Пользовательское соглашение</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Настоящее Пользовательское соглашение регулирует использование сайта «ПрогрессГарант», включая регистрацию,
            оформление заказов и использование сервисов обратной связи.
          </p>
          <div className="space-y-2">
            <p className="font-medium text-foreground">1. Общие положения</p>
            <p>
              Используя сайт, вы подтверждаете, что ознакомились с условиями настоящего Соглашения и принимаете их.
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-foreground">2. Регистрация и аккаунт</p>
            <p>
              Вы обязуетесь предоставлять достоверные данные при регистрации и не передавать доступ к аккаунту третьим
              лицам. Вы несёте ответственность за сохранность логина и пароля.
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-foreground">3. Заказы и взаимодействие</p>
            <p>
              Оформляя заказ, вы предоставляете данные, необходимые для обработки и связи. Мы вправе уточнять данные для
              выполнения заказа.
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-foreground">4. Ограничения</p>
            <p>
              Запрещается использовать сайт для противоправных действий, попыток несанкционированного доступа, рассылки
              спама, публикации вредоносных материалов или обхода ограничений.
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-foreground">5. Интеллектуальная собственность</p>
            <p>
              Материалы сайта (тексты, изображения, дизайн) защищены законом. Копирование и использование допускается
              только с согласия правообладателя.
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-foreground">6. Ответственность</p>
            <p>
              Мы стараемся поддерживать корректную работу сайта, однако не гарантируем отсутствие технических сбоев.
              Информация на сайте может обновляться и изменяться.
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-foreground">7. Заключительные положения</p>
            <p>
              Мы можем обновлять условия Соглашения. Актуальная версия публикуется на этой странице.
            </p>
          </div>
          <p className="text-xs">Дата последнего обновления: 07.04.2026</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Terms;
