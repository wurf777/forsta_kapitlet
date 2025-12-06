# Strategi för egen bokdatabas

## Översikt
Detta dokument beskriver en stegvis plan för att bygga upp en egen bokdatabas som komplement till (och eventuellt ersättning för) Google Books API, med **one.com** som hosting-plattform.

## Varför en egen databas?

### Fördelar
- **Kontroll**: Full kontroll över data och tillgänglighet
- **Kostnadseffektivitet**: Ingen beroende av externa API-begränsningar
- **Anpassning**: Kan lägga till egna fält och metadata
- **Prestanda**: Snabbare svar utan externa API-anrop
- **Tillförlitlighet**: Ingen risk för API-nedgångar eller ändringar
- **Rikedom**: Kan kombinera data från flera källor
- **Gratis mail**: Inbyggd mail-funktion för autentisering

### Utmaningar
- **Initial datainsamling**: Behöver bygga upp en omfattande katalog
- **Underhåll**: Måste hålla data uppdaterad
- **Backend-utveckling**: Måste bygga eget REST API
- **Säkerhet**: Måste hantera autentisering och säkerhet själv

## Fas 1: Hybrid-lösning (Komplement till Google Books)

### Mål
Börja samla in och lagra bokdata lokalt samtidigt som vi fortsätter använda Google Books API som backup.

### Arkitektur

#### 1.1 Plattformsval
**Vald lösning: one.com** (MySQL + PHP + Mail)

**Fördelar med one.com:**
- ✅ **Redan betalt** - ingen extra kostnad
- ✅ **MySQL-databas** - robust och välbeprövad
- ✅ **PHP-support** - enkelt att bygga REST API
- ✅ **Gratis mail** - perfekt för autentisering
- ✅ **Full kontroll** - äger infrastrukturen
- ✅ **Ingen vendor lock-in** - standard teknologi

**Jämfört med alternativ:**
- **Supabase**: Snabbare att komma igång, men kostar pengar och vendor lock-in
- **Firebase**: Bra för realtid, men dyrare och mer begränsat
- **MongoDB Atlas**: NoSQL, men mer komplext för relationell data

#### 1.2 Databasschema

Se `database/schema.sql` för komplett MySQL-schema med:
- `books` - huvudtabell för bokdata
- `users` - användarhantering med email-verifiering
- `user_books` - användarnas boklistor
- `authors` - normaliserad författartabell
- `genres` - kategorier/genrer
- Full-text search index för svenska
- Relationer och foreign keys

#### 1.3 Implementeringssteg

**Steg 1: Skapa MySQL-databas på one.com**
1. Logga in på one.com kontrollpanel
2. Gå till "Databaser" → "MySQL"
3. Skapa ny databas
4. Notera databasnamn, användarnamn och lösenord
5. Kör `database/schema.sql` via phpMyAdmin eller MySQL-klient

**Steg 2: Konfigurera PHP API**
```bash
# Skapa .env-fil baserad på .env.example
cd api
cp .env.example .env

# Redigera .env med dina uppgifter:
# DB_HOST=localhost
# DB_NAME=din_databas
# DB_USER=ditt_användarnamn
# DB_PASS=ditt_lösenord
# JWT_SECRET=generera-en-lång-slumpmässig-sträng
# MAIL_FROM=noreply@dinsite.one.com
# SITE_URL=https://dinsite.one.com
```

**Steg 3: Ladda upp API till one.com**
```bash
# Via FTP/SFTP, ladda upp hela api/-mappen till:
# public_html/api/

# Struktur på servern:
# public_html/
# ├── api/
# │   ├── config.php
# │   ├── .env
# │   ├── books/
# │   │   ├── search.php
# │   │   ├── create.php
# │   │   └── get.php
# │   └── auth/
# │       ├── register.php
# │       ├── login.php
# │       ├── verify.php
# │       └── reset-password.php
```

**Steg 4: Konfigurera React-appen**
```bash
# Uppdatera .env i React-projektet
VITE_API_BASE_URL=https://dinsite.one.com/api
VITE_ENABLE_LOCAL_DB=true
```

**Steg 5: Testa API**
```bash
# Testa sökning (ska returnera tom array först)
curl https://dinsite.one.com/api/books/search.php?q=test

# Testa att skapa en bok
curl -X POST https://dinsite.one.com/api/books/create.php \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Bok","author":"Test Författare"}'
```

### 1.4 Automatisk datainsamling

**Strategi: Passiv insamling**
- Varje gång en användare söker efter en bok via Google Books API, sparas den automatiskt till din databas
- Över tid byggs databasen upp organiskt baserat på vad användare faktiskt söker efter
- Ingen manuell import behövs initialt

