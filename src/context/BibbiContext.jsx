import React, { createContext, useContext, useState, useCallback } from 'react';

const BibbiContext = createContext();

export const useBibbi = () => {
    const context = useContext(BibbiContext);
    if (!context) {
        throw new Error('useBibbi must be used within a BibbiProvider');
    }
    return context;
};

export const BibbiProvider = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [context, setContext] = useState(null); // e.g., { type: 'book', data: bookObject }
    const [messages, setMessages] = useState([]);
    const [modes, setModes] = useState({
        length: 3,
        mood: 3,
        tempo: 3,
        vibes: []
    });
    const [isDocked, setIsDocked] = useState(false);

    const openChat = useCallback(() => setIsOpen(true), []);
    const closeChat = useCallback(() => setIsOpen(false), []);
    const toggleChat = useCallback(() => setIsOpen(prev => !prev), []);

    const setBookContext = useCallback((book) => {
        setContext({ type: 'book', data: book });
    }, []);

    const clearContext = useCallback(() => {
        setContext(null);
    }, []);

    const value = {
        isOpen,
        openChat,
        closeChat,
        toggleChat,
        context,
        setBookContext,
        clearContext,
        messages,
        setMessages,
        modes,
        setModes,
        isDocked,
        setIsDocked
    };

    return (
        <BibbiContext.Provider value={value}>
            {children}
        </BibbiContext.Provider>
    );
};
