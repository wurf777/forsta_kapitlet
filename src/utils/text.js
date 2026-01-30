export const decodeHtmlEntities = (value) => {
    if (!value || typeof value !== 'string') return value ?? '';

    if (typeof document === 'undefined') {
        return value
            .replace(/&#039;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
    }

    const textarea = document.createElement('textarea');
    textarea.innerHTML = value;
    return textarea.value;
};
