# Deploy na Hostinger VPS

Este projeto deve rodar como servidor Node.js (`next start`). Ele nao e exportavel como site estatico porque usa API routes, Supabase, Prisma, Mercado Pago, upload/processamento de fotos, R2 e Google Drive.

## Requisitos da VPS

- Ubuntu 22.04/24.04.
- Node.js 20.9 ou superior. Recomendo Node 22 LTS ou 24 se a VPS ja estiver padronizada nele.
- Nginx como reverse proxy.
- PM2 para manter o processo Next online.
- Git instalado.
- Pelo menos 2 GB de RAM; 4 GB e mais confortavel por causa do `sharp` no processamento de fotos.

## Variaveis obrigatorias

Copie `.env.production.example` para `.env.production` na VPS e preencha:

- `APP_URL`
- `DATABASE_URL`
- `DIRECT_URL` se usar uma URL direta para migrations
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ADMIN_EMAIL`
- `NEXT_PUBLIC_ADMIN_EMAIL`
- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`
- `GOOGLE_DRIVE_FOLDER_ID`
- Credenciais Google: OAuth (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`) ou service account (`GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`)
- `MERCADO_PAGO_ACCESS_TOKEN`
- `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY`

Importante: as variaveis `NEXT_PUBLIC_*` sao embutidas no bundle durante `npm run build`. Se mudar alguma delas, rode build de novo.

## Primeiro deploy

```bash
sudo apt update
sudo apt install -y nginx git curl build-essential ffmpeg

# Instale Node via nvm, fnm ou NodeSource. Exemplo com NodeSource 22:
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

sudo npm install -g pm2

cd /var/www
sudo git clone SEU_REPOSITORIO_GIT clics
sudo chown -R $USER:$USER /var/www/clics
cd /var/www/clics

npm ci
cp .env.production.example .env.production
nano .env.production

npm run build
npx prisma migrate deploy

pm2 start npm --name clics -- start
pm2 save
pm2 startup
```

Se o banco Supabase ja tiver as tabelas criadas por outro ambiente, rode `npx prisma migrate status` antes de `migrate deploy`.

## Nginx

Crie `/etc/nginx/sites-available/clics`:

```nginx
server {
    listen 80;
    server_name seudominio.com.br www.seudominio.com.br;

    client_max_body_size 40m;
    proxy_read_timeout 120s;
    proxy_send_timeout 120s;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }
}
```

Ative:

```bash
sudo ln -s /etc/nginx/sites-available/clics /etc/nginx/sites-enabled/clics
sudo nginx -t
sudo systemctl reload nginx
```

## HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seudominio.com.br -d www.seudominio.com.br
```

Depois atualize:

- `APP_URL=https://seudominio.com.br`
- URLs de callback/redirect no Supabase Auth, se estiverem configuradas.
- Webhook/notification URL no Mercado Pago, se estiver configurado no painel. O codigo tambem envia `APP_URL/api/webhooks/mercadopago` ao criar pagamentos.

Rode novamente:

```bash
npm run build
pm2 restart clics --update-env
```

## Atualizacao depois do primeiro deploy

```bash
cd /var/www/clics
git pull
npm ci
npm run build
npx prisma migrate deploy
pm2 restart clics --update-env
```

Para enviar vídeos, configure o CORS do bucket R2 para permitir `PUT` da origem da plataforma com o cabeçalho `Content-Type`. As prévias são geradas pelo FFmpeg no servidor, com o logo da Clics gravado nos primeiros 20 segundos. O arquivo original é enviado diretamente ao R2 e liberado por URL assinada após o pagamento.

## Verificacoes

```bash
pm2 status
pm2 logs clics
curl -I http://127.0.0.1:3000
curl -I https://seudominio.com.br
```

Fluxos para testar no navegador:

- Login/cadastro pelo Supabase.
- Criar album.
- Upload/processamento de foto.
- Album publico.
- Checkout PIX/cartao.
- Webhook do Mercado Pago atualizando pedido.
- Download de foto comprada.

## Pontos de atencao vistos no build local

- Sem `.env.production`, o build falha em paginas que criam cliente Supabase.
- Next 16 avisa que `middleware.ts` esta depreciado em favor de `proxy`.
- Next 16 ignora `export const config` dentro de route handlers. A rota `src/app/api/fotos/[id]/process/route.ts` ainda exporta esse objeto para `bodySizeLimit`; o limite real deve ser tratado no proxy e/ou por exports suportados.

