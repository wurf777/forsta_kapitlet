import { GoogleGenerativeAI } from '@google/generative-ai';
import { getLibrary } from './storage';

// Initialize Gemini API
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// Storage key for daily tip
const DAILY_TIP_KEY = 'forsta_kapitlet_daily_tip';

/**
 * Send a message to Bibbi and get a response
 * @param {string} message - User's message
 * @param {Array} history - Conversation history
 * @returns {Promise<string>} - Bibbi's response
 */
export const sendMessageToBibbi = async (message, history, modes = null, profile = null, context = null) => {
    if (!genAI) {
        return "Hoppsan! Jag behöver en API-nyckel för att fungera. Lägg till din Gemini API-nyckel i .env filen (VITE_GEMINI_API_KEY).";
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Get user's book library for context
        const userBooks = await getLibrary();
        const bookContext = userBooks.length > 0
            ? `\n\nAnvändarens boklista (${userBooks.length} böcker):\n${userBooks.map(book =>
                `- "${book.title}" av ${book.authors?.join(', ') || 'Okänd författare'} (Status: ${book.status || 'Vill läsa'})`
            ).join('\n')}`
            : '\n\nAnvändaren har inga böcker i sin lista än.';

        // Build profile context
        let profileContext = "";
        if (profile) {
            const favAuthors = profile.favoriteAuthors?.length > 0 ? `\n- Favoritförfattare: ${profile.favoriteAuthors.join(', ')}` : "";
            const favGenres = profile.favoriteGenres?.length > 0 ? `\n- Favoritgenrer: ${profile.favoriteGenres.join(', ')}` : "";
            const blockAuthors = profile.blocklist?.authors?.length > 0 ? `\n- BLOCKERA författare (visa ALDRIG): ${profile.blocklist.authors.join(', ')}` : "";
            const blockGenres = profile.blocklist?.genres?.length > 0 ? `\n- BLOCKERA genrer/ämnen (visa ALDRIG): ${profile.blocklist.genres.join(', ')}` : "";
            const prefFormats = profile.preferredFormats?.length > 0 ? `\n- Föredragna format: ${profile.preferredFormats.join(', ')}` : "";
            const prefServices = profile.preferredServices?.length > 0 ? `\n- Föredragna tjänster: ${profile.preferredServices.map(id => id.charAt(0).toUpperCase() + id.slice(1)).join(', ')}` : "";

            if (favAuthors || favGenres || blockAuthors || blockGenres || prefFormats || prefServices) {
                profileContext = `\n\nANVÄNDARPROFIL:${favAuthors}${favGenres}${blockAuthors}${blockGenres}${prefFormats}${prefServices}`;
            }
        }

        // Build modes context
        let modesContext = "";
        if (modes) {
            const lengthMap = { 1: "Mycket kort/snabbt", 2: "Kort", 3: "Lagom", 4: "Långt", 5: "Episkt/Tegelsten" };
            const moodMap = { 1: "Ljust & Hoppfullt", 2: "Lättsamt", 3: "Neutralt", 4: "Mörkt", 5: "Mörkt & Tungt" };
            const tempoMap = { 1: "Långsamt & Reflekterande", 2: "Lugnt", 3: "Normalt", 4: "Snabbt", 5: "Högt & Actionfyllt" };

            const vibes = modes.vibes?.length > 0 ? `\n- Önskad känsla/vibe: ${modes.vibes.join(', ')}` : "";

            modesContext = `\n\nAKTUELLT LÄSLÄGE (Vad användaren vill ha JUST NU):
- Längd: ${lengthMap[modes.length] || "Lagom"}
- Stämning: ${moodMap[modes.mood] || "Neutralt"}
- Tempo: ${tempoMap[modes.tempo] || "Normalt"}${vibes}`;
        }

        // Build specific context (e.g. current book)
        let specificContext = "";
        if (context && context.type === 'book' && context.data) {
            const book = context.data;
            specificContext = `\n\nAKTUELL KONTEXT (Användaren tittar på denna bok just nu):
- Titel: ${book.title}
- Författare: ${book.author}
- Beskrivning: ${book.synopsis}
- Användarens status: ${book.status}
- Användarens betyg: ${book.rating || 'Ej betygsatt'}
- Användarens anteckningar: ${book.notes || 'Inga anteckningar'}

Användaren ställer frågor om DENNA bok om inget annat anges.`;
        }

        // Build conversation history
        const chatHistory = history
            .filter(msg => msg.text && msg.sender !== 'system') // Filter out system messages and empty text
            .map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));

        // System prompt for Bibbi's personality
        const systemPrompt = `Du är Bibbi, en entusiastisk och kunnig bokexpert som älskar att hjälpa människor hitta sin nästa favoritbok.

PERSONLIGHET:
- Vänlig, varm och genuint intresserad av läsning
- Pratar svenska naturligt och avslappnat
- Ger personliga rekommendationer med genomtänkta förklaringar
- Kan diskutera genrer, författare, teman, skrivstilar och känslomässiga toner
- Ställer följdfrågor för att förstå användarens smak bättre

RIKTLINJER:
- Basera rekommendationer på användarens boklista, profil och aktuella läsläge
- VIKTIGT: Respektera ALLTID användarens blocklista. Föreslå ALDRIG författare eller genrer som är blockerade.
- Om användaren frågar var de kan hitta/läsa/lyssna på böcker, använd deras föredragna format och tjänster
- Förklara VARFÖR en bok skulle passa användaren (t.ex. "Eftersom du gillar X...")
- Var konkret med titlar och författare
- Håll svaren lagom långa (2-4 meningar vanligtvis)
- Undvik att lista för många böcker på en gång (max 2-3 per svar)
- Var uppmuntrande och positiv

${bookContext}${profileContext}${modesContext}${specificContext}`;

        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: systemPrompt }]
                },
                {
                    role: 'model',
                    parts: [{ text: 'Hej! Jag är Bibbi, din personliga bokguide. Jag älskar att prata om böcker och hjälpa dig hitta din nästa favoritläsning. Vad är du sugen på att läsa idag?' }]
                },
                ...chatHistory
            ],
            generationConfig: {
                temperature: 0.9,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 1024,
            }
        });

        const result = await chat.sendMessage(message);
        const response = result.response;
        return response.text();

    } catch (error) {
        console.error('Error communicating with Gemini:', error);
        return "Oj, något gick fel när jag försökte svara. Kan du försöka igen?";
    }
};

