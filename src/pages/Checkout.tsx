import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, CreditCard, Truck, MapPin } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { createOrder, checkOrderLimit } from '@/services/ordersService';
import { orderSchema } from '@/lib/validation';
import AddressAutocomplete from '@/components/AddressAutocomplete';

const Checkout: React.FC = () => {
  const [orderData, setOrderData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    comment: '',
    deliveryMethod: 'delivery',
    paymentMethod: 'cash'
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderLimit, setOrderLimit] = useState({ allowed: true, remaining: 3 });

  const { items: cartItems, totalPrice: totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setOrderData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || ''
      }));
    }
  }, [user]);

  // Проверка лимита заказов при загрузке
  useEffect(() => {
    const checkLimit = async () => {
      const limit = await checkOrderLimit(user?.id);
      setOrderLimit(limit);
    };
    checkLimit();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setOrderData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user?.id) {
      toast({
        title: 'Ошибка',
        description: 'Необходимо войти в систему, чтобы оформить заказ',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    if (!acceptTerms) {
      toast({
        title: "Ошибка",
        description: "Необходимо согласиться с условиями",
        variant: "destructive"
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Ошибка",
        description: "Корзина пуста",
        variant: "destructive"
      });
      return;
    }

    // Проверка лимита заказов
    const limitCheck = await checkOrderLimit(user?.id);
    if (!limitCheck.allowed) {
      toast({
        title: "Лимит заказов исчерпан",
        description: "Вы достигли максимального количества заказов (3) на сегодня. Попробуйте оформить заказ завтра.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const candidateOrder = {
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        orderData: {
          firstName: orderData.firstName,
          lastName: orderData.lastName,
          email: orderData.email,
          phone: orderData.phone,
          city: 'Оренбург',
          address: orderData.deliveryMethod === 'delivery' ? orderData.address : 'Самовывоз (пр-д Автоматики, 12)',
          comment: orderData.comment,
          userId: user.id,
        },
        totalPrice: totalAmount,
        totalItems: cartItems.reduce((acc, item) => acc + item.quantity, 0),
        date: new Date().toISOString(),
        status: 'pending' as const,
      };

      const parsed = orderSchema.safeParse(candidateOrder);
      if (!parsed.success) {
        toast({
          title: 'Ошибка',
          description: parsed.error.issues[0]?.message || 'Проверьте данные заказа',
          variant: 'destructive',
        });
        return;
      }

      // Сохраняем заказ в Firestore
      const order = await createOrder(parsed.data);

      clearCart();

      toast({
        title: "Заказ оформлен!",
        description: `Заказ №${order.id.slice(-6)} успешно создан. Мы свяжемся с вами в ближайшее время.`,
      });

      navigate('/orders');
    } catch (error) {
      console.error('Ошибка:', error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось создать заказ. Попробуйте позже.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
          Оформление заказа
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Форма заказа */}
          <div className="lg:col-span-2">
            <form
              id="orderForm"
              onSubmit={handleSubmit}
              className="space-y-6"
            >

              {/* Форма оформления заказа */}
              <Card className="overflow-visible">
                <CardHeader>
                  <CardTitle className="text-xl">Оформление заказа</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Контактные данные */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Контактные данные
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">Имя *</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={orderData.firstName}
                          onChange={handleInputChange}
                          required
                          maxLength={50}
                          placeholder="Ваше имя"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Фамилия *</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={orderData.lastName}
                          onChange={handleInputChange}
                          required
                          maxLength={50}
                          placeholder="Ваша фамилия"
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
                          value={orderData.phone}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9+\-\s()]/g, '');
                            handleInputChange({ target: { name: 'phone', value } } as React.ChangeEvent<HTMLInputElement>);
                          }}
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
                          value={orderData.email}
                          onChange={handleInputChange}
                          required
                          maxLength={100}
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Доставка */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Способ доставки
                    </h3>
                    <RadioGroup
                      value={orderData.deliveryMethod}
                      onValueChange={(value) => setOrderData(prev => ({ ...prev, deliveryMethod: value }))}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="delivery" id="delivery" />
                        <Label htmlFor="delivery">Доставка по Оренбургу (бесплатно)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pickup" id="pickup" />
                        <Label htmlFor="pickup">Самовывоз (пр-д Автоматики, 12)</Label>
                      </div>
                    </RadioGroup>

                    {orderData.deliveryMethod === 'delivery' && (
                      <div className="mt-4">
                        <Label htmlFor="address">Адрес доставки *</Label>
                        <AddressAutocomplete
                          value={orderData.address}
                          onChange={(value) => setOrderData(prev => ({ ...prev, address: value }))}
                          placeholder="Начните вводить адрес (улица, дом, квартира)"
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Оплата */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Способ оплаты
                    </h3>
                    <RadioGroup
                      value={orderData.paymentMethod}
                      onValueChange={(value) => setOrderData(prev => ({ ...prev, paymentMethod: value }))}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cash" id="cash" />
                        <Label htmlFor="cash">Наличными при получении</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card">Картой при получении</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="transfer" id="transfer" />
                        <Label htmlFor="transfer">Безналичный расчет</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Separator />

                  {/* Комментарий */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm text-muted-foreground">Комментарий к заказу</h3>
                    <Textarea
                      name="comment"
                      value={orderData.comment}
                      onChange={handleInputChange}
                      maxLength={500}
                      placeholder="Дополнительная информация для курьера или менеджера"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Предупреждение о лимите */}
              {!orderLimit.allowed && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Вы достигли максимального количества заказов (3) на сегодня. 
                    Попробуйте оформить заказ завтра.
                  </AlertDescription>
                </Alert>
              )}
              {orderLimit.allowed && orderLimit.remaining < 3 && (
                <Alert>
                  <AlertDescription>
                    Осталось заказов на сегодня: {orderLimit.remaining} из 3
                  </AlertDescription>
                </Alert>
              )}

              {/* Согласие */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                />
                <Label htmlFor="terms" className="text-sm">
                  Я согласен с условиями обработки персональных данных и пользовательским соглашением
                </Label>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting || !acceptTerms || !orderLimit.allowed}
              >
                {isSubmitting ? 'Оформляем заказ...' : 'Оформить заказ'}
              </Button>
            </form>
          </div>

          {/* Сводка заказа */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Ваш заказ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Товары */}
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center flex-shrink-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="object-cover w-full h-full rounded"
                          />
                        ) : (
                          <Package className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-2">{item.name}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{item.quantity} шт.</span>
                          <span className="font-medium">
                            {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Итоги */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Товары ({cartItems.reduce((acc, item) => acc + item.quantity, 0)}):</span>
                    <span>{totalAmount.toLocaleString('ru-RU')} ₽</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Доставка:</span>
                    <span className="text-primary">Бесплатно</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Итого:</span>
                  <span className="text-primary">
                    {totalAmount.toLocaleString('ru-RU')} ₽
                  </span>
                </div>

                <Alert>
                  <MapPin className="h-4 w-4" />
                  <AlertDescription>
                    Доставка осуществляется по Оренбургу в течение 1-2 рабочих дней
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;