**Hur det fungerar:**
1. Användare söker efter "svenska deckare"
2. `googleBooks.js` söker först i lokal databas (tom första gången)
3. Faller tillbaka till Google Books API
4. Sparar alla resultat till lokal databas i bakgrunden
5. Nästa gång någon söker liknande, hittas böcker lokalt = snabbare!

**Förväntad tillväxt:**
- Vecka 1: ~100-200 böcker
- Månad 1: ~500-1000 böcker
- Månad 3: ~2000-5000 böcker
- Efter 6 månader: Majoriteten av sökningar hittar i lokal databas


## Fas 2: Utökad datainsamling

### 2.1 Flera datakällor

**Open Library API** (gratis, omfattande)
```javascript
// src/services/openLibrary.js
export const searchOpenLibrary = async (isbn) => {
    const response = await fetch(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
    )
    const data = await response.json()
    return data[`ISBN:${isbn}`]
}
```

**KB (Kungliga Biblioteket) API** (svenska böcker)
```javascript
// src/services/libris.js
export const searchLibris = async (query) => {
    // Libris SRU API
    const response = await fetch(
        `http://libris.kb.se/xsearch?query=${encodeURIComponent(query)}&format=json`
    )
    return await response.json()
}
```

**Bokus/Adlibris scraping** (med försiktighet)
- Använd endast för att komplettera data
- Respektera robots.txt
- Implementera rate limiting

### 2.2 AI-berikad metadata

```javascript
// src/services/bookEnrichment.js
import { generateContent } from './gemini'

export const enrichBookWithAI = async (book) => {
    const prompt = `
Analysera följande bok och ge mig:
1. Vibe (3-5 ord som beskriver känslan)
2. Tempo (långsam/medel/snabb)
3. Teman (3-5 huvudteman)
4. En kort sammanfattning (2-3 meningar)

Bok:
Titel: ${book.title}
Författare: ${book.author}
Beskrivning: ${book.synopsis}
Kategorier: ${book.categories.join(', ')}

Svara i JSON-format:
{
    "vibe": "...",
    "tempo": "...",
    "themes": ["...", "..."],
    "summary": "..."
}
`
    
    const result = await generateContent(prompt)
    const enrichedData = JSON.parse(result)
    
    // Spara till databasen
    await supabase
        .from('books')
        .update({
            ai_vibe: enrichedData.vibe,
            ai_tempo: enrichedData.tempo,
            ai_themes: enrichedData.themes,
            ai_summary: enrichedData.summary
        })
        .eq('id', book.id)
    
    return enrichedData
}
```

## Fas 3: Självständig databas

### 3.1 Omfattande dataimport

**Bulk-import från öppna dataset:**
- **Libris öppna data**: Sveriges nationalbibliotek
- **Open Library Dumps**: Miljontals böcker
- **Goodreads datasets**: (om tillgängliga)

```javascript
// scripts/bulkImport.js
import fs from 'fs'
import { supabase } from '../src/services/database'

export const importFromLibrisDump = async (filePath) => {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    
    const batchSize = 100
    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize)
        
        await supabase
            .from('books')
            .upsert(batch.map(transformLibrisData))
        
        console.log(`Imported ${i + batchSize} / ${data.length}`)
    }
}
```

### 3.2 Community-bidrag

**Låt användare bidra:**
- Rapportera saknade böcker
- Föreslå korrigeringar
- Lägga till recensioner och betyg
- Ladda upp bättre omslagsbilder

```sql
-- Användarinlämningar
CREATE TABLE book_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- Om du har autentisering
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    isbn TEXT,
    additional_data JSONB,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.3 Bildlagring

**Strategi för omslagsbilder:**

**Alternativ 1: Supabase Storage**
```javascript
export const uploadCoverImage = async (file, bookId) => {
    const { data, error } = await supabase.storage
        .from('book-covers')
        .upload(`${bookId}.jpg`, file)
    
    return data?.path
}
```

**Alternativ 2: Cloudinary** (gratis tier: 25 GB)
- Automatisk bildoptimering
- CDN-leverans
- Transformationer on-the-fly

**Alternativ 3: Fortsätt länka externa bilder**
- Billigast
- Risk för brutna länkar
- Kan cacha lokalt över tid

## Kostnadsanalys

### Fas 1 (Hybrid - one.com)
- **one.com hosting**: Redan betalt
- **MySQL-databas**: Inkluderad i hosting
- **PHP API**: Ingen extra kostnad
- **Mail-tjänst**: Gratis med hosting
- **Total extra kostnad**: **0 kr/månad** ✅

**Kapacitet:**
- Databas: Beror på hosting-plan (vanligtvis 1-5 GB)
- ~100,000-500,000 böcker med metadata
- Bandbredd: Enligt hosting-plan

