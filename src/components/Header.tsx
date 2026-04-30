import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import {
  ShoppingCart, 
  User, 
  Menu, 
  X,
  LogOut,
  UserCheck,
  Heart,
  Search,
  Sun,
  Moon,
  MapPin,
  Phone,
  FileText,
  Briefcase,
  Newspaper,
  Info,
  MessageSquare
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  transparent?: boolean;
}

const Header: React.FC<HeaderProps> = ({ transparent = false }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { totalItems } = useCart();
  const { user, logout, isAuthenticated, isAdmin, isManager } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Отслеживаем скролл для смены фона хедера
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Навигационные ссылки
  const navLinks = [
    { name: 'О компании', href: '/about', icon: Info },
    { name: 'Новости', href: '/news', icon: Newspaper },
    { name: 'Партнёрам', href: '/partners', icon: Briefcase },
    { name: 'Контакты', href: '/contacts', icon: Phone },
  ];

  // Определяем класс хедера в зависимости от состояния с плавными переходами
  const headerClass = transparent && !scrolled 
    ? 'header-transparent transition-all duration-500 ease-in-out' 
    : 'header-solid bg-background/95 backdrop-blur-md transition-all duration-500 ease-in-out';

  const textClass = transparent && !scrolled 
    ? 'text-white transition-colors duration-500 ease-in-out' 
    : 'text-foreground transition-colors duration-500 ease-in-out';
  const mutedTextClass = transparent && !scrolled 
    ? 'text-white/70 transition-colors duration-500 ease-in-out' 
    : 'text-muted-foreground transition-colors duration-500 ease-in-out';

  return (
    <>
      {/* Верхний мини-бар (виден только когда не прозрачный или проскроллили) */}
      {(!transparent || scrolled) && (
        <div className="bg-muted border-b border-border text-xs py-2 hidden md:block">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">Дистрибьютор табачной продукции в Оренбурге</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">О нас</Link>
              <Link to="/partners" className="text-muted-foreground hover:text-primary transition-colors">Партнёрам</Link>
              <Link to="/contacts" className="text-muted-foreground hover:text-primary transition-colors">Контакты</Link>
            </div>
          </div>
        </div>
      )}

      {/* Основной хеддер */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerClass} ${!transparent || scrolled ? 'border-b border-border' : ''}`}>
        <div className="container mx-auto px-4">
          {/* Первая строка - основная */}
          <div className="flex items-center justify-between h-16">
            {/* Левая часть - Логотип, кнопка каталога и навигация */}
            <div className="flex items-center gap-3">
              {/* Логотип */}
              <Link to="/" className="flex items-center gap-2">
                <div className={`w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-primary overflow-hidden ${transparent && !scrolled ? 'ring-2 ring-white/20' : ''}`}>
                  <img src="/img/logooo.png" alt="ПрогрессГарант" className="w-full h-full object-cover" />
                </div>
                <span className={`text-lg font-bold tracking-tight hidden lg:block ${textClass}`}>
                  ПрогрессГарант
                </span>
              </Link>

              {/* Кнопка каталога - всегда оранжевая */}
              <Button 
                className="hidden md:flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary"
                asChild
              >
                <Link to="/catalog">
                  <Menu className="h-4 w-4" />
                  Каталог
                </Link>
              </Button>

              {/* Десктопная навигация */}
              <nav className="hidden xl:flex items-center gap-1 ml-2">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.href;
                  return (
                    <Link
                      key={link.name}
                      to={link.href}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? transparent && !scrolled
                            ? 'text-white bg-white/20'
                            : 'text-primary bg-primary/10'
                          : transparent && !scrolled
                            ? 'text-white/80 hover:text-white hover:bg-white/10'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Поиск - виден только на десктопе когда не прозрачный */}
            {(!transparent || scrolled) && (
              <div className="hidden lg:flex flex-1 max-w-xl mx-6">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const query = formData.get('search') as string;
                      if (query.trim()) {
                        navigate(`/catalog?search=${encodeURIComponent(query.trim())}`);
                      }
                    }}
                    className="w-full"
                  >
                    <input
                      name="search"
                      type="text"
                      placeholder="Искать на ПрогрессГарант"
                      className="w-full h-10 pl-10 pr-4 rounded-lg bg-secondary border-none focus:ring-2 focus:ring-primary/20 text-sm"
                    />
                  </form>
                </div>
              </div>
            )}

            {/* Правая часть - Иконки */}
            <div className="flex items-center gap-1">
              {/* Переключатель темы - компактный toggle */}
              {mounted && (
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className={`relative h-7 w-12 rounded-full transition-colors duration-200 focus:outline-none ${
                    theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'
                  }`}
                  aria-label="Переключить тему"
                >
                  <span
                    className={`absolute top-0.5 left-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow transition-transform duration-200 ${
                      theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  >
                    {theme === 'dark' ? (
                      <Moon className="h-3.5 w-3.5 text-slate-700" />
                    ) : (
                      <Sun className="h-3.5 w-3.5 text-orange-500" />
                    )}
                  </span>
                </button>
              )}

              {/* Чаты для менеджеров и админов */}
              {(isManager || isAdmin) && (
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className={`relative h-10 w-10 ${mutedTextClass} hover:text-primary`}
                >
                  <Link to="/manager/chat">
                    <MessageSquare className="h-5 w-5" />
                  </Link>
                </Button>
              )}

              {/* Корзина */}
              <Button
                variant="ghost"
                size="icon"
                asChild
                className={`relative h-10 w-10 ${mutedTextClass} hover:text-primary`}
              >
                <Link to="/cart">
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold">
                      {totalItems}
                    </span>
                  )}
                </Link>
              </Button>

              {/* Профиль */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className={`h-10 w-10 ${mutedTextClass} hover:text-primary`}
                    >
                      {isAdmin ? <UserCheck className="h-5 w-5" /> : <User className="h-5 w-5" />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="font-medium text-sm">{user?.firstName || user?.username}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="h-4 w-4 mr-2" />
                      Профиль
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/orders')}>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Мои заказы
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/admin')}>
                          Админ-панель
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/admin/chat')}>
                          Чаты (Admin)
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Выйти
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/login')}
                  className={`h-10 w-10 ${mutedTextClass} hover:text-primary`}
                >
                  <User className="h-5 w-5" />
                </Button>
              )}

              {/* Мобильное меню */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`lg:hidden h-10 w-10 ${mutedTextClass}`}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Мобильная навигация */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-background border-t border-border absolute top-full left-0 right-0 shadow-lg max-h-[80vh] overflow-y-auto">
            <nav className="flex flex-col p-4">
              {/* Каталог */}
              <Link
                to="/catalog"
                className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-accent text-foreground font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Menu className="h-5 w-5 text-primary" />
                Каталог
              </Link>
              
              <div className="border-t border-border my-2" />
              
              {/* Навигационные ссылки */}
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-accent text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <link.icon className="h-5 w-5 text-muted-foreground" />
                  {link.name}
                </Link>
              ))}
              
              <div className="border-t border-border my-2" />
              
              {/* Переключатель темы в мобильном меню */}
              <button
                onClick={() => {
                  setTheme(theme === 'dark' ? 'light' : 'dark');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-accent text-foreground w-full text-left"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="h-5 w-5 text-amber-500" />
                    Светлая тема
                  </>
                ) : (
                  <>
                    <Moon className="h-5 w-5 text-indigo-500" />
                    Тёмная тема
                  </>
                )}
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Отступ для контента когда хеддер не прозрачный */}
      {(!transparent || scrolled) && <div className="h-16" />}
    </>
  );
};

export default Header;