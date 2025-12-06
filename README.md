# Bokdatabas - Första Kapitlet

En React-applikation för att hantera din personliga boklista med AI-driven rekommendationsmotor (Bibbi) och egen bokdatabas.

## 🚀 Funktioner

- **Hybrid bokdatabas**: Använder egen MySQL-databas först, faller tillbaka till Google Books API
- **AI-assistent Bibbi**: Personliga bokrekommendationer baserat på dina preferenser
- **Användarautentisering**: Registrering, inloggning, email-verifiering, lösenordsåterställning
- **Bokhantering**: Lägg till, betygsätta, och organisera dina böcker
- **Passiv datainsamling**: Databasen växer automatiskt när användare söker efter böcker
- **Tvåspråkig**: Stöd för svenska och engelska

## 🏗️ Teknisk stack

### Frontend
- React 18
- Vite
- TailwindCSS
- React Router

### Backend
- PHP 8+ (REST API)
- MySQL 5.7+
- JWT-autentisering
- one.com hosting

### AI & Externa API:er
- Google Gemini 2.0 Flash (Bibbi)
- Google Books API (backup)

## 📋 Förutsättningar

- Node.js 18+
- npm eller yarn
- one.com hosting-konto med:
  - MySQL-databas
  - PHP-support
  - FTP/SFTP-åtkomst
  - Mail-tjänst

## 🔧 Installation

### 1. Klona projektet
```bash
git clone <repository-url>
cd forsta_kapitlet
```

### 2. Installera beroenden
```bash
npm install
```

### 3. Konfigurera miljövariabler
```bash
cp .env.example .env
```

Redigera `.env`:
```env
VITE_GEMINI_API_KEY=din_gemini_api_key
VITE_API_BASE_URL=https://dinsite.one.com/api
VITE_ENABLE_LOCAL_DB=true
```

### 4. Starta utvecklingsserver
```bash
npm run dev
```

Öppna http://localhost:5173

## 🚢 Deployment till one.com

Se detaljerad guide i [DEPLOYMENT.md](./DEPLOYMENT.md)

### Snabbstart:
1. Skapa MySQL-databas på one.com
2. Importera `database/schema.sql` via phpMyAdmin
3. Konfigurera `api/.env` med databasuppgifter
4. Ladda upp `api/`-mappen via FTP till `public_html/api/`
5. Bygg React-appen: `npm run build`
6. Ladda upp innehållet i `dist/` till `public_html/`

## 📁 Projektstruktur

```
forsta_kapitlet/
├── api/                      # PHP REST API
│   ├── config.php           # Databaskonfiguration & utilities
│   ├── books/               # Bok-endpoints
│   │   ├── search.php
│   │   ├── create.php
│   │   └── get.php
│   └── auth/                # Autentisering
│       ├── register.php
│       ├── login.php
│       ├── verify.php
│       └── reset-password.php
├── database/
│   └── schema.sql           # MySQL-schema
├── src/
│   ├── components/          # React-komponenter
│   ├── pages/               # Sidor
│   ├── services/            # API-klienter
│   │   ├── api.js          # one.com API-klient
│   │   ├── googleBooks.js  # Hybrid-sökning
│   │   ├── gemini.js       # AI-integration
│   │   └── storage.js      # LocalStorage
│   ├── context/            # React Context
│   └── locales/            # Översättningar
├── doc/                     # Dokumentation
│   ├── databas_strategi.md # Långsiktig strategi
│   └── prisbild.md         # Kostnadsanalys
├── DEPLOYMENT.md           # Deployment-guide
└── README.md              # Denna fil
```

## 🔑 API-endpoints

### Böcker
- `GET /api/books/search.php?q=query` - Sök böcker
- `POST /api/books/create.php` - Skapa bok
- `GET /api/books/get.php?id=123` - Hämta bok

### Autentisering
- `POST /api/auth/register.php` - Registrera användare
- `POST /api/auth/login.php` - Logga in
- `GET /api/auth/verify.php?token=xxx` - Verifiera email
- `POST /api/auth/reset-password.php` - Återställ lösenord

## 💰 Kostnad

- **Hosting (one.com)**: Redan betalt
- **MySQL-databas**: Inkluderad
- **PHP API**: Ingen extra kostnad
- **Mail-tjänst**: Gratis
- **Gemini API**: ~0,14 öre per meddelande

**Total extra kostnad: 0 kr/månad** ✅

## 📊 Databasstrategi

Projektet använder en hybrid-strategi:

1. **Fas 1** (Nuvarande): Lokal databas kompletterar Google Books
   - Söker i lokal databas först
   - Faller tillbaka till Google Books API
   - Sparar nya böcker automatiskt
   
2. **Fas 2** (Framtid): Utökad datainsamling
   - Flera datakällor (Open Library, Libris)
   - AI-berikad metadata
   
3. **Fas 3** (Långsiktig): Självständig databas
   - Bulk-import av öppna dataset
   - Community-bidrag

Se [doc/databas_strategi.md](./doc/databas_strategi.md) för detaljer.

## 🛡️ Säkerhet

- **SQL Injection**: PDO prepared statements
- **XSS**: Input sanitization
- **Autentisering**: JWT-tokens med bcrypt-hashade lösenord
- **HTTPS**: SSL-certifikat via Let's Encrypt
- **CORS**: Konfigurerbara headers

## 🧪 Testning

```bash
# Testa API (efter deployment)
curl https://dinsite.one.com/api/books/search.php?q=test

# Skapa testbok
curl -X POST https://dinsite.one.com/api/books/create.php \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","author":"Test Author"}'
```

## 📝 Utveckling

### Kör lokalt
```bash
npm run dev
```

### Bygg för produktion
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## 🤝 Bidra

Detta är ett personligt projekt, men förslag och feedback är välkomna!

## 📄 Licens

Privat projekt

## 🙏 Tack till

- Google Gemini för AI-funktionalitet
- Google Books API för bokdata
- one.com för hosting
- React & Vite communities

## 📞 Support

För frågor eller problem, se [DEPLOYMENT.md](./DEPLOYMENT.md) för felsökning.

---

**Skapad med ❤️ för bokälskare**
