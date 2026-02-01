import React, { useState, useEffect } from 'react';
import { getUserProfile, updateUserProfile, getUniqueAuthors, getUniqueGenres } from '../services/storage';
import { AVAILABLE_SERVICES, AVAILABLE_FORMATS } from '../services/serviceLinks';
import { useLanguage } from '../context/LanguageContext';

const Profile = () => {
    const { t } = useLanguage();
    const [profile, setProfile] = useState(getUserProfile());
    const [newFavAuthor, setNewFavAuthor] = useState('');
    const [newFavGenre, setNewFavGenre] = useState('');
    const [newBlockAuthor, setNewBlockAuthor] = useState('');
    const [newBlockGenre, setNewBlockGenre] = useState('');

    // Suggestions state
    const [authorSuggestions, setAuthorSuggestions] = useState([]);
    const [genreSuggestions, setGenreSuggestions] = useState([]);

    useEffect(() => {
        setProfile(getUserProfile());
        setAuthorSuggestions(getUniqueAuthors());
        setGenreSuggestions(getUniqueGenres());
    }, []);

    const handleUpdate = (updates) => {
        const updatedProfile = updateUserProfile(updates);
        setProfile(updatedProfile);
    };

    const addItem = (listName, item, setItem, isBlocklist = false) => {
        if (!item.trim()) return;

        if (isBlocklist) {
            const currentList = profile.blocklist[listName] || [];
            if (currentList.includes(item.trim())) return;

            const newBlocklist = {
                ...profile.blocklist,
                [listName]: [...currentList, item.trim()]
            };
            handleUpdate({ blocklist: newBlocklist });
        } else {
            const currentList = profile[listName] || [];
            if (currentList.includes(item.trim())) return;

            handleUpdate({ [listName]: [...currentList, item.trim()] });
        }
        setItem('');
    };

    const removeItem = (listName, item, isBlocklist = false) => {
        if (isBlocklist) {
            const currentList = profile.blocklist?.[listName] || [];
            const newBlocklist = {
                ...profile.blocklist,
                [listName]: currentList.filter(i => i !== item)
            };
            handleUpdate({ blocklist: newBlocklist });
        } else {
            const currentList = profile[listName] || [];
            handleUpdate({ [listName]: currentList.filter(i => i !== item) });
        }
    };

    const toggleFormat = (format) => {
        const current = profile.preferredFormats || [];
        const updated = current.includes(format)
            ? current.filter(f => f !== format)
            : [...current, format];

        // When formats change, remove services that are no longer compatible
        const currentServices = profile.preferredServices || [];
        if (updated.length > 0) {
            const compatibleServices = currentServices.filter(serviceId => {
                const service = AVAILABLE_SERVICES.find(s => s.id === serviceId);
                return service && service.types.some(type => updated.includes(type));
            });

            if (compatibleServices.length !== currentServices.length) {
                handleUpdate({
                    preferredFormats: updated,
                    preferredServices: compatibleServices
                });
                return;
            }
        } else if (currentServices.length > 0) {
            // All formats removed — clear services too
            handleUpdate({
                preferredFormats: updated,
                preferredServices: []
            });
            return;
        }

        handleUpdate({ preferredFormats: updated });
    };

    const toggleService = (serviceId) => {
        const current = profile.preferredServices || [];
        const updated = current.includes(serviceId)
            ? current.filter(s => s !== serviceId)
            : [...current, serviceId];
        handleUpdate({ preferredServices: updated });
    };

    return (
        <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 mb-2">{t('profile.title')}</h1>
            <p className="text-sm md:text-base text-stone-600 mb-6 md:mb-8">{t('profile.subtitle')}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 mb-6 md:mb-8">
                {/* Favorites Column */}
                <div>
                    <Section title={`❤️ ${t('profile.favorites')}`}>
                        <div className="mb-6">
                            <h3 className="font-medium text-stone-700 mb-2">{t('profile.authors')}</h3>
                            <ListInput
                                value={newFavAuthor}
                                onChange={setNewFavAuthor}
                                onAdd={() => addItem('favoriteAuthors', newFavAuthor, setNewFavAuthor)}
                                placeholder={t('profile.authorPlaceholder')}
                                list="authors"
                                suggestions={authorSuggestions}
                            />
                            <ItemList items={profile.favoriteAuthors} onDelete={(item) => removeItem('favoriteAuthors', item)} />
                        </div>

                        <div>
                            <h3 className="font-medium text-stone-700 mb-2">{t('profile.genres')}</h3>
                            <ListInput
                                value={newFavGenre}
                                onChange={setNewFavGenre}
                                onAdd={() => addItem('favoriteGenres', newFavGenre, setNewFavGenre)}
                                placeholder={t('profile.genrePlaceholder')}
                                list="genres"
                                suggestions={genreSuggestions}
                            />
                            <ItemList items={profile.favoriteGenres} onDelete={(item) => removeItem('favoriteGenres', item)} />
                        </div>
                    </Section>
                </div>

                {/* Blocklist Column */}
                <div>
                    <Section title={`🚫 ${t('profile.blocklist')}`}>
                        <div className="mb-6">
                            <h3 className="font-medium text-stone-700 mb-2">{t('profile.authors')}</h3>
                            <ListInput
                                value={newBlockAuthor}
                                onChange={setNewBlockAuthor}
                                onAdd={() => addItem('authors', newBlockAuthor, setNewBlockAuthor, true)}
                                placeholder={t('profile.blockAuthorPlaceholder')}
                                list="authors"
                                suggestions={authorSuggestions}
                            />
                            <ItemList items={profile.blocklist.authors} onDelete={(item) => removeItem('authors', item, true)} />
                        </div>

                        <div>
                            <h3 className="font-medium text-stone-700 mb-2">{t('profile.genres')}</h3>
                            <ListInput
                                value={newBlockGenre}
                                onChange={setNewBlockGenre}
                                onAdd={() => addItem('genres', newBlockGenre, setNewBlockGenre, true)}
                                placeholder={t('profile.blockGenrePlaceholder')}
                                list="genres"
                                suggestions={genreSuggestions}
                            />
                            <ItemList items={profile.blocklist.genres} onDelete={(item) => removeItem('genres', item, true)} />
                        </div>
                    </Section>
                </div>
            </div>

            {/* Reading Habits & Services Section */}
            <Section title={`📚 Läsvanor & Tjänster`}>
                <p className="text-stone-600 mb-4 text-sm">
                    Välj hur du föredrar att läsa/lyssna och vilka tjänster du använder. Detta hjälper Bibbi att ge bättre förslag och visar dig var du kan hitta böcker.
                </p>

                <div className="mb-6">
                    <h3 className="font-medium text-stone-700 mb-3">Format</h3>
                    <div className="flex flex-wrap gap-3">
                        {AVAILABLE_FORMATS.map(format => (
                            <label
                                key={format}
                                className="flex items-center gap-2 px-4 py-2 border border-stone-200 rounded-lg cursor-pointer hover:bg-stone-50 transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    checked={profile.preferredFormats?.includes(format) || false}
                                    onChange={() => toggleFormat(format)}
                                    className="rounded text-stone-800 focus:ring-stone-400"
                                />
                                <span className="text-sm text-stone-700">{format}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="font-medium text-stone-700 mb-3">Tjänster</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {AVAILABLE_SERVICES.map(service => {
                            // Check if service supports any of the selected formats
                            const selectedFormats = profile.preferredFormats || [];
                            const isCompatible = selectedFormats.length === 0 ||
                                service.types.some(type => selectedFormats.includes(type));

                            return (
                                <label
                                    key={service.id}
                                    className={`flex items-start gap-2 px-4 py-3 border rounded-lg transition-colors ${
                                        isCompatible
                                            ? 'border-stone-200 cursor-pointer hover:bg-stone-50'
                                            : 'border-stone-100 bg-stone-50 opacity-50 cursor-not-allowed'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={profile.preferredServices?.includes(service.id) || false}
                                        onChange={() => toggleService(service.id)}
                                        disabled={!isCompatible}
                                        className="mt-0.5 rounded text-stone-800 focus:ring-stone-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <div className="flex-1">
                                        <div className={`text-sm font-medium ${isCompatible ? 'text-stone-900' : 'text-stone-500'}`}>
                                            {service.name}
                                        </div>
                                        <div className="text-xs text-stone-500">{service.types.join(', ')}</div>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </div>
            </Section>

        </div>
    );
};

const Section = ({ title, children }) => (
    <div className="mb-6 md:mb-8 p-4 md:p-6 bg-white rounded-xl shadow-sm border border-stone-100">
        <h2 className="text-lg md:text-xl font-serif font-bold text-stone-800 mb-3 md:mb-4">{title}</h2>
        {children}
    </div>
);

const ListInput = ({ value, onChange, onAdd, placeholder, list, suggestions = [] }) => (
    <div className="flex gap-2 mb-4">
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onAdd()}
            placeholder={placeholder}
            list={list ? `${list}-datalist` : undefined}
            className="flex-1 p-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
        />
        {list && suggestions.length > 0 && (
            <datalist id={`${list}-datalist`}>
                {suggestions.map((item, index) => (
                    <option key={index} value={item} />
                ))}
            </datalist>
        )}
        <button
            onClick={onAdd}
            className="px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors"
        >
            {/* We need to pass t here or use it inside ListInput if we want to translate 'Add' */}
            Lägg till
        </button>
    </div>
);

const ItemList = ({ items, onDelete }) => (
    <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
            <span key={index} className="inline-flex items-center px-2.5 md:px-3 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200 text-sm">
                <span className="truncate max-w-[150px] md:max-w-none">{item}</span>
                <button
                    onClick={() => onDelete(item)}
                    className="ml-1.5 md:ml-2 text-stone-400 hover:text-red-500 font-bold"
                >
                    ×
                </button>
            </span>
        ))}
        {items.length === 0 && <span className="text-stone-400 italic text-xs md:text-sm">Inga tillagda än.</span>}
    </div>
);

export default Profile;
