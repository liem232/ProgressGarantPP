import { z } from 'zod';

// Product validation schema
export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Название должно быть минимум 2 символа').max(200, 'Название слишком длинное'),
  price: z.number().min(0, 'Цена не может быть отрицательной').max(1000000, 'Цена слишком высока'),
  category: z.string().min(1, 'Выберите категорию'),
  brand: z.string().optional(),
  description: z.string().max(1000, 'Описание слишком длинное').optional(),
  inStock: z.boolean().default(true),
  image: z.string().url('Некорректный URL изображения').optional().or(z.literal('')),
  volume: z.string().optional(),
  strength: z.string().optional(),
  quantity: z.number().min(0, 'Количество не может быть отрицательным').default(0),
});

export type ProductInput = z.infer<typeof productSchema>;

// Order validation schema
export const orderItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  quantity: z.number().min(1, 'Минимум 1 шт'),
  image: z.string().optional(),
});

export const orderDataSchema = z.object({
  firstName: z.string().min(2, 'Введите имя').max(50),
  lastName: z.string().min(2, 'Введите фамилию').max(50),
  email: z.string().email('Некорректный email'),
  phone: z.string().min(10, 'Введите телефон полностью').regex(/^\+?[\d\s\-\(\)]+$/, 'Некорректный номер'),
  company: z.string().optional(),
  city: z.string().default('Оренбург'),
  address: z.string().min(5, 'Введите адрес').max(200),
  comment: z.string().max(500, 'Комментарий слишком длинный').optional(),
  userId: z.string().optional(),
});

export const orderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Добавьте товары в заказ'),
  orderData: orderDataSchema,
  totalPrice: z.number().min(0),
  totalItems: z.number().min(1),
  status: z.enum(['pending', 'processing', 'completed', 'cancelled']).default('pending'),
});

export type OrderInput = z.infer<typeof orderSchema>;

// User registration schema
export const registerSchema = z.object({
  username: z.string().min(3, 'Логин минимум 3 символа').max(30, 'Логин слишком длинный'),
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль минимум 6 символов').max(100),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Некорректный номер').optional().or(z.literal('')),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Login schema
export const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Chat message schema
export const chatMessageSchema = z.object({
  text: z.string().min(1, 'Сообщение не может быть пустым').max(1000, 'Сообщение слишком длинное'),
  senderId: z.string(),
  senderName: z.string().min(1),
  senderRole: z.enum(['admin', 'user', 'manager']),
  attachments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    url: z.string().url(),
    type: z.string(),
    size: z.number().max(10 * 1024 * 1024, 'Файл слишком большой (макс 10MB)'),
  })).max(5, 'Максимум 5 файлов').optional(),
  orderId: z.string().optional(),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

// File upload schema
export const fileUploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size <= 10 * 1024 * 1024,
    'Файл слишком большой (максимум 10MB)'
  ).refine(
    (file) => ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type),
    'Неподдерживаемый формат файла'
  ),
});
