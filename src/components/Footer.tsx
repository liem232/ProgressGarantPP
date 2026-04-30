import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-secondary/30 border-t border-border">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Логотип и описание */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-primary overflow-hidden">
                <img src="/img/logooo.png" alt="ПрогрессГарант" className="w-full h-full object-cover"/>
              </div>
              <span className="text-lg font-bold text-foreground tracking-tight">ПрогрессГарант</span>
            </Link>
            <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
              Ведущий дистрибьютор табачной и кальянной продукции в Оренбурге. 
              Качественные товары для вашего бизнеса.
            </p>
            <p className="text-xs text-muted-foreground">
              © 2024 ПрогрессГарант. Все права защищены.
            </p>
          </div>

          {/* Быстрые ссылки */}
          <div>
            <h3 className="font-semibold text-foreground mb-3 text-sm">Навигация</h3>
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
            <h3 className="font-semibold text-foreground mb-3 text-sm">Контакты</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                <span>+7 (3532) 123-456</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <span>info@progressgarant.ru</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <span>г. Оренбург, ул. Диагностики, 7</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" />
                <span>Пн-Пт: 9:00-18:00</span>
              </li>
            </ul>
          </div>

          {/* Юридическая информация */}
          <div>
            <h3 className="font-semibold text-foreground mb-3 text-sm">Реквизиты</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">ООО "ПрогрессГарант"</p>
              <p className="text-xs">ИНН: 5614123456</p>
              <p className="text-xs">КПП: 561401001</p>
              <p className="text-xs">ОГРН: 1125614004789</p>
            </div>
          </div>
        </div>

        {/* Нижняя часть */}
        <div className="border-t border-border mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">
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