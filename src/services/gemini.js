import { GoogleGenerativeAI } from '@google/generative-ai';
import { getLibrary } from './storage';

// Initialize Gemini API
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/**
 * Send a message to Bibbi and get a response
 * @param {string} message - User's message
 * @param {Array} history - Conversation history
 * @returns {Promise<string>} - Bibbi's response
 */
export const sendMessageToBibbi = async (message, history) => {
    if (!genAI) {
        return "Hoppsan! Jag behöver en API-nyckel för att fungera. Lägg till din Gemini API-nyckel i .env filen (VITE_GEMINI_API_KEY).";
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        // Get user's book library for context
        const userBooks = getLibrary();
        const bookContext = userBooks.length > 0
            ? `\n\nAnvändarens boklista (${userBooks.length} böcker):\n${userBooks.map(book =>
                `- "${book.title}" av ${book.authors?.join(', ') || 'Okänd författare'} (Status: ${book.status || 'Vill läsa'})`
            ).join('\n')}`
            : '\n\nAnvändaren har inga böcker i sin lista än.';

        // Build conversation history
        const chatHistory = history.map(msg => ({
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
- Basera rekommendationer på användarens boklista när det är relevant
- Förklara VARFÖR en bok skulle passa användaren
- Var konkret med titlar och författare
- Håll svaren lagom långa (2-4 meningar vanligtvis)
- Undvik att lista för många böcker på en gång (max 2-3 per svar)
- Var uppmuntrande och positiv

${bookContext}`;

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
export const getBookRecommendations = async (userBooks = null) => {
    if (!genAI) {
        throw new Error("API-nyckel saknas. Lägg till VITE_GEMINI_API_KEY i .env filen.");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        // Get user's book library
        const library = userBooks || getLibrary();

        if (library.length === 0) {
            throw new Error("Du behöver lägga till några böcker i din lista först för att få personliga rekommendationer.");
        }

        const bookList = library.map(book =>
            `- "${book.title}" av ${book.authors?.join(', ') || 'Okänd författare'} (${book.categories?.join(', ') || 'Ingen genre'})`
        ).join('\n');

        const prompt = `Baserat på följande boklista, ge mig 10 nya bokrekommendationer som användaren skulle uppskatta.

ANVÄNDARENS BOKLISTA:
${bookList}

INSTRUKTIONER:
- Analysera genrer, författare, teman och stilar i listan
- Ge 10 OLIKA böcker som användaren inte redan har
- Variera rekommendationerna (inte bara samma genre)
- Inkludera både klassiker och moderna böcker
- Förklara kort VARFÖR varje bok passar baserat på användarens smak

Svara ENDAST med en JSON-array i följande format (ingen annan text):
[
  {
    "title": "Boktitel",
    "author": "Författarnamn",
    "reason": "Kort förklaring (1-2 meningar) varför denna bok passar användarens smak"
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
