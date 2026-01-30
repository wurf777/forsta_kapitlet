# Docker Development Guide

Denna guide hjälper dig att köra bokdatabasen lokalt med Docker Desktop innan deployment till one.com.

## Förutsättningar

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installerat
- Docker Desktop igång

## Snabbstart

### 1. Starta Docker-miljön

```bash
# Kopiera Docker-specifika environment-filer
cp api/.env.docker api/.env
cp .env.docker .env

# Starta alla containers
docker-compose up -d
```

Detta startar:
- **MySQL-databas** på port 3306
- **PHP API** på http://localhost:8080
- **phpMyAdmin** på http://localhost:8081

### 2. Verifiera att allt fungerar

```bash
# Kontrollera att containers körs
docker-compose ps

# Förväntat output:
# NAME                          STATUS
# forsta_kapitlet_api           Up
# forsta_kapitlet_db            Up (healthy)
# forsta_kapitlet_phpmyadmin    Up
```

### 3. Testa API:et

```bash
# Testa sökning (ska returnera tom array)
curl http://localhost:8080/books/search.php?q=test

# Skapa en testbok
curl -X POST http://localhost:8080/books/create.php \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Test Bok\",\"author\":\"Test Författare\"}"

# Sök igen (ska nu hitta testboken)
curl http://localhost:8080/books/search.php?q=test
```

### 4. Starta React-appen

I en ny terminal:

```bash
# Starta React dev server
npm run dev
```

Öppna http://localhost:5173 och testa att söka efter böcker!

## Användbara kommandon

### Starta/Stoppa

```bash
# Starta alla services
docker-compose up -d

# Stoppa alla services
docker-compose down

# Stoppa och ta bort volumes (raderar databas!)
docker-compose down -v
```

### Loggar

```bash
# Visa loggar för alla services
docker-compose logs

# Följ loggar i realtid
docker-compose logs -f

# Visa loggar för specifik service
docker-compose logs api
docker-compose logs db
```

### Databas

```bash
# Anslut till MySQL via kommandorad
docker-compose exec db mysql -u forsta_user -pforsta_password forsta_kapitlet_db

# Importera schema manuellt (om behövs)
docker-compose exec db mysql -u forsta_user -pforsta_password forsta_kapitlet_db < database/schema.sql

# Backup av databas
docker-compose exec db mysqldump -u forsta_user -pforsta_password forsta_kapitlet_db > backup.sql

# Återställ från backup
docker-compose exec -T db mysql -u forsta_user -pforsta_password forsta_kapitlet_db < backup.sql
```

### PHP API

```bash
# Visa PHP-loggar
docker-compose logs api

# Starta om API (efter kodändringar)
docker-compose restart api

# Öppna shell i API-container
docker-compose exec api bash
```

## phpMyAdmin

Öppna http://localhost:8081 för att hantera databasen visuellt.

**Inloggning:**
- Server: `db`
- Användarnamn: `root`
- Lösenord: `rootpassword`

Här kan du:
- Se alla tabeller
- Köra SQL-queries
- Importera/exportera data
- Kontrollera index

## Testa autentisering

### Registrera användare

```bash
curl -X POST http://localhost:8080/auth/register.php \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"test@example.com\",
    \"password\": \"testpassword123\",
    \"name\": \"Test User\"
  }"
```

**OBS:** Email kommer inte skickas i Docker-miljön. Du kan verifiera användaren manuellt via phpMyAdmin:

```sql
UPDATE users SET verified_at = NOW() WHERE email = 'test@example.com';
```

### Logga in

```bash
curl -X POST http://localhost:8080/auth/login.php \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"test@example.com\",
    \"password\": \"testpassword123\"
  }"
```

Spara `token` från svaret för att använda i andra requests.

### Använd token

```bash
# Exempel: Hämta användarens böcker
curl http://localhost:8080/user/books.php \
  -H "Authorization: Bearer DIN_TOKEN_HÄR"
```

## Felsökning

### Problem: "Cannot connect to database"

**Lösning:**
```bash
# Kontrollera att db-container är healthy
docker-compose ps

# Om inte, kolla loggar
docker-compose logs db

# Starta om
docker-compose restart db
```

### Problem: "Port already in use"

