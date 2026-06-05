# EventHub

EventHub — веб-приложение для создания и управления мероприятиями: публичные и приватные мероприятия, организации, администраторы, участники, команды, кейсы, решения, результаты, CSV-экспорт, приглашения по QR-коду, турникеты/пропуска и двухфакторная авторизация.

## Требования

Перед запуском установите:

- Node.js 22+  
  Рекомендуется Node.js LTS. Если используется Node.js 24 и возникают ошибки памяти, см. раздел ниже.
- npm
- PostgreSQL
- Redis

Порты по умолчанию:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4200/api`
- Email verification route: `http://localhost:4200/verify-email`

## Настройка Backend

Перейдите в папку backend:

```bash
cd back-nestjs
```

Установите зависимости:

```bash
npm install
```

Создайте файл `.env`:

```env
MODE=development

DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/eventHub?schema=public"

JWT_SECRET="your_jwt_secret"

SMTP_SERVER="smtp.example.com"
SMTP_LOGIN="your_email@example.com"
SMTP_PASSWORD="your_smtp_password"

ARC_GIS_API_KEY="your_arcgis_api_key"

REDIS_URL="redis://localhost:6379"
```

Сгенерируйте Prisma Client:

```bash
npx prisma db push
```

```bash
npx prisma generate
```

Запустите backend в режиме разработки:

```bash
npm run start:dev
```

## Настройка Frontend

Откройте вторую консоль и перейдите в папку frontend:

```bash
cd front-nextjs
```

Установите зависимости:

```bash
npm install
```

Создайте файл `.env`:

```env
JWT_SECRET="your_jwt_secret"
```

> Важно: `JWT_SECRET` должен совпадать с backend, если frontend использует JWT-проверки на своей стороне.

Запуск frontend:

```bash
npm run build
```

```bash
npm run start
```

## Redis

Redis используется для временных данных, приглашений, кодов и связанных механизмов.

Для локального запуска можно использовать Docker:

```bash
docker run --name eventhub-redis -p 6379:6379 -d redis
```

## PostgreSQL

Пример запуска PostgreSQL через Docker:

```bash
docker run --name eventhub-postgres ^
  -e POSTGRES_USER=postgres ^
  -e POSTGRES_PASSWORD=postgres ^
  -e POSTGRES_DB=eventhub ^
  -p 5432:5432 ^
  -d postgres:16
```

Для PowerShell в одну строку:

```powershell
docker run --name eventhub-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=eventhub -p 5432:5432 -d postgres:16
```

Тогда `DATABASE_URL` будет:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/eventhub?schema=public"
```

## Основные маршруты

### Публичная часть

```text
/guest
/guest/events/[eventId]
/auth
```

### Пользователь

```text
/user
/user/events/[eventId]
/profile
```

### Организатор

```text
/organization
```

### Администратор

```text
/admin
/admin/events
/admin/events/create
/admin/events/[eventId]
/admin/profile
```

### Турникет

```text
/turniket
/turniket/auth/login
```

### Сайт задеплоен 

```text
eventhub.omi.bz/
```
