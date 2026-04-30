import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Plus, Minus, Trash2, Package, ArrowLeft } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

const Cart: React.FC = () => {
  const { items, updateQuantity, removeFromCart, totalPrice, totalItems, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Корзина пуста
            </h1>
            <p className="text-muted-foreground mb-6">
              Добавьте товары из каталога, чтобы сделать заказ
            </p>
            <Button size="lg" className="shadow-primary" asChild>
              <Link to="/catalog">
                Перейти в каталог
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-6">
      <div className="container mx-auto px-4">
        {/* Заголовок */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="outline" size="sm" className="h-9" asChild>
            <Link to="/catalog">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Назад
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Корзина
            </h1>
            <p className="text-xs text-muted-foreground">
              {totalItems} {totalItems === 1 ? 'товар' : totalItems < 5 ? 'товара' : 'товаров'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Список товаров */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 bg-card rounded-lg border border-border p-3 product-card-hover dark:shadow-none">
                {/* Изображение товара */}
                <div className="w-20 h-20 bg-secondary/50 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <Package className="h-8 w-8 text-muted-foreground/50" />
                  )}
                </div>

                {/* Информация о товаре */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-sm text-foreground line-clamp-1">
                      {item.name}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive -mt-1 -mr-1"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {item.brand && (
                    <p className="text-[10px] text-primary font-medium uppercase tracking-wide">{item.brand}</p>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-sm text-foreground">
                        {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.price.toLocaleString('ru-RU')} ₽/шт
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Кнопка очистить корзину */}
            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={clearCart}>
                <Trash2 className="h-4 w-4 mr-1" />
                Очистить корзину
              </Button>
            </div>
          </div>

          {/* Итоги заказа */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-card rounded-lg border border-border p-4 dark:shadow-none">
              <h3 className="font-semibold text-base mb-4">Итого</h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Товары ({totalItems}):</span>
                  <span className="font-medium">{totalPrice.toLocaleString('ru-RU')} ₽</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Доставка:</span>
                  <span className="font-medium text-primary">Бесплатно</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between text-lg font-bold mb-4">
                <span>К оплате:</span>
                <span className="text-foreground">
                  {totalPrice.toLocaleString('ru-RU')} ₽
                </span>
              </div>

              <Button 
                className="w-full shadow-primary mb-3" 
                size="lg"
                onClick={handleCheckout}
              >
                {isAuthenticated ? 'Оформить заказ' : 'Войти и оформить'}
              </Button>

              {!isAuthenticated && (
                <p className="text-xs text-muted-foreground text-center mb-4">
                  Для оформления заказа необходимо войти в систему
                </p>
              )}

              <div className="text-xs text-muted-foreground space-y-1">
                <p className="flex items-center gap-1">
                  <span className="text-primary">✓</span> Гарантия качества
                </p>
                <p className="flex items-center gap-1">
                  <span className="text-primary">✓</span> Быстрая доставка по Оренбургу
                </p>
                <p className="flex items-center gap-1">
                  <span className="text-primary">✓</span> Поддержка клиентов
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;