# Bokdatabas - Första Kapitlet

En React-applikation för att hantera din personliga boklista med AI-driven rekommendationsmotor (Bibbi) och egen bokdatabas.

## 🚀 Funktioner

- **Hybrid bokdatabas**: Använder egen MySQL-databas först, faller tillbaka till Google Books API
- **AI-assistent Bibbi**: Personliga bokrekommendationer baserat på dina preferenser
- **Preferenshantering i chatten**: Interaktiva chips som styr rekommendationer
- **Användarautentisering**: Registrering, inloggning, email-verifiering, lösenordsåterställning
- **Bokhantering**: Lägg till, betygsätta, och organisera dina böcker
- **Dagens boktips**: Klickbart omslag med länk till bokdetalj (eller söksida om boken saknas)
- **Passiv datainsamling**: Databasen växer automatiskt när användare söker efter böcker
- **Sökparametrar via URL**: Förifyll sökfältet med `/books?q=`
- **Markdown-stöd i AI-svar**: Rika svar med rubriker, listor och länkar
- **Tvåspråkig**: Stöd för svenska och engelska
- **Prestanda**: Lazy loading för snabbare initial laddning

## 🏗️ Teknisk stack

### Frontend
- React 19
- Vite
- TailwindCSS
- React Router

### Backend
- PHP 8+ (REST API)
- MySQL 8.0
- JWT-autentisering
- one.com hosting

### AI & Externa API:er
- Google Gemini 2.5 Flash (Bibbi)
- Google Books API (backup)

## 📋 Förutsättningar

### Lokal utveckling
- Node.js 18+
- npm eller yarn
- Docker Desktop (för lokal databas och API)

### Produktion (one.com)
- one.com hosting-konto med:
  - MySQL-databas
  - PHP-support
  - FTP/SFTP-åtkomst
  - Mail-tjänst

## 🔧 Installation & Lokal utveckling

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
VITE_API_BASE_URL=http://localhost:8080
VITE_ENABLE_LOCAL_DB=true
```

### 4. Starta Docker-tjänsterna
```bash
docker-compose up -d
```

Detta startar:
- **MySQL-databas** på port 3306
- **PHP API-server** på port 8080
- **phpMyAdmin** på port 8081

### 5. Starta React utvecklingsserver
```bash
npm run dev
```

### 6. Öppna applikationen
- **Frontend**: http://localhost:5173/
- **API**: http://localhost:8080
- **phpMyAdmin**: http://localhost:8081
  - Användarnamn: `root`
  - Lösenord: `rootpassword`
- **Admin panel**: http://localhost:5173/admin
  - För användarhantering och att skapa nya konton

**OBS:** I lokal utveckling används rot-URL (`/`). I produktion på one.com används `/forsta-kapitlet/` som base-URL.

### Testa från mobil

Vite-servern är konfigurerad att lyssna på alla nätverksgränssnitt. När du kör `npm run dev` får du en Network-URL (t.ex. `http://192.168.1.123:5173/`) som du kan använda från din mobil. Se till att mobilen och datorn är på samma WiFi-nätverk.

### Användbara Docker-kommandon

```bash
# Se status på containers
docker-compose ps

# Se loggar (följ i realtid)
docker-compose logs -f

# Stoppa alla tjänster
docker-compose down

# Stoppa och radera databas-data
docker-compose down -v

# Starta om en specifik tjänst
docker-compose restart api
```

## 🚢 Deployment till one.com

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

## ⚠️ Verifiering (nuvarande beteende)

- **Utveckling**: konton auto‑verifieras (`ENVIRONMENT=development`).
- **Produktion**: registrering skapar token och skickar verifieringsmejl; `/api/auth/verify.php` sätter `verified_at`.
- **Inloggning**: verifiering **enforcas inte** (kontrollen i `api/auth/login.php` är kommenterad).
- **Token‑expiry**: finns inte implementerad, även om mejlet nämner 24 timmar.
- **Plan**: verifieringskravet är medvetet uppskjutet och kan aktiveras/utökas senare vid behov.

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

MIT License — se [LICENSE](./LICENSE)

## 🙏 Tack till

- Google Gemini för AI-funktionalitet
- Google Books API för bokdata
- one.com för hosting
- React & Vite communities

## 📞 Support

För frågor eller problem, öppna ett issue på GitHub.

---

**Skapad med ❤️ för bokälskare**
