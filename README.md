# Första Kapitlet — Personal Book Tracker

A React application for managing your personal book library with an AI-powered recommendation assistant (Bibbi) and a self-hosted book database.

> Swedish version: [README.sv.md](./README.sv.md)

## 🚀 Features

- **Hybrid book database**: Searches own MySQL database first, falls back to Google Books API
- **AI assistant Bibbi**: Personalised book recommendations based on your preferences
- **In-chat preference management**: Interactive chips that steer recommendations
- **User authentication**: Registration, login, email verification, password reset
- **Book management**: Add, rate, and organise your books
- **Daily book tip**: Clickable cover linking to book detail (or search page if book is missing)
- **Passive data collection**: Database grows automatically as users search for books
- **URL search parameters**: Pre-fill the search field with `/books?q=`
- **Markdown in AI responses**: Rich replies with headings, lists, and links
- **Bilingual**: Swedish and English support
- **Performance**: Lazy loading for faster initial load

## 🏗️ Tech Stack

### Frontend
- React 19
- Vite
- TailwindCSS
- React Router

### Backend
- PHP 8+ (REST API)
- MySQL 8.0
- JWT authentication
- one.com hosting

### AI & External APIs
- Google Gemini 2.5 Flash (Bibbi)
- Google Books API (fallback)

## 📋 Prerequisites

### Local development
- Node.js 18+
- npm or yarn
- Docker Desktop (for local database and API)

### Production (one.com)
- one.com hosting account with:
  - MySQL database
  - PHP support
  - FTP/SFTP access
  - Mail service

## 🔧 Installation & Local Development

### 1. Clone the project
```bash
git clone <repository-url>
cd forsta_kapitlet
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_API_BASE_URL=http://localhost:8080
VITE_ENABLE_LOCAL_DB=true
```

### 4. Start Docker services
```bash
docker-compose up -d
```

This starts:
- **MySQL database** on port 3306
- **PHP API server** on port 8080
- **phpMyAdmin** on port 8081

### 5. Start React development server
```bash
npm run dev
```

### 6. Open the application
- **Frontend**: http://localhost:5173/
- **API**: http://localhost:8080
- **phpMyAdmin**: http://localhost:8081
  - Username: `root`
  - Password: `rootpassword`
- **Admin panel**: http://localhost:5173/admin
  - For user management and creating new accounts

**Note:** Local development uses the root URL (`/`). Production on one.com uses `/forsta-kapitlet/` as the base URL.

### Testing on mobile

The Vite server is configured to listen on all network interfaces. When you run `npm run dev` you get a Network URL (e.g. `http://192.168.1.123:5173/`) that you can open on your phone. Make sure both devices are on the same Wi-Fi network.

### Useful Docker commands

```bash
# Check container status
docker-compose ps

# Follow logs in real time
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and delete database data
docker-compose down -v

# Restart a specific service
docker-compose restart api
```

## 🚢 Deployment to one.com

### Quick start:
1. Create a MySQL database on one.com
2. Import `database/schema.sql` via phpMyAdmin
3. Configure `api/.env` with your database credentials
4. Upload the `api/` folder via FTP to `public_html/api/`
5. Build the React app: `npm run build`
6. Upload the contents of `dist/` to `public_html/`

## 📁 Project Structure

```
forsta_kapitlet/
├── api/                      # PHP REST API
│   ├── config.php            # Database configuration & utilities
│   ├── books/                # Book endpoints
│   │   ├── search.php
│   │   ├── create.php
│   │   └── get.php
│   └── auth/                 # Authentication
│       ├── register.php
│       ├── login.php
│       ├── verify.php
│       └── reset-password.php
├── database/
│   └── schema.sql            # MySQL schema
├── src/
│   ├── components/           # React components
│   ├── pages/                # Pages
│   ├── services/             # API clients
│   │   ├── api.js            # REST API client
│   │   ├── googleBooks.js    # Hybrid search
│   │   ├── gemini.js         # AI integration
│   │   └── storage.js        # LocalStorage
│   ├── context/              # React Context
│   └── locales/              # Translations (sv/en)
├── doc/                      # Documentation (Swedish)
└── README.md                 # This file
```

## 🔑 API Endpoints

### Books
- `GET /api/books/search.php?q=query` — Search books
- `POST /api/books/create.php` — Create book
- `GET /api/books/get.php?id=123` — Get book

### Authentication
- `POST /api/auth/register.php` — Register user
- `POST /api/auth/login.php` — Log in
- `GET /api/auth/verify.php?token=xxx` — Verify email
- `POST /api/auth/reset-password.php` — Reset password

## ⚠️ Email Verification (current behaviour)

- **Development**: accounts are auto-verified (`ENVIRONMENT=development`).
- **Production**: registration creates a token and sends a verification email; `/api/auth/verify.php` sets `verified_at`.
- **Login**: verification is **not enforced** (the check in `api/auth/login.php` is commented out).
- **Token expiry**: not yet implemented, even though the email mentions 24 hours.
- **Plan**: the verification requirement is intentionally deferred and can be enabled later as needed.

## 🛡️ Security

- **SQL Injection**: PDO prepared statements
- **XSS**: Input sanitization
- **Authentication**: JWT tokens with bcrypt-hashed passwords
- **HTTPS**: SSL certificate via Let's Encrypt
- **CORS**: Configurable per-environment headers

## 📊 Database Strategy

The project uses a hybrid strategy:

1. **Phase 1** (Current): Local database complements Google Books
   - Searches local database first
   - Falls back to Google Books API
   - Saves new books automatically

2. **Phase 2** (Future): Expanded data collection
   - Multiple sources (Open Library, Libris)
   - AI-enriched metadata

3. **Phase 3** (Long-term): Self-sufficient database
   - Bulk import of open datasets
   - Community contributions

## 🧪 Testing

```bash
# Test API (after deployment)
curl https://yoursite.one.com/api/books/search.php?q=test

# Create a test book
curl -X POST https://yoursite.one.com/api/books/create.php \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","author":"Test Author"}'
```

## 📝 Development

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run ESLint
```

## 🤝 Contributing

This is a personal project, but suggestions and feedback are welcome!

## 📄 License

MIT License — see [LICENSE](./LICENSE)

## 🙏 Acknowledgements

- Google Gemini for AI functionality
- Google Books API for book data
- one.com for hosting
- React & Vite communities

## 📞 Support

For questions or issues, open a GitHub issue.

---

**Made with ❤️ for book lovers**
