# 🚀 Deployment Guide - Nightscout API Backend

This guide covers various deployment options for the Nightscout API Backend.

## 🐳 Docker Deployment (Recommended)

### Prerequisites
- Docker and Docker Compose installed
- Domain name (optional, but recommended for production)

### Quick Start with Docker Compose

1. **Clone and configure:**
```bash
git clone <repository-url>
cd nightscout-api-backend
cp .env.example .env
```

2. **Edit environment variables:**
```bash
# Edit .env file with your settings
nano .env
```

3. **Start services:**
```bash
docker-compose up -d
```

4. **Access the application:**
- Dashboard: `http://localhost:3000`
- API: `http://localhost:3000/api/v1`
- Database Admin: `http://localhost:8080`

### Production Docker Setup

1. **Create production docker-compose.yml:**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_NAME=nightscout_api
      - DB_USER=postgres
      - DB_PASSWORD=${DB_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - BASE_URL=https://your-domain.com
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=nightscout_api
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

2. **Create nginx.conf:**
```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## ☁️ Cloud Platform Deployments

### Fly.io Deployment

1. **Install Fly CLI:**
```bash
curl -L https://fly.io/install.sh | sh
```

2. **Login and create app:**
```bash
fly auth login
fly apps create your-app-name
```

3. **Create fly.toml:**
```toml
app = "your-app-name"
primary_region = "dfw"

[build]

[env]
  NODE_ENV = "production"
  PORT = "3000"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1

[[services]]
  protocol = "tcp"
  internal_port = 3000

  [[services.ports]]
    port = 80
    handlers = ["http"]
    force_https = true

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

[checks]
  [checks.health]
    grace_period = "10s"
    interval = "30s"
    method = "GET"
    path = "/api/v1/status"
    port = 3000
    timeout = "5s"
```

4. **Add PostgreSQL:**
```bash
fly postgres create --name your-app-db
fly postgres attach --app your-app-name your-app-db
```

5. **Set secrets:**
```bash
fly secrets set JWT_SECRET=$(openssl rand -base64 32)
fly secrets set BASE_URL=https://your-app-name.fly.dev
```

6. **Deploy:**
```bash
fly deploy
```

### Heroku Deployment

1. **Create Heroku app:**
```bash
heroku create your-app-name
```

2. **Add PostgreSQL addon:**
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

3. **Set environment variables:**
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set BASE_URL=https://your-app-name.herokuapp.com
```

4. **Create Procfile:**
```
web: npm start
```

5. **Deploy:**
```bash
git push heroku main
```

### Railway Deployment

1. **Connect GitHub repository to Railway**
2. **Add PostgreSQL service**
3. **Set environment variables:**
   - `NODE_ENV=production`
   - `JWT_SECRET=<random-secret>`
   - `BASE_URL=https://your-app.railway.app`
4. **Deploy automatically on push**

### DigitalOcean App Platform

1. **Create app.yaml:**
```yaml
name: nightscout-api-backend
services:
- name: api
  source_dir: /
  github:
    repo: your-username/nightscout-api-backend
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  env:
  - key: NODE_ENV
    value: production
  - key: JWT_SECRET
    value: your-secret-here
  - key: BASE_URL
    value: https://your-app.ondigitalocean.app

databases:
- name: postgres
  engine: PG
  version: "13"
  size: db-s-dev-database
```

2. **Deploy via DigitalOcean dashboard**

## 🖥️ VPS/Server Deployment

### Ubuntu/Debian Server Setup

1. **Update system:**
```bash
sudo apt update && sudo apt upgrade -y
```

2. **Install Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Install PostgreSQL:**
```bash
sudo apt install postgresql postgresql-contrib
sudo -u postgres createuser --interactive
sudo -u postgres createdb nightscout_api
```

4. **Install PM2:**
```bash
sudo npm install -g pm2
```

5. **Clone and setup:**
```bash
git clone <repository-url>
cd nightscout-api-backend
npm install
cp .env.example .env
# Edit .env with your settings
```

6. **Start with PM2:**
```bash
pm2 start src/server.js --name nightscout-api
pm2 startup
pm2 save
```

7. **Setup Nginx reverse proxy:**
```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/nightscout-api
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

8. **Enable site and SSL:**
```bash
sudo ln -s /etc/nginx/sites-available/nightscout-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 🔒 Security Considerations

### Environment Variables
Always set these in production:
```bash
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
DB_PASSWORD=<strong-database-password>
BASE_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com
```

### Database Security
- Use strong passwords
- Enable SSL connections
- Regular backups
- Limit database access

### Application Security
- Keep dependencies updated
- Use HTTPS only
- Configure rate limiting
- Monitor logs

## 📊 Monitoring and Maintenance

### Health Monitoring
```bash
# Check application health
curl https://your-domain.com/api/v1/status

# Monitor with PM2
pm2 monit

# Check logs
pm2 logs nightscout-api
```

### Database Backup
```bash
# PostgreSQL backup
pg_dump nightscout_api > backup_$(date +%Y%m%d).sql

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump nightscout_api > $BACKUP_DIR/nightscout_api_$DATE.sql
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
```

### Updates
```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Restart application
pm2 restart nightscout-api
```

## 🔧 Troubleshooting

### Common Issues

1. **Database connection errors:**
   - Check PostgreSQL is running
   - Verify connection credentials
   - Check firewall settings

2. **Authentication issues:**
   - Verify JWT_SECRET is set
   - Check API secret generation
   - Validate token expiration

3. **CORS errors:**
   - Configure CORS_ORIGIN properly
   - Check request headers
   - Verify domain settings

### Logs and Debugging
```bash
# Application logs
pm2 logs nightscout-api

# Database logs
sudo tail -f /var/log/postgresql/postgresql-13-main.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 📞 Support

- Check `/api/v1/status` endpoint for system status
- Review `/api-docs` for API documentation
- Monitor application logs for errors
- Verify database connectivity
