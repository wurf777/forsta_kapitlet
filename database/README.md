# Databas

MySQL 8.0 (InnoDB). Två separata instanser: lokal (Docker) och produktion (one.com).

## Filer

- `schema.sql` — Alltid aktuell fullständig struktur. Kör denna för att sätta upp en ny databas från scratch.
- `migrations/` — Historiska ändringar i nummerordning.

## Migrationer

Migreringarna körs **manuellt** via phpMyAdmin. Det finns ingen automatik.

Varje migration registrerar sig själv i tabellen `schema_migrations` när den körs, så att du alltid kan se vilket tillstånd en databas befinner sig i:

```sql
SELECT * FROM schema_migrations ORDER BY applied_at;
```

### Nuvarande migrationer

| Fil | Beskrivning |
|-----|-------------|
| `000_initial_schema.sql` | Grundschemat |
| `001_add_is_admin_to_users.sql` | Lägger till `is_admin` på `users` |
| `002_add_logging_tables.sql` | Lägger till `log_events` och `log_sessions` |

## Ny installation

Kör enbart `schema.sql` — innehåller hela strukturen med alla migrationer inbakade.

## Ny migration

1. Skapa `migrations/NNN_beskrivning.sql`
2. Lägg till i slutet av filen:
   ```sql
   INSERT IGNORE INTO schema_migrations (version) VALUES ('NNN_beskrivning');
   ```
3. Uppdatera `schema.sql` med ändringarna (baka in dem i rätt tabell)
4. Uppdatera tabellen i denna README
5. Kör filen manuellt mot lokal och produktion

## Lokalt

- phpMyAdmin: http://localhost:8081 (användare: `root`, lösenord: `rootpassword`)
- Starta: `docker-compose up -d`

## Produktion (one.com)

Hanteras via one.coms phpMyAdmin-gränssnitt.
