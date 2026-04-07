import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Логотип и описание */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
                <span className="logo"><img src="/img/logooo.png" alt=""/></span>
              </div>
              <span className="text-xl font-bold text-foreground">ПрогрессГарант</span>
            </Link>
            <p className="text-muted-foreground text-sm mb-4">
              Ведущий дистрибьютор табачной и кальянной продукции в Оренбурге. 
              Качественные товары для вашего бизнеса.
            </p>
            <p className="text-xs text-muted-foreground">
              © 2024 ПрогрессГарант. Все права защищены.
            </p>
          </div>

          {/* Быстрые ссылки */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Навигация</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/catalog" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Каталог товаров
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  О компании
                </Link>
              </li>
              <li>
                <Link to="/news" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Новости и акции
                </Link>
              </li>
              <li>
                <Link to="/partners" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Партнерам
                </Link>
              </li>
              <li>
                <Link to="/contacts" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Контакты
                </Link>
              </li>
            </ul>
          </div>

          {/* Контактная информация */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Контакты</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2 text-sm">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">+7 (3532) 123-456</span>
              </li>
              <li className="flex items-center space-x-2 text-sm">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">info@progressgarant.ru</span>
              </li>
              <li className="flex items-start space-x-2 text-sm">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <span className="text-muted-foreground">
                  г. Оренбург, ул. Диагностики, 7
                </span>
              </li>
              <li className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Пн-Пт: 9:00-18:00</span>
              </li>
            </ul>
          </div>

          {/* Юридическая информация */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Реквизиты</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>ООО "ПрогрессГарант"</strong>
              </p>
              <p>ИНН: 5614123456</p>
              <p>КПП: 561401001</p>
              <p>ОГРН: 1125614004789</p>
              <p className="text-xs mt-4">
                Юридический адрес:<br />
                460000, г. Оренбург,<br />
                ул. Диагностики, д. 7
              </p>
              <p className="text-xs mt-2">
                <strong>Руководитель:</strong><br />
                Пастухов Андрей Игоревич
              </p>
            </div>
          </div>
        </div>

        {/* Нижняя часть */}
        <div className="border-t border-border mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-muted-foreground mb-2 md:mb-0">
              Продажа табачной продукции лицам, не достигшим 18 лет, запрещена
            </p>
            <div className="flex space-x-4 text-xs text-muted-foreground">
              <Link to="/privacy" className="hover:text-primary transition-colors">
                Политика конфиденциальности
              </Link>
              <Link to="/terms" className="hover:text-primary transition-colors">
                Пользовательское соглашение
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;