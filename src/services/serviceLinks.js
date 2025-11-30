// Service links generator for various book services
// Since most services don't have public APIs, we generate search URLs

export const AVAILABLE_SERVICES = [
    { id: 'storytel', name: 'Storytel', types: ['Ljudbok'] },
    { id: 'legimus', name: 'Legimus (MTM)', types: ['Ljudbok', 'E-bok'] },
    { id: 'audible', name: 'Audible (eng)', types: ['Ljudbok'] },
    { id: 'adlibris', name: 'Adlibris', types: ['Ljudbok', 'E-bok', 'Pappersbok'] },
    { id: 'bokus', name: 'Bokus', types: ['E-bok', 'Pappersbok'] },
    { id: 'akademibokhandeln', name: 'Akademibokhandeln', types: ['E-bok', 'Pappersbok'] },
    { id: 'libris', name: 'Bibliotek (Libris)', types: ['Pappersbok', 'E-bok', 'Ljudbok'] }
];

export const AVAILABLE_FORMATS = ['Ljudbok', 'E-bok', 'Pappersbok'];

/**
 * Generate search URL for a book on a specific service
 * @param {string} serviceId - Service identifier
 * @param {Object} book - Book object with title and author
 * @returns {string|null} - Search URL or null if service not supported
 */
export const getServiceSearchUrl = (serviceId, book) => {
    const title = book.title || '';
    const author = book.author || book.authors?.join(' ') || '';
    const query = encodeURIComponent(`${title} ${author}`.trim());
    const titleOnly = encodeURIComponent(title);
    // Legimus uses + for spaces instead of %20
    const queryWithPlus = `${title} ${author}`.trim().replace(/ /g, '+');

    const urlMap = {
        storytel: `https://www.storytel.com/se/search/all?query=${query}`,
        legimus: `https://www.legimus.se/sok?SearchText=${queryWithPlus}&PageIndex=1`,
        audible: `https://www.audible.co.uk/search?keywords=${query}`,
        adlibris: `https://www.adlibris.com/se/sok?q=${query}`,
        bokus: `https://www.bokus.com/cgi-bin/product_search.cgi?search_word=${query}`,
        akademibokhandeln: `https://www.akademibokhandeln.se/search?q=${query}`,
        libris: `https://libris.kb.se/form_extended.jsp?f=all&q=${titleOnly}`
    };

    return urlMap[serviceId] || null;
};

/**
 * Get service links for a book based on user preferences
 * @param {Object} book - Book object
 * @param {Array} preferredServices - Array of preferred service IDs
 * @param {Array} preferredFormats - Array of preferred formats
 * @returns {Array} - Array of {service, url, formats} objects
 */
export const getServiceLinks = (book, preferredServices = [], preferredFormats = []) => {
    let servicesToShow = AVAILABLE_SERVICES;

    // Filter by user's preferred services if specified
    if (preferredServices.length > 0) {
        servicesToShow = AVAILABLE_SERVICES.filter(s => preferredServices.includes(s.id));
    }

    // Filter by user's preferred formats if specified
    if (preferredFormats.length > 0) {
        servicesToShow = servicesToShow.filter(s =>
            s.types.some(type => preferredFormats.includes(type))
        );
    }

    // Generate links
    return servicesToShow.map(service => ({
        id: service.id,
        name: service.name,
        url: getServiceSearchUrl(service.id, book),
        formats: service.types
    })).filter(link => link.url !== null);
};

/**
 * Get a formatted message about where to find a book based on preferences
 * @param {Object} book - Book object
 * @param {Array} preferredServices - Array of preferred service IDs
 * @param {Array} preferredFormats - Array of preferred formats
 * @returns {string} - Formatted message for Bibbi
 */
export const getAvailabilityMessage = (book, preferredServices = [], preferredFormats = []) => {
    const links = getServiceLinks(book, preferredServices, preferredFormats);

    if (links.length === 0) {
        return 'Jag har tyvärr inga specifika tjänster att föreslå just nu.';
    }

    const serviceNames = links.map(l => l.name).join(', ');
    const formatText = preferredFormats.length > 0
        ? ` som ${preferredFormats.join(' eller ')}`
        : '';

    return `Du kan hitta denna bok${formatText} på: ${serviceNames}. Jag kan inte kontrollera exakt tillgänglighet, men du kan söka där!`;
};