/**
 * Get 10 book recommendations based on user's library
 * @param {Array} userBooks - User's book library (optional, will fetch from storage if not provided)
 * @returns {Promise<Array>} - Array of book recommendations with title, author, and reason
 */
export const getBookRecommendations = async (userBooks = null, profile = null) => {
    if (!genAI) {
        throw new Error("API-nyckel saknas. Lägg till VITE_GEMINI_API_KEY i .env filen.");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Get user's book library
        const library = userBooks || await getLibrary();

        if (library.length === 0) {
            throw new Error("Du behöver lägga till några böcker i din lista först för att få personliga rekommendationer.");
        }

        const bookList = library.map(book =>
            `- "${book.title}" av ${book.authors?.join(', ') || 'Okänd författare'} (${book.categories?.join(', ') || 'Ingen genre'})`
        ).join('\n');

        // Build profile context
        let profileContext = "";
        if (profile) {
            const favAuthors = profile.favoriteAuthors?.length > 0 ? `\n- Favoritförfattare: ${profile.favoriteAuthors.join(', ')}` : "";
            const favGenres = profile.favoriteGenres?.length > 0 ? `\n- Favoritgenrer: ${profile.favoriteGenres.join(', ')}` : "";
            const blockAuthors = profile.blocklist?.authors?.length > 0 ? `\n- BLOCKERA författare (visa ALDRIG): ${profile.blocklist.authors.join(', ')}` : "";
            const blockGenres = profile.blocklist?.genres?.length > 0 ? `\n- BLOCKERA genrer/ämnen (visa ALDRIG): ${profile.blocklist.genres.join(', ')}` : "";
            const prefFormats = profile.preferredFormats?.length > 0 ? `\n- Föredragna format: ${profile.preferredFormats.join(', ')}` : "";
            const prefServices = profile.preferredServices?.length > 0 ? `\n- Föredragna tjänster: ${profile.preferredServices.map(id => id.charAt(0).toUpperCase() + id.slice(1)).join(', ')}` : "";

            if (favAuthors || favGenres || blockAuthors || blockGenres || prefFormats || prefServices) {
                profileContext = `\n\nANVÄNDARPROFIL:${favAuthors}${favGenres}${blockAuthors}${blockGenres}${prefFormats}${prefServices}`;
            }
        }

        const prompt = `Baserat på följande boklista och användarprofil, ge mig 10 nya bokrekommendationer som användaren skulle uppskatta.

ANVÄNDARENS BOKLISTA:
${bookList}${profileContext}

INSTRUKTIONER:
- Analysera genrer, författare, teman och stilar i listan
- VIKTIGT: Respektera ALLTID användarens blocklista. Föreslå ALDRIG författare eller genrer som är blockerade.
- Prioritera användarens favoritförfattare och genrer om angivet
- Ge 10 OLIKA böcker som användaren inte redan har
- Variera rekommendationerna (inte bara samma genre)
- Inkludera både klassiker och moderna böcker
- Förklara kort VARFÖR varje bok passar baserat på användarens smak

Svara ENDAST med en JSON-array i följande format (ingen annan text):
[
  {
    "title": "Boktitel",
    "author": "Författarnamn",
    "reason": "Kort förklaring (1-2 meningar) varför denna bok passar användarens smak",
    "vibe": "En kort sträng som beskriver känslan (t.ex. Mysig, Mörk & Tung, Spännande)",
    "tempo": 3, // Ett heltal 1-5 (1=Långsamt, 5=Actionfyllt)
    "themes": ["Tema 1", "Tema 2", "Tema 3"], // 3-5 nyckelteman på svenska
    "genre_specifics": "Specifik genre (t.ex. Psykologisk thriller)"
  }
]`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Parse JSON response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error("Kunde inte tolka svaret från Gemini");
        }

        const recommendations = JSON.parse(jsonMatch[0]);
        return recommendations;

    } catch (error) {
        console.error('Error getting book recommendations:', error);
        throw error;
    }
};

