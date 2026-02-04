# TODO: PWA-migrering för offline-support

## Bakgrund

Nuvarande implementation använder localStorage för att cacha användarpreferenser, men detta ger ingen riktig offline-upplevelse. Böcker och bibliotek fungerar inte offline.

## Mål

- Hela appen ska fungera offline
- Automatisk synk när nätet kommer tillbaka
- Kan installeras som app på mobil/desktop
- Bättre prestanda genom cachade resurser

## Uppgifter

### 1. Grundläggande PWA-setup
- [ ] Skapa `manifest.json` med app-metadata
- [ ] Skapa ikoner i olika storlekar (192x192, 512x512)
- [ ] Registrera Service Worker i `main.jsx`

### 2. Service Worker
- [ ] Cacha statiska resurser (JS, CSS, bilder)
- [ ] Cacha API-responses för böcker
- [ ] Hantera offline-requests graciöst

### 3. Lokal databas
- [ ] Migrera från localStorage till IndexedDB
- [ ] Lagra: användarbibliotek, profil, cachade sökresultat
- [ ] Implementera CRUD-operationer mot IndexedDB

### 4. Synkronisering
- [ ] Köa ändringar som görs offline
- [ ] Synka kön när online igen (Background Sync API)
- [ ] Konflikthantering (server wins / last write wins / merge)

### 5. UX
- [ ] Visa offline-indikator i UI
- [ ] Informera användaren om osparade ändringar
- [ ] "Installera app"-prompt

## Tekniska val att göra

| Beslut | Alternativ |
|--------|------------|
| IndexedDB-wrapper | Dexie.js, idb, native |
| Service Worker | Workbox (rekommenderat), vanilla |
| Sync-strategi | Background Sync, manuell retry |
| Konflikthantering | Server wins, timestamp-based merge |

## Resurser

- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/) - Enkel PWA-setup för Vite
- [Workbox](https://developer.chrome.com/docs/workbox/) - Google's SW-bibliotek
- [Dexie.js](https://dexie.org/) - IndexedDB-wrapper

## Påverkan på befintlig kod

Filer som behöver ändras:
- `src/services/storage.js` - Byt localStorage mot IndexedDB
- `src/services/api.js` - Lägg till offline-queue
- `src/main.jsx` - Registrera Service Worker
- `vite.config.js` - Lägg till PWA-plugin
- `index.html` - Länka manifest.json

## Prioritet

Medium - Implementera efter att grundläggande tester finns på plats.
