import React, { useState, useEffect } from 'react';
import { getUserProfile, updateUserProfile, exportData, importData, getUniqueAuthors, getUniqueGenres } from '../services/storage';

const Profile = () => {
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
            const newBlocklist = {
                ...profile.blocklist,
                [listName]: profile.blocklist[listName].filter(i => i !== item)
            };
            handleUpdate({ blocklist: newBlocklist });
        } else {
            handleUpdate({ [listName]: profile[listName].filter(i => i !== item) });
        }
    };

    const handleExport = () => {
        exportData();
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            await importData(file);
            setProfile(getUserProfile()); // Refresh state
            setAuthorSuggestions(getUniqueAuthors()); // Refresh suggestions
            setGenreSuggestions(getUniqueGenres());
            alert('Data importerad! Sidan laddas om.');
            window.location.reload();
        } catch (error) {
            alert('Fel vid import: ' + error.message);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-serif font-bold text-stone-900 mb-2">Din Smakprofil</h1>
            <p className="text-stone-600 mb-8">Hjälp Bibbi att förstå vad du gillar – och vad du vill slippa.</p>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Favorites Column */}
                <div>
                    <Section title="❤️ Favoriter">
                        <div className="mb-6">
                            <h3 className="font-medium text-stone-700 mb-2">Författare</h3>
                            <ListInput
                                value={newFavAuthor}
                                onChange={setNewFavAuthor}
                                onAdd={() => addItem('favoriteAuthors', newFavAuthor, setNewFavAuthor)}
                                placeholder="T.ex. Astrid Lindgren"
                                list="authors"
                                suggestions={authorSuggestions}
                            />
                            <ItemList items={profile.favoriteAuthors} onDelete={(item) => removeItem('favoriteAuthors', item)} />
                        </div>

                        <div>
                            <h3 className="font-medium text-stone-700 mb-2">Genrer</h3>
                            <ListInput
                                value={newFavGenre}
                                onChange={setNewFavGenre}
                                onAdd={() => addItem('favoriteGenres', newFavGenre, setNewFavGenre)}
                                placeholder="T.ex. Deckare, Sci-Fi"
                                list="genres"
                                suggestions={genreSuggestions}
                            />
                            <ItemList items={profile.favoriteGenres} onDelete={(item) => removeItem('favoriteGenres', item)} />
                        </div>
                    </Section>
                </div>

                {/* Blocklist Column */}
                <div>
                    <Section title="🚫 Blocklista (Visa aldrig)">
                        <div className="mb-6">
                            <h3 className="font-medium text-stone-700 mb-2">Författare</h3>
                            <ListInput
                                value={newBlockAuthor}
                                onChange={setNewBlockAuthor}
                                onAdd={() => addItem('authors', newBlockAuthor, setNewBlockAuthor, true)}
                                placeholder="Författare du vill undvika"
                                list="authors"
                                suggestions={authorSuggestions}
                            />
                            <ItemList items={profile.blocklist.authors} onDelete={(item) => removeItem('authors', item, true)} />
                        </div>

                        <div>
                            <h3 className="font-medium text-stone-700 mb-2">Genrer / Ämnen</h3>
                            <ListInput
                                value={newBlockGenre}
                                onChange={setNewBlockGenre}
                                onAdd={() => addItem('genres', newBlockGenre, setNewBlockGenre, true)}
                                placeholder="T.ex. Skräck, True Crime"
                                list="genres"
                                suggestions={genreSuggestions}
                            />
                            <ItemList items={profile.blocklist.genres} onDelete={(item) => removeItem('genres', item, true)} />
                        </div>
                    </Section>
                </div>
            </div>

            {/* Data Management Section */}
            <Section title="💾 Datahantering">
                <p className="text-stone-600 mb-4 text-sm">
                    Spara ner din data (böcker och profil) till en fil, eller återställ från en tidigare backup.
                    Bra att ha om du byter webbläsare eller vill vara säker på att inget försvinner.
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-stone-200 text-stone-800 rounded-lg hover:bg-stone-300 transition-colors font-medium"
                    >
                        Exportera Data
                    </button>

                    <label className="px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors font-medium cursor-pointer">
                        Importera Data
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            className="hidden"
                        />
                    </label>
                </div>
            </Section>
        </div>
    );
};

const Section = ({ title, children }) => (
    <div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-stone-100">
        <h2 className="text-xl font-serif font-bold text-stone-800 mb-4">{title}</h2>
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
            Lägg till
        </button>
    </div>
);

const ItemList = ({ items, onDelete }) => (
    <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
            <span key={index} className="inline-flex items-center px-3 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                {item}
                <button
                    onClick={() => onDelete(item)}
                    className="ml-2 text-stone-400 hover:text-red-500 font-bold"
                >
                    ×
                </button>
            </span>
        ))}
        {items.length === 0 && <span className="text-stone-400 italic text-sm">Inga tillagda än.</span>}
    </div>
);

export default Profile;
