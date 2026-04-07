import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Privacy: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Политика конфиденциальности</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных пользователей
            сайта «ПрогрессГарант».
          </p>
          <div className="space-y-2">
            <p className="font-medium text-foreground">1. Какие данные мы можем собирать</p>
            <p>
              При регистрации, оформлении заказа или обращении в поддержку вы можете предоставить: имя, фамилию, номер
              телефона, адрес электронной почты, адрес доставки, а также иные сведения, которые вы вводите в формы на
              сайте.
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-foreground">2. Цели обработки</p>
            <p>
              Данные используются для регистрации аккаунта, обработки и выполнения заказов, обратной связи, улучшения
              качества сервиса, а также для соблюдения требований законодательства.
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-foreground">3. Передача данных третьим лицам</p>
            <p>
              Мы не продаём и не передаём персональные данные третьим лицам, за исключением случаев, когда это
              необходимо для исполнения заказа (например, доставка) или требуется законом.
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-foreground">4. Хранение и защита</p>
            <p>
              Мы принимаем разумные меры для защиты информации от несанкционированного доступа, изменения, раскрытия или
              уничтожения.
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-foreground">5. Cookies и технические данные</p>
            <p>
              Сайт может использовать cookies и технические данные (например, сведения о браузере) для корректной работы
              и аналитики. Вы можете ограничить использование cookies в настройках браузера.
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-foreground">6. Ваши права</p>
            <p>
              Вы можете запросить уточнение, обновление или удаление ваших данных, а также отозвать согласие на обработку
              в случаях, предусмотренных законом.
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-foreground">7. Контакты</p>
            <p>
              По вопросам обработки персональных данных свяжитесь с нами через контакты, указанные на сайте.
            </p>
          </div>
          <p className="text-xs">Дата последнего обновления: 07.04.2026</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Privacy;