/**
 * Analyze chat history for user preferences
 * @param {Array} history - Chat history
 * @param {Object} profile - User's current profile (optional)
 * @returns {Promise<Object|null>} - Suggested profile updates or null
 */
export const analyzeChatForPreferences = async (history, profile = null) => {
    if (!genAI || history.length < 2) return null;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Only look at the last few messages to save context and focus on recent topics
        const recentMessages = history
            .filter(msg => msg.text && msg.sender !== 'system') // Filter out system messages
            .slice(-4)
            .map(msg =>
                `${msg.sender === 'user' ? 'Användare' : 'Bibbi'}: ${msg.text}`
            ).join('\n');

        let profileContext = "";
        if (profile) {
            const favAuthors = profile.favoriteAuthors?.length > 0 ? `\n- Nuvarande favoritförfattare: ${profile.favoriteAuthors.join(', ')}` : "";
            const favGenres = profile.favoriteGenres?.length > 0 ? `\n- Nuvarande favoritgenrer: ${profile.favoriteGenres.join(', ')}` : "";
            const blockAuthors = profile.blocklist?.authors?.length > 0 ? `\n- Nuvarande blockerade författare: ${profile.blocklist.authors.join(', ')}` : "";
            const blockGenres = profile.blocklist?.genres?.length > 0 ? `\n- Nuvarande blockerade genrer: ${profile.blocklist.genres.join(', ')}` : "";
            profileContext = `\n\nANVÄNDARENS PROFIL:${favAuthors}${favGenres}${blockAuthors}${blockGenres}`;
        }

        const prompt = `Analysera följande konversation mellan en användare och en bok-assistent (Bibbi).
Leta efter STARKA och TYDLIGA signaler på att användaren gillar eller ogillar specifika författare eller genrer.
Ignorera vaga uttalanden. Fokusera på när användaren uttryckligen säger "Jag älskar X", "X är min favorit", "Jag hatar Y", "Visa aldrig Z".

KONVERSATION:
${recentMessages}${profileContext}

INSTRUKTIONER:
1. Om användaren gillar något nytt (som INTE redan är favorit), föreslå att lägga till i favoriter.
2. Om användaren gillar något som ligger i blocklistan, föreslå att TA BORT det från blocklistan OCH lägga till i favoriter.
3. Om användaren ogillar något som REDAN är en favorit (se profil), föreslå att TA BORT det från favoriter.
4. Om användaren ogillar något starkt (som INTE redan är blockerat), föreslå att blockera det.
5. Om användaren ogillar en favorit, kan du föreslå BÅDE att ta bort från favoriter OCH att blockera (om avskyn är stark).

Returnera en JSON med följande struktur (annars returnera null):
{
  "favoriteAuthors": ["Namn 1"], // Lägg till i favoriter
  "favoriteGenres": ["Genre 1"], // Lägg till i favoriter
  "removeFromFavorites": {
      "authors": ["Namn 3"], // TA BORT från favoriter
      "genres": ["Genre 3"] // TA BORT från favoriter
  },
  "blocklist": {
    "authors": ["Namn 2"], // Blockera
    "genres": ["Genre 2"] // Blockera
  },
  "removeFromBlocklist": {
      "authors": ["Namn 4"], // TA BORT från blocklistan
      "genres": ["Genre 4"] // TA BORT från blocklistan
  },
  "reason": "Kort förklaring på svenska varför detta föreslås. VIKTIGT: Tilltala användaren med 'du' (t.ex. 'Eftersom du inte längre verkar gilla...')."
}

Svara ENDAST med JSON.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        const suggestions = JSON.parse(jsonMatch[0]);

        // Filter out suggestions that are already in the profile to avoid redundancy
        if (profile) {
            if (suggestions.favoriteAuthors) {
                suggestions.favoriteAuthors = suggestions.favoriteAuthors.filter(a => !profile.favoriteAuthors?.includes(a));
            }
            if (suggestions.favoriteGenres) {
                suggestions.favoriteGenres = suggestions.favoriteGenres.filter(g => !profile.favoriteGenres?.includes(g));
            }
            if (suggestions.blocklist?.authors) {
                suggestions.blocklist.authors = suggestions.blocklist.authors.filter(a => !profile.blocklist?.authors?.includes(a));
            }
            if (suggestions.blocklist?.genres) {
                suggestions.blocklist.genres = suggestions.blocklist.genres.filter(g => !profile.blocklist?.genres?.includes(g));
            }
        }

        // Filter out empty suggestions
        const hasUpdates =
            suggestions.favoriteAuthors?.length > 0 ||
            suggestions.favoriteGenres?.length > 0 ||
            suggestions.removeFromFavorites?.authors?.length > 0 ||
            suggestions.removeFromFavorites?.genres?.length > 0 ||
            suggestions.blocklist?.authors?.length > 0 ||
            suggestions.blocklist?.genres?.length > 0 ||
            suggestions.removeFromBlocklist?.authors?.length > 0 ||
            suggestions.removeFromBlocklist?.genres?.length > 0;

        return hasUpdates ? suggestions : null;

    } catch (error) {
        console.error('Error analyzing preferences:', error);
        return null;
    }
};

/**
 * Get a daily book tip from Bibbi (cached for 24 hours)
 * @param {Object} profile - User's profile (optional)
 * @returns {Promise<Object|null>} - A single book recommendation or null
 */
export const getDailyTip = async (profile = null) => {
    // Check for cached tip
    const cached = localStorage.getItem(DAILY_TIP_KEY);
    if (cached) {
        try {
            const { tip, date } = JSON.parse(cached);
            const today = new Date().toDateString();
            if (date === today && tip) {
                return tip;
            }
        } catch {
            // Invalid cache, continue to fetch new
        }
    }

    if (!genAI) {
        return null;
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const library = await getLibrary();

        if (library.length === 0) {
            return null;
        }

        const bookList = library.slice(0, 20).map(book =>
            `- "${book.title}" av ${book.authors?.join(', ') || book.author || 'Okänd'} (${book.categories?.join(', ') || 'Ingen genre'})`
        ).join('\n');

        let profileContext = "";
        if (profile) {
            const favAuthors = profile.favoriteAuthors?.length > 0 ? `\nFavoritförfattare: ${profile.favoriteAuthors.join(', ')}` : "";
            const favGenres = profile.favoriteGenres?.length > 0 ? `\nFavoritgenrer: ${profile.favoriteGenres.join(', ')}` : "";
            const blockAuthors = profile.blocklist?.authors?.length > 0 ? `\nBLOCKERA författare: ${profile.blocklist.authors.join(', ')}` : "";
            const blockGenres = profile.blocklist?.genres?.length > 0 ? `\nBLOCKERA genrer: ${profile.blocklist.genres.join(', ')}` : "";
            profileContext = `${favAuthors}${favGenres}${blockAuthors}${blockGenres}`;
        }

        const prompt = `Du är Bibbi, en vänlig bokexpert. Ge ETT personligt boktips baserat på användarens bibliotek.

BÖCKER I BIBLIOTEKET:
${bookList}
${profileContext}

INSTRUKTIONER:
- Ge EN bok som användaren INTE redan har
- VIKTIGT: Föreslå ALDRIG författare eller genrer från blocklistan
- Skriv en kort, personlig motivering (max 2 meningar)
- Var varm och engagerande i tonen

Svara ENDAST med JSON:
{
  "title": "Boktitel",
  "author": "Författare",
  "reason": "Kort motivering varför denna bok passar"
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        const tip = JSON.parse(jsonMatch[0]);

        // Cache the tip with today's date
        localStorage.setItem(DAILY_TIP_KEY, JSON.stringify({
            tip,
            date: new Date().toDateString()
        }));

        return tip;

    } catch (error) {
        console.error('Error getting daily tip:', error);
        return null;
    }
};
