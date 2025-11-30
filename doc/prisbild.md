# Prisbild för Bibbi (Gemini Flash)

Detta dokument beskriver kostnadsmodellen för Bibbi, som drivs av Googles **Gemini 2.0 Flash**-modell.

## Sammanfattning
Bibbi är extremt billig i drift. Du kan föra ca **700 konversationer för 1 krona**.

## Prismodell
Priset baseras på "tokens" (orddelar).

*   **Input (det vi skickar till Bibbi):** ~0,80 kr per 1 miljon tokens.
*   **Output (det Bibbi svarar):** ~3,00 kr per 1 miljon tokens.

## Kostnad per meddelande (Exempel)
En typisk interaktion ser ut så här:

1.  **Input (~1000 tokens):** Vi skickar med din boklista, din profil och historik för kontext.
    *   Kostnad: `(1000 / 1 000 000) * 0,80 kr = 0,0008 kr`
2.  **Output (~200 tokens):** Bibbis svar.
    *   Kostnad: `(200 / 1 000 000) * 3,00 kr = 0,0006 kr`

**Total kostnad per meddelande:** ~0,0014 kr (0,14 öre).

## Slutsats
Även vid flitig användning är kostnaden försumbar för personligt bruk.
