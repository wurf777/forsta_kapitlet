import React, { useState, useEffect } from 'react';
import { Key, CheckCircle, XCircle, Loader, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { getUserProfile, updateUserProfile, getUniqueAuthors, getUniqueGenres } from '../services/storage';
import { AVAILABLE_SERVICES, AVAILABLE_FORMATS } from '../services/serviceLinks';
import { useLanguage } from '../context/LanguageContext';
import { track } from '../services/analytics';
import { api } from '../services/api';

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

    // API key state
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [apiKeyStatus, setApiKeyStatus] = useState(null); // null | 'loading' | 'valid' | 'invalid' | 'failed'
    const [apiKeyInfo, setApiKeyInfo] = useState(null); // { hasKey, maskedKey }
    const [apiKeyMessage, setApiKeyMessage] = useState('');
    const [showGuide, setShowGuide] = useState(false);

    useEffect(() => {
        setProfile(getUserProfile());
        setAuthorSuggestions(getUniqueAuthors());
        setGenreSuggestions(getUniqueGenres());

        api.apiKey.get().then(info => setApiKeyInfo(info)).catch(() => {});
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
            track('profile', 'update_blocklist', { field: listName, action: 'add', value: item.trim() });
        } else {
            const currentList = profile[listName] || [];
            if (currentList.includes(item.trim())) return;

            handleUpdate({ [listName]: [...currentList, item.trim()] });
            track('profile', 'update_favorites', { field: listName, action: 'add', value: item.trim() });
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
            track('profile', 'update_blocklist', { field: listName, action: 'remove', value: item });
        } else {
            const currentList = profile[listName] || [];
            handleUpdate({ [listName]: currentList.filter(i => i !== item) });
            track('profile', 'update_favorites', { field: listName, action: 'remove', value: item });
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
        track('profile', 'toggle_format', { format, enabled: updated.includes(format) });
    };

    const toggleService = (serviceId) => {
        const current = profile.preferredServices || [];
        const updated = current.includes(serviceId)
            ? current.filter(s => s !== serviceId)
            : [...current, serviceId];
        handleUpdate({ preferredServices: updated });
        track('profile', 'toggle_service', { service: serviceId, enabled: updated.includes(serviceId) });
    };

    const handleSaveApiKey = async () => {
        const key = apiKeyInput.trim();
        if (!key) return;
        setApiKeyStatus('loading');
        setApiKeyMessage('');
        try {
            const result = await api.apiKey.save(key);
            setApiKeyInfo({ hasKey: true, maskedKey: result.maskedKey });
            setApiKeyStatus('valid');
            setApiKeyMessage(t('apiKey.valid'));
            setApiKeyInput('');
            track('profile', 'api_key_saved');
        } catch (err) {
            setApiKeyStatus('failed');
            setApiKeyMessage(err.message || t('apiKey.failed'));
        }
    };

    const handleRemoveApiKey = async () => {
        if (!window.confirm(t('apiKey.removeConfirm'))) return;
        try {
            await api.apiKey.remove();
            setApiKeyInfo({ hasKey: false, maskedKey: null });
            setApiKeyStatus(null);
            setApiKeyMessage('');
            track('profile', 'api_key_removed');
        } catch {
            // silent
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 mb-2">{t('profile.title')}</h1>
            <p className="text-sm md:text-base text-stone-600 mb-6 md:mb-8">{t('profile.subtitle')}</p>

            {/* API Key Section */}
            <div className="mb-6 md:mb-8 p-4 md:p-6 bg-white rounded-xl shadow-sm border border-stone-100">
                <h2 className="text-lg md:text-xl font-serif font-bold text-stone-800 mb-1 flex items-center gap-2">
                    <Key size={20} className="text-accent" />
                    {t('apiKey.title')}
                </h2>
                <p className="text-sm text-stone-600 mb-4">{t('apiKey.description')}</p>

                {apiKeyInfo?.hasKey ? (
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 font-mono">
                            <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                            {apiKeyInfo.maskedKey}
                        </div>
                        <button
                            onClick={handleRemoveApiKey}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                        >
                            <Trash2 size={15} />
                            {t('apiKey.remove')}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={apiKeyInput}
                                onChange={(e) => {
                                    setApiKeyInput(e.target.value);
                                    setApiKeyStatus(null);
                                    setApiKeyMessage('');
                                }}
                                placeholder={t('apiKey.placeholder')}
                                className="flex-1 p-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
                            />
                            <button
                                onClick={handleSaveApiKey}
                                disabled={apiKeyStatus === 'loading' || !apiKeyInput.trim()}
                                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap"
                            >
                                {apiKeyStatus === 'loading' ? (
                                    <span className="flex items-center gap-1.5"><Loader size={15} className="animate-spin" />{t('apiKey.testing')}</span>
                                ) : t('apiKey.save')}
                            </button>
                        </div>

                        {apiKeyStatus === 'valid' && (
                            <p className="flex items-center gap-1.5 text-sm text-green-700">
                                <CheckCircle size={15} />{apiKeyMessage}
                            </p>
                        )}
                        {(apiKeyStatus === 'failed' || apiKeyStatus === 'invalid') && (
                            <p className="flex items-center gap-1.5 text-sm text-red-700">
                                <XCircle size={15} />{apiKeyMessage}
                            </p>
                        )}
                    </div>
                )}

                {/* Collapsible guide */}
                <button
                    onClick={() => setShowGuide(g => !g)}
                    className="mt-4 flex items-center gap-1 text-sm text-accent hover:underline"
                >
                    {showGuide ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    {t('apiKey.howToGet')}
                </button>
                {showGuide && (
                    <div className="mt-3 p-4 bg-stone-50 rounded-lg border border-stone-100 text-sm text-stone-700 space-y-1">
                        <p className="font-medium mb-2">{t('onboarding.keyGuideIntro')}</p>
                        {[
                            t('onboarding.keyGuideStep1'),
                            t('onboarding.keyGuideStep2'),
                            t('onboarding.keyGuideStep3'),
                            t('onboarding.keyGuideStep4'),
                            t('onboarding.keyGuideStep5'),
                        ].map((step, i) => (
                            <p key={i} className="flex gap-2">
                                <span className="font-bold text-accent">{i + 1}.</span>
                                {step}
                            </p>
                        ))}
                        <p className="mt-2 text-stone-500 italic text-xs">{t('onboarding.keyGuideNote')}</p>
                    </div>
                )}
            </div>

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
            <Section title={`📚 ${t('profile.readingHabitsTitle')}`}>
                <p className="text-stone-600 mb-4 text-sm">
                    {t('profile.readingHabitsDesc')}
                </p>

                <div className="mb-6">
                    <h3 className="font-medium text-stone-700 mb-3">{t('profile.formatLabel')}</h3>
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
                    <h3 className="font-medium text-stone-700 mb-3">{t('profile.servicesLabel')}</h3>
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

const ListInput = ({ value, onChange, onAdd, placeholder, list, suggestions = [] }) => {
    const { t } = useLanguage();
    return (
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
                {t('profile.add')}
            </button>
        </div>
    );
};

const ItemList = ({ items, onDelete }) => {
    const { t } = useLanguage();
    return (
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
            {items.length === 0 && <span className="text-stone-400 italic text-xs md:text-sm">{t('profile.noItems')}</span>}
        </div>
    );
};

export default Profile;
