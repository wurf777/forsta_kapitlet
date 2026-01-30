# Deployment Guide: one.com Bokdatabas

Denna guide hjälper dig att deploya bokdatabasen till one.com steg för steg.

## Förberedelser

### Vad du behöver:
- [ ] one.com kontoinloggning
- [ ] FTP/SFTP-uppgifter (finns i one.com kontrollpanel)
- [ ] MySQL-databas skapad på one.com
- [ ] En FTP-klient (t.ex. FileZilla) eller VS Code med SFTP-plugin

## Steg 1: Skapa MySQL-databas

1. **Logga in på one.com**
   - Gå till https://www.one.com/admin/
   - Logga in med dina uppgifter

2. **Skapa databas**
   - Klicka på "Databaser" i menyn
   - Klicka på "MySQL"
   - Klicka "Skapa ny databas"
   - Välj ett namn (t.ex. `forsta_kapitlet_db`)
   - Notera:
     - **Databasnamn**: `forsta_kapitlet_db`
     - **Användarnamn**: (genereras automatiskt)
     - **Lösenord**: (genereras automatiskt)
     - **Server**: `localhost` (vanligtvis)

3. **Öppna phpMyAdmin**
   - Klicka på "phpMyAdmin" bredvid din databas
   - Logga in med databasuppgifterna

4. **Importera schema**
   - Klicka på "Import" i toppmenyn
   - Välj filen `database/schema.sql` från ditt projekt
   - Klicka "Go"
   - Verifiera att alla tabeller skapades:
     - `books`
     - `authors`
     - `book_authors`
     - `genres`
     - `book_genres`
     - `users`
     - `user_books`
     - `user_profiles`
     - `data_sources`

## Steg 2: Konfigurera PHP API

1. **Skapa .env-fil**
   ```bash
   cd api
   cp .env.example .env
   ```

2. **Redigera api/.env**
   Öppna `api/.env` och uppdatera med dina uppgifter:
   ```env
   DB_HOST=localhost
   DB_NAME=forsta_kapitlet_db
   DB_USER=ditt_databas_användarnamn
   DB_PASS=ditt_databas_lösenord
   
   # Generera en lång slumpmässig sträng för JWT_SECRET
   # Du kan använda: https://randomkeygen.com/
   JWT_SECRET=din_mycket_långa_slumpmässiga_sträng_här_minst_32_tecken
   
   MAIL_FROM=noreply@dinsite.one.com
   SITE_URL=https://dinsite.one.com
   ```

3. **Viktigt om JWT_SECRET:**
   - Måste vara minst 32 tecken lång
   - Använd en slumpmässig generator
   - Ändra ALDRIG denna efter att användare börjat logga in (invaliderar alla tokens)

## Steg 3: Ladda upp API till one.com

### Alternativ A: Via FileZilla (Rekommenderat)

1. **Installera FileZilla**
   - Ladda ner från https://filezilla-project.org/

2. **Anslut till one.com**
   - Host: `ftp.dinsite.one.com` (eller enligt one.com)
   - Användarnamn: ditt FTP-användarnamn
   - Lösenord: ditt FTP-lösenord
   - Port: 21 (eller 22 för SFTP)

3. **Ladda upp filer**
   - Navigera till `public_html/` på servern
   - Skapa mappen `api/` om den inte finns
   - Ladda upp hela innehållet från din lokala `api/`-mapp:
     ```
     api/
     ├── .env
     ├── config.php
     ├── books/
     │   ├── search.php
     │   ├── create.php
     │   └── get.php
     └── auth/
         ├── register.php
         ├── login.php
         ├── verify.php
         └── reset-password.php
     ```

4. **Sätt rättigheter**
   - Högerklicka på `api/.env`
   - Välj "File permissions"
   - Sätt till `644` (rw-r--r--)

### Alternativ B: Via VS Code SFTP

1. **Installera SFTP-plugin**
   - Öppna Extensions (Ctrl+Shift+X)
   - Sök efter "SFTP" av Natizyskunk
   - Installera

2. **Konfigurera SFTP**
   - Tryck Ctrl+Shift+P
   - Skriv "SFTP: Config"
   - Uppdatera `.vscode/sftp.json`:
   ```json
   {
     "name": "one.com",
     "host": "ftp.dinsite.one.com",
     "protocol": "ftp",
     "port": 21,
     "username": "ditt_ftp_användarnamn",
     "password": "ditt_ftp_lösenord",
     "remotePath": "/public_html/api",
     "uploadOnSave": false
   }
   ```

3. **Ladda upp**
   - Högerklicka på `api/`-mappen
   - Välj "SFTP: Upload Folder"

