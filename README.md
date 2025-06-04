# 🩸 Nightscout API Backend

Un serviciu backend centralizat, compatibil cu Nightscout, care permite utilizatorilor să acceseze datele lor de Monitorizare Continuă a Glicemiei (CGM) prin URL-uri unice și chei API. Acest serviciu emulează API-ul Nightscout, făcându-l compatibil cu aplicații populare de gestionare a diabetului precum xDrip+, Loop și Nightguard.

## ✨ Caracteristici

- **🔐 Suport Multi-Utilizator**: Fiecare utilizator primește propria cheie API securizată și date izolate
- **🔄 Compatibilitate API Nightscout**: Compatibilitate completă cu aplicațiile existente dependente de Nightscout
- **📊 Gestionarea Datelor CGM**: Stochează și recuperează înregistrări de glucoză, tratamente și starea dispozitivului
- **🌐 Tablou de Bord Web**: Interfață prietenoasă pentru gestionarea cheilor API și vizualizarea datelor
- **🔒 Metode Multiple de Autentificare**: Chei API, token-uri JWT și autentificare bazată pe URL
- **🐳 Pregătit pentru Docker**: Implementare ușoară cu Docker și Docker Compose
- **📈 Arhitectură Scalabilă**: Construit cu Node.js, Express și PostgreSQL

## 🚀 Început Rapid

### Prerequisites

- Node.js 18+ or Docker
- PostgreSQL 12+ (or use Docker Compose)

### Option 1: Docker Compose (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd nightscout-api-backend
```

2. Start the services:
```bash
docker-compose up -d
```

3. Access the dashboard at `http://localhost:3000`

### Option 2: Manual Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials and secrets
```

3. Set up PostgreSQL database and run migrations:
```bash
npm run migrate
```

4. Start the development server:
```bash
npm run dev
```

## 📱 App Configuration

### xDrip+ Setup

1. Go to **Settings** → **Cloud Upload** → **Nightscout Sync (REST-API)**
2. Enable **"Nightscout Sync (REST-API)"**
3. Set **Base URL** to: `https://your-domain.com/api/v1`
4. Set **API Secret** to your generated secret from the dashboard

### Loop Setup

1. Go to **Settings** → **Services** → **Nightscout**
2. Set **Site URL** to: `https://your-domain.com`
3. Set **API Secret** to your generated secret from the dashboard

### Nightguard Setup

1. Add a new Nightscout site
2. Set **URL** to: `https://your-domain.com`
3. Set **API Secret** to your generated secret from the dashboard

## 🔌 API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get user profile
- `POST /auth/regenerate-secret` - Regenerate API secret

### Nightscout-Compatible Endpoints
- `GET /api/v1/entries[.json]` - Get CGM entries
- `POST /api/v1/entries[.json]` - Upload CGM entries
- `GET /api/v1/treatments[.json]` - Get treatments
- `POST /api/v1/treatments[.json]` - Upload treatments
- `GET /api/v1/status[.json]` - Get server status
- `GET /api/v1/profile[.json]` - Get treatment profile

### Authentication Methods

1. **API Secret Header**:
```bash
curl -H "api-secret: your_api_secret_here" https://your-domain.com/api/v1/entries
```

2. **JWT Bearer Token**:
```bash
curl -H "Authorization: Bearer your_jwt_token" https://your-domain.com/api/v1/entries
```

3. **Token Query Parameter**:
```bash
curl "https://your-domain.com/api/v1/entries?token=your_api_secret_or_jwt"
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `nightscout_api` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | - |
| `JWT_SECRET` | JWT signing secret | - |
| `BASE_URL` | Base URL for the service | `http://localhost:3000` |

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CGM Apps      │    │   Web Dashboard │    │   API Clients   │
│  (xDrip+, Loop)│    │                 │    │                 │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼───────────────┐
                    │     Express.js Server       │
                    │   (Nightscout API Layer)    │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │      PostgreSQL DB          │
                    │   (User Data & CGM Data)    │
                    └─────────────────────────────┘
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **API Secret Hashing**: SHA-256 hashed storage
- **JWT Tokens**: Secure token-based authentication
- **Rate Limiting**: Configurable request rate limiting
- **CORS Protection**: Configurable CORS policies
- **Helmet.js**: Security headers and protections

## 🚀 Deployment

### Fly.io Deployment

1. Install Fly CLI and login
2. Create a new app:
```bash
fly apps create your-app-name
```

3. Set environment variables:
```bash
fly secrets set JWT_SECRET=your_secret_here
fly secrets set DB_PASSWORD=your_db_password
```

4. Deploy:
```bash
fly deploy
```

### Heroku Deployment

1. Create a new Heroku app
2. Add PostgreSQL addon:
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

3. Set environment variables and deploy

## 🧪 Testing

Run the test suite:
```bash
npm test
```

## 📊 Monitoring

- Status endpoint: `/api/v1/status`
- API documentation: `/api-docs`
- Database admin (development): `http://localhost:8080` (Adminer)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- Create an issue for bug reports
- Check the API documentation at `/api-docs`
- Review the status endpoint at `/api/v1/status`

## 🙏 Acknowledgments

- Nightscout community for the original API specification
- xDrip+ and Loop communities for testing and feedback
