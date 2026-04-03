# Инструкция по деплою на Vercel

## Подготовка к деплою

### 1. Убедитесь, что у вас есть:
- Аккаунт на [Vercel](https://vercel.com)
- Проект настроен и работает локально
- Firebase проект создан и настроен

### 2. Настройка переменных окружения

В Vercel Dashboard → Project Settings → Environment Variables добавьте:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Деплой через Vercel CLI

```bash
# Установите Vercel CLI (если не установлен)
npm i -g vercel

# Залогиньтесь
vercel login

# В папке проекта выполните
vercel
```

### 4. Деплой через GitHub интеграцию

1. Запушьте проект на GitHub
2. Зайдите на vercel.com → Add New Project
3. Импортируйте репозиторий
4. Vercel автоматически найдет `vercel.json` и настройки
5. Добавьте переменные окружения в настройках проекта
6. Нажмите Deploy

### 5. Настройка Firebase для продакшена

В Firebase Console → Authentication → Settings → Authorized domains добавьте домен Vercel:
- `your-project.vercel.app`
- `www.your-domain.com` (если используете кастомный домен)

### 6. Настройка Firestore Security Rules

В Firebase Console → Firestore Database → Rules установите правила безопасности.

## Структура проекта

```
ПрогрессГарант/
├── .env              # Локальные переменные окружения (не коммитить!)
├── .env.example      # Шаблон переменных окружения
├── vercel.json       # Конфигурация деплоя
├── dist/             # Сборка (генерируется автоматически)
├── public/           # Статические файлы
└── src/              # Исходный код
```

## Проверка перед деплоем

Локально выполните:
```bash
npm run build
npm run preview
```

Убедитесь, что:
- Сборка проходит без ошибок
- Все страницы открываются
- Firebase подключен корректно
- Админ-панель работает

## Важные замечания

1. **Картинки**: Поместите все изображения в `public/img/`
2. **Environment Variables**: Все `VITE_` переменные должны быть добавлены в Vercel Dashboard
3. **Routes**: SPA роутинг настроен в `vercel.json` (все пути ведут на index.html)