## Steg 4: Testa API

### Test 1: Grundläggande anslutning
```bash
# Testa att API:et svarar
curl https://dinsite.one.com/api/books/search.php?q=test
```

**Förväntat svar:** `[]` (tom array - inga böcker än)

### Test 2: Skapa en testbok
```bash
curl -X POST https://dinsite.one.com/api/books/create.php \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Bok",
    "author": "Test Författare",
    "isbn": "9781234567890",
    "synopsis": "En testbok för att verifiera att API:et fungerar"
  }'
```

**Förväntat svar:**
```json
{
  "success": true,
  "book": {
    "id": 1,
    "title": "Test Bok",
    "author": "Test Författare"
  }
}
```

### Test 3: Sök efter testboken
```bash
curl https://dinsite.one.com/api/books/search.php?q=test
```

**Förväntat svar:** Array med testboken

### Test 4: Registrera testanvändare
```bash
curl -X POST https://dinsite.one.com/api/auth/register.php \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "name": "Test User"
  }'
```

**Förväntat svar:**
```json
{
  "success": true,
  "message": "Registration successful! Please check your email to verify your account.",
  "userId": 1
}
```

## Steg 5: Konfigurera React-appen

1. **Uppdatera .env**
   Öppna `.env` i ditt React-projekt:
   ```env
   VITE_GEMINI_API_KEY=din_gemini_api_key
   
   # one.com API
   VITE_API_BASE_URL=https://dinsite.one.com/api
   VITE_ENABLE_LOCAL_DB=true
   ```

2. **Testa lokalt**
   ```bash
   npm run dev
   ```
   - Öppna http://localhost:5173
   - Sök efter en bok
   - Kontrollera i browser console att den söker i lokal databas först

## Steg 6: Deploya React-appen

### Bygg produktionsversion
```bash
npm run build
```

### Ladda upp till one.com
1. **Via FileZilla/SFTP:**
   - Ladda upp innehållet i `dist/`-mappen till `public_html/`
   - **OBS:** Ladda upp INNEHÅLLET i dist, inte själva dist-mappen

2. **Struktur på servern:**
   ```
   public_html/
   ├── index.html
   ├── assets/
   │   ├── index-[hash].js
   │   └── index-[hash].css
   └── api/
       └── (dina PHP-filer)
   ```

## Felsökning

### Problem: "Database connection failed"
- **Lösning:** Kontrollera `api/.env` - är databasuppgifterna korrekta?
- Testa anslutning via phpMyAdmin

### Problem: "CORS error"
- **Lösning:** Kontrollera att `config.php` har rätt CORS-headers
- Ändra `Access-Control-Allow-Origin: *` till din domän i produktion

### Problem: "500 Internal Server Error"
- **Lösning:** Aktivera error logging
- Lägg till i `api/config.php`:
  ```php
  ini_set('display_errors', 1);
  error_reporting(E_ALL);
  ```
- Kontrollera one.com's error logs i kontrollpanelen

### Problem: Mail skickas inte
- **Lösning:** Kontrollera att `MAIL_FROM` använder din one.com-domän
- Testa med one.com's mail-funktion i kontrollpanelen

### Problem: "File not found" för API
- **Lösning:** Kontrollera att filerna ligger i rätt mapp
- URL ska vara: `https://dinsite.one.com/api/books/search.php`
- Inte: `https://dinsite.one.com/books/search.php`

## Verifiering

### Checklista för lyckad deployment:
- [ ] MySQL-databas skapad och schema importerat
- [ ] API-filer uppladdade till `public_html/api/`
- [ ] `.env` konfigurerad med korrekta uppgifter
- [ ] API svarar på `https://dinsite.one.com/api/books/search.php?q=test`
- [ ] Kan skapa böcker via API
- [ ] Kan registrera användare
- [ ] React-app byggd och uppladdad
- [ ] React-app kan kommunicera med API
- [ ] Hybrid-sökning fungerar (lokal DB först, sedan Google Books)

## Nästa steg efter deployment

1. **Övervaka datainsamling**
   - Sök efter böcker i appen
   - Kontrollera att de sparas i databasen via phpMyAdmin

2. **Säkerhet**
   - Ändra `Access-Control-Allow-Origin` från `*` till din domän
   - Implementera rate limiting
   - Sätt upp HTTPS (one.com erbjuder Let's Encrypt gratis)

3. **Optimering**
   - Aktivera PHP OPcache
   - Övervaka prestanda
   - Lägg till error logging

Grattis! Din bokdatabas är nu live! 🎉
