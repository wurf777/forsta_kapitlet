import fs from 'fs';

const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

const searchBooks = async (query) => {
    if (!query) return [];

    try {
        // Removed langRestrict=sv
        const response = await fetch(`${BASE_URL}?q=${encodeURIComponent(query)}&maxResults=10`);
        const data = await response.json();

        if (!data.items) return [];

        return data.items.map(formatBookData);
    } catch (error) {
        console.error("Error fetching from Google Books:", error);
        return [];
    }
};

const formatBookData = (googleBook) => {
    const info = googleBook.volumeInfo;
    const images = info.imageLinks || {};
    const coverUrl = images.extraLarge || images.large || images.medium || images.thumbnail || images.smallThumbnail || null;
    const isbn = info.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier ||
        info.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier || null;

    return {
        id: googleBook.id,
        title: info.title,
        author: info.authors ? info.authors.join(', ') : 'Okänd författare',
        cover: coverUrl?.replace('http:', 'https:') || null,
        rating: 0,
        progress: 0,
        status: 'Vill läsa',
        pages: info.pageCount || 0,
        published: info.publishedDate?.substring(0, 4) || 'Okänt år',
        synopsis: info.description || 'Ingen beskrivning tillgänglig.',
        categories: info.categories || [],
        language: info.language || 'okänt',
        isbn: isbn
    };
};


// Mock fetch if running in environment without it (though Node 18+ has it)
if (!global.fetch) {
    console.log("Fetch not available, cannot run test.");
    process.exit(1);
}

async function test() {
    const queries = [
        "14 Peter Clines",
        "Johannes försvinnande Viveca Sten"
    ];

    for (const q of queries) {
        console.log(`Searching for: ${q}`);
        try {
            const results = await searchBooks(q);
            if (results.length > 0) {
                const first = results[0];
                const output = `Query: ${q}\n` + JSON.stringify(first, null, 2) + "\n---\n";
                fs.appendFileSync('reproduction_output.txt', output);
            } else {
                fs.appendFileSync('reproduction_output.txt', `Query: ${q}\nNo results found.\n---\n`);
            }
        } catch (e) {
            console.error("Error:", e);
        }
        console.log("---");
    }
}

test();