### Fas 2 (Utökad - med bildlagring)
- **one.com hosting**: Redan betalt
- **Cloudinary Free tier**: 0 kr (25 GB lagring, 25 GB bandbredd)
- **Total**: **0 kr/månad** ✅

**Om Cloudinary free tier inte räcker:**
- **Cloudinary Pro**: ~300 kr/månad

### Fas 3 (Självständig - stor skala)
- **one.com hosting**: Redan betalt
- **Cloudinary Pro**: ~300 kr/månad (om många bilder)
- **Eventuell VPS för scraping**: ~50-100 kr/månad (valfritt)
- **Total**: **0-400 kr/månad**

**Jämförelse med Supabase:**
- Supabase Free: 0 kr men begränsad (500 MB databas)
- Supabase Pro: ~200 kr/månad
- **one.com**: 0 kr extra (redan betalt) 🎉


## Implementeringsplan

### Fas 1: Setup och grundläggande hybrid (Klart! ✅)
- [x] Skapa databasschema för MySQL
- [x] Designa PHP REST API
- [x] Implementera autentisering med JWT
- [x] Skapa React API-klient
- [x] Implementera hybrid-sökning

### Nästa steg: Deployment (1-2 timmar)
- [ ] Skapa MySQL-databas på one.com
- [ ] Ladda upp PHP API via FTP/SFTP
- [ ] Konfigurera .env-filer
- [ ] Testa API-endpoints
- [ ] Uppdatera React .env med API-URL
- [ ] Deploya React-app till one.com

### Vecka 2-3: Passiv datainsamling
- [ ] Övervaka databasinsamling
- [ ] Lägga till admin-vy för databasstatistik
- [ ] Optimera sökprestanda
- [ ] Implementera error logging

### Månad 2: AI-berikad metadata
- [ ] Implementera bookEnrichment.js
- [ ] Berika befintliga böcker i bakgrunden
- [ ] Lägga till AI-metadata i UI
- [ ] A/B-testa användarengagemang

### Månad 3: Flera datakällor
- [ ] Integrera Open Library
- [ ] Integrera Libris (KB)
- [ ] Implementera smart datakombination
- [ ] Förbättra datakvalitet

### Månad 4+: Skalning
- [ ] Bulk-import av öppna dataset
- [ ] Community-bidragssystem
- [ ] Bildoptimering och CDN
- [ ] Övervaka och optimera prestanda

## Tekniska överväganden

### Prestanda
- **Caching**: PHP OPcache för API, React Query för frontend
- **Indexering**: MySQL full-text search index
- **Lazy loading**: Ladda bilder progressivt
- **Pagination**: Begränsa antal resultat per sökning
- **CDN**: Använd one.com's CDN eller Cloudflare

### Datakvalitet
- **Validering**: PHP-validering i API
- **Deduplicering**: Undvik dubbletter baserat på ISBN/Google Books ID
- **Kvalitetspoäng**: Prioritera högkvalitativa källor
- **Manuell granskning**: Flagga låg kvalitet för granskning

### Säkerhet
- **SQL Injection**: Använd PDO prepared statements (redan implementerat)
- **XSS**: Sanitize all input (redan implementerat)
- **CSRF**: Implementera CSRF-tokens för state-changing operations
- **Rate Limiting**: Begränsa API-anrop per IP
- **HTTPS**: Använd SSL-certifikat (one.com erbjuder Let's Encrypt gratis)

### Juridik
- **Upphovsrätt**: Använd endast metadata, inte bokinnehåll
- **Bilder**: Använd endast omslagsbilder som är tillåtna
- **Attribution**: Ge credit till datakällor
- **Terms of Service**: Följ alla API-villkor
- **GDPR**: Hantera användardata enligt GDPR

## Sammanfattning

### Rekommenderad väg framåt:
1. **Deploya Fas 1** (hybrid-lösning) - alla filer är klara! ✅
2. **Samla data passivt** under 2-3 månader
3. **Utvärdera** datakvalitet och täckning
4. **Besluta** om Fas 2/3 baserat på resultat

### Framgångskriterier:
- **80% träffar** i lokal databas efter 3 månader
- **Snabbare sökningar** än ren Google Books
- **Bättre metadata** tack vare AI-berikande
- **Kostnad: 0 kr/månad** (redan betalt för hosting) 🎉

### Nästa steg för deployment:
1. **Skapa MySQL-databas** på one.com kontrollpanel
2. **Kör schema.sql** via phpMyAdmin
3. **Ladda upp api/-mappen** via FTP/SFTP
4. **Konfigurera .env** med databasuppgifter
5. **Testa API** med curl eller Postman
6. **Uppdatera React .env** med API-URL
7. **Bygga och deploya** React-appen

Vill du att jag hjälper dig med deployment-stegen?
