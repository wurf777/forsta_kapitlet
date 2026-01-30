import React, { createContext, useState, useContext, useEffect } from 'react';
import en from '../locales/en';
import sv from '../locales/sv';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        const savedLanguage = localStorage.getItem('appLanguage');
        return savedLanguage || 'sv'; // Default to Swedish
    });

    useEffect(() => {
        localStorage.setItem('appLanguage', language);
    }, [language]);

    const translations = {
        en,
        sv,
    };

    const t = (key) => {
        const keys = key.split('.');
        let value = translations[language];

        for (const k of keys) {
            if (value && value[k]) {
                value = value[k];
            } else {
                return key; // Fallback to key if translation missing
            }
        }
        return value;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