**Lösning:**
```bash
# Ändra port i docker-compose.yml
# Exempel: ändra "8080:80" till "8090:80"

# Eller stoppa processen som använder porten
# Windows PowerShell:
netstat -ano | findstr :8080
taskkill /PID <process_id> /F
```

### Problem: "Schema not loaded"

**Lösning:**
```bash
# Importera schema manuellt
docker-compose exec db mysql -u forsta_user -pforsta_password forsta_kapitlet_db < database/schema.sql

# Verifiera att tabeller finns
docker-compose exec db mysql -u forsta_user -pforsta_password forsta_kapitlet_db -e "SHOW TABLES;"
```

### Problem: "PHP errors not showing"

**Lösning:**
```bash
# Kontrollera php.ini
docker-compose exec api cat /usr/local/etc/php/php.ini

# Visa PHP error log
docker-compose exec api tail -f /var/log/php_errors.log
```

### Problem: "CORS errors in browser"

**Lösning:**
Kontrollera att `api/config.php` har rätt CORS-headers:
```php
header('Access-Control-Allow-Origin: http://localhost:5173');
```

## Testscenario: Komplett flöde

### 1. Starta miljön
```bash
docker-compose up -d
npm run dev
```

### 2. Öppna appen
- Gå till http://localhost:5173

### 3. Sök efter en bok
- Sök efter "svenska deckare"
- Första gången: Hämtas från Google Books
- Andra gången: Hämtas från lokal databas (snabbare!)

### 4. Verifiera i phpMyAdmin
- Öppna http://localhost:8081
- Logga in (root/rootpassword)
- Välj `forsta_kapitlet_db`
- Klicka på `books`-tabellen
- Se att böckerna sparats!

### 5. Testa hybrid-sökning
```bash
# Sök efter något som finns i DB
curl http://localhost:8080/books/search.php?q=deckare

# Sök efter något nytt (hämtas från Google Books och sparas)
curl http://localhost:8080/books/search.php?q=fantasy

# Sök igen (nu från lokal DB)
curl http://localhost:8080/books/search.php?q=fantasy
```

## Prestanda-jämförelse

Testa skillnaden mellan lokal databas och Google Books:

```bash
# Lokal databas (efter första sökningen)
time curl http://localhost:8080/books/search.php?q=deckare
# Förväntat: ~50-100ms

# Google Books (första gången)
time curl "https://www.googleapis.com/books/v1/volumes?q=deckare&maxResults=10"
# Förväntat: ~500-1000ms
```

## Städa upp

### Ta bort allt (inklusive databas)
```bash
docker-compose down -v
```

### Ta bort endast containers (behåll databas)
```bash
docker-compose down
```

### Starta från scratch
```bash
# Stoppa och ta bort allt
docker-compose down -v

# Ta bort images
docker-compose down --rmi all

# Starta igen
docker-compose up -d
```

## Nästa steg

När allt fungerar lokalt:
1. Testa alla API-endpoints
2. Testa autentisering
3. Testa hybrid-sökning
4. Verifiera att böcker sparas korrekt
5. Kolla prestanda

Sedan är du redo att deploya till one.com! Se [DEPLOYMENT.md](./DEPLOYMENT.md).

## Tips för utveckling

### Hot reload för PHP
PHP-filer läses om automatiskt vid varje request. Inga ändringar behövs!

### Databas-migrations
Om du ändrar schema:
```bash
# Backup först
docker-compose exec db mysqldump -u forsta_user -pforsta_password forsta_kapitlet_db > backup.sql

# Kör nya schema
docker-compose exec db mysql -u forsta_user -pforsta_password forsta_kapitlet_db < database/schema.sql
```

### Debugging
```bash
# Följ API-loggar
docker-compose logs -f api

# Följ MySQL-loggar
docker-compose logs -f db

# Kör SQL-queries direkt
docker-compose exec db mysql -u forsta_user -pforsta_password forsta_kapitlet_db -e "SELECT COUNT(*) FROM books;"
```

## Säkerhet (för produktion)

**OBS:** Docker-konfigurationen är för utveckling. Innan produktion:

- [ ] Ändra alla lösenord i `docker-compose.yml`
- [ ] Generera ny JWT_SECRET
- [ ] Ändra CORS från `*` till din domän
- [ ] Stäng av `display_errors` i `php.ini`
- [ ] Använd HTTPS
- [ ] Implementera rate limiting

---

**Lycka till med utvecklingen!** 🚀
