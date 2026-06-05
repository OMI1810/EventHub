# EventHub VPS deployment

The production branch keeps the application UI and routes unchanged. Only
runtime URLs, cookies, CORS, process startup, and the Nginx proxy are configured
for the public domain.

## Environment

Create `back-nestjs/.env` from `back-nestjs/.env.production.example`.

Create `front-nextjs/.env.production` from
`front-nextjs/production.env.example`.

`JWT_SECRET` must be identical in both files.

## Nginx

Install the supplied config:

```bash
sudo cp deploy/nginx/eventhub.conf /etc/nginx/sites-available/eventhub
sudo ln -sfn /etc/nginx/sites-available/eventhub /etc/nginx/sites-enabled/eventhub
sudo nginx -t
sudo systemctl reload nginx
```

The dedicated `/verify-email` proxy is required because the existing backend
route intentionally lives outside the global `/api` prefix.

## Build

```bash
cd /var/www/eventhub/back-nestjs
npm ci
npx prisma generate
npx prisma db push
npm run build

cd /var/www/eventhub/front-nextjs
npm ci
npm run build
```

## Run

```bash
cd /var/www/eventhub
pm2 delete all
pm2 start ecosystem.config.js
pm2 save
```
