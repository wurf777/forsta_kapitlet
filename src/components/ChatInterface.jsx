import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles, Check, X } from 'lucide-react';
import { sendMessageToBibbi, analyzeChatForPreferences, sendPreferenceReaction, PREFERENCE_MAPS } from '../services/gemini';
import { getUserProfile, updateUserProfile } from '../services/storage';
import { track } from '../services/analytics';
import { useLanguage } from '../context/LanguageContext';
import { useBibbi } from '../context/BibbiContext';
import ChatMessage from './ChatMessage';

const ChatInterface = ({ className, onClose }) => {
    const { t } = useLanguage();
    const { messages, setMessages, modes, setModes, context } = useBibbi();
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesContainerRef = useRef(null);

    const handlePreferenceChange = async (type, newValue) => {
        const oldValue = modes[type];
        if (oldValue === newValue) return;

        const oldLabel = PREFERENCE_MAPS[type]?.[oldValue] || oldValue;
        const newLabel = PREFERENCE_MAPS[type]?.[newValue] || newValue;
        const typeName = { tempo: 'Tempo', mood: 'Stämning', length: 'Längd' }[type] || type;

        // Update modes
        const updatedModes = { ...modes, [type]: newValue };
        setModes(updatedModes);
        track('bibbi', 'preference_change', { type, old_value: oldValue, new_value: newValue });

        // Add system message showing the change
        const changeMsg = {
            id: Date.now(),
            sender: 'system',
            type: 'preference-change',
            text: `${typeName}: ${oldLabel} → ${newLabel}`
        };
        setMessages(prev => [...prev, changeMsg]);

        // Get Bibbi's reaction
        setIsTyping(true);
        try {
            const profile = getUserProfile();
            const responseText = await sendPreferenceReaction(type, oldValue, newValue, messages, updatedModes, profile, context);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'bibbi',
                text: responseText
            }]);
        } catch (error) {
            console.error('Error getting preference reaction:', error);
        } finally {
            setIsTyping(false);
        }
    };

    // Initialize welcome message if empty
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                {
                    id: 1,
                    sender: 'bibbi',
                    text: t('chat.welcome')
                }
            ]);
        }
    }, [messages.length, setMessages, t]);

    const scrollToBottom = () => {
        const container = messagesContainerRef.current;
        if (!container) return;
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleAcceptSuggestion = (suggestion, messageId, selectedChanges) => {
        const current = getUserProfile();
        let newProfile = { ...current };

        // Handle Add to Favorites
        if (selectedChanges.addAuthors) {
            newProfile.favoriteAuthors = [...new Set([...(current.favoriteAuthors || []), ...(suggestion.favoriteAuthors || [])])];
        }
        if (selectedChanges.addGenres) {
            newProfile.favoriteGenres = [...new Set([...(current.favoriteGenres || []), ...(suggestion.favoriteGenres || [])])];
        }

        // Handle Remove from Favorites
        if (selectedChanges.removeAuthors && suggestion.removeFromFavorites?.authors) {
            newProfile.favoriteAuthors = (newProfile.favoriteAuthors || []).filter(a => !suggestion.removeFromFavorites.authors.includes(a));
        }
        if (selectedChanges.removeGenres && suggestion.removeFromFavorites?.genres) {
            newProfile.favoriteGenres = (newProfile.favoriteGenres || []).filter(g => !suggestion.removeFromFavorites.genres.includes(g));
        }

        // Handle Blocklist
        if (selectedChanges.blockAuthors) {
            newProfile.blocklist = {
                ...newProfile.blocklist,
                authors: [...new Set([...(current.blocklist?.authors || []), ...(suggestion.blocklist?.authors || [])])]
            };
        }
        if (selectedChanges.blockGenres) {
            newProfile.blocklist = {
                ...newProfile.blocklist,
                genres: [...new Set([...(current.blocklist?.genres || []), ...(suggestion.blocklist?.genres || [])])]
            };
        }

        // Handle Remove from Blocklist
        if (selectedChanges.unblockAuthors && suggestion.removeFromBlocklist?.authors) {
            newProfile.blocklist = {
                ...newProfile.blocklist,
                authors: (newProfile.blocklist?.authors || []).filter(a => !suggestion.removeFromBlocklist.authors.includes(a))
            };
        }
        if (selectedChanges.unblockGenres && suggestion.removeFromBlocklist?.genres) {
            newProfile.blocklist = {
                ...newProfile.blocklist,
                genres: (newProfile.blocklist?.genres || []).filter(g => !suggestion.removeFromBlocklist.genres.includes(g))
            };
        }

        updateUserProfile(newProfile);

        setMessages(prev => prev.map(msg =>
            msg.id === messageId
                ? { ...msg, accepted: true }
                : msg
        ));
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { id: Date.now(), sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        try {
            // Get latest profile data
            const profile = getUserProfile();

            const responseText = await sendMessageToBibbi(input, messages, modes, profile, context);
            const bibbiMessage = { id: Date.now() + 1, sender: 'bibbi', text: responseText };

            setMessages(prev => [...prev, bibbiMessage]);

            // Analyze for preferences in background
            const historyForAnalysis = [...messages, userMessage, bibbiMessage];

            analyzeChatForPreferences(historyForAnalysis, profile).then(suggestion => {
                if (suggestion) {
                    setMessages(current => [...current, {
                        id: Date.now(),
                        sender: 'system',
                        type: 'suggestion',
                        data: suggestion
                    }]);
                }
            });

        } catch (error) {
            console.error("Error talking to Bibbi:", error);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className={`flex flex-col bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden ${className || 'h-[500px] md:h-[600px]'}`}>
            {/* Header */}
            <div className="bg-accent/10 p-3 md:p-4 border-b border-accent/20 flex items-center justify-between gap-2 md:gap-3">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-accent flex items-center justify-center text-white shadow-sm flex-shrink-0">
                        <Sparkles size={18} className="md:w-5 md:h-5" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-heading font-bold text-gray-900 text-sm md:text-base truncate">{t('chat.bibbiName')}</h3>
                        <p className="text-xs text-accent font-medium truncate">
                            {context?.type === 'book' ? `Pratar om: ${context.data.title}` : t('chat.bibbiRole')}
                        </p>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-black/5 transition-colors flex-shrink-0">
                        <X size={18} className="md:w-5 md:h-5" />
                    </button>
                )}
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {messages.map((msg) => {
                    if (msg.sender === 'system' && msg.type === 'suggestion') {
                        return <SuggestionCard key={msg.id} msg={msg} onAccept={handleAcceptSuggestion} onDismiss={() => setMessages(prev => prev.filter(m => m.id !== msg.id))} />;
                    }

                    if (msg.sender === 'system' && msg.type === 'preference-change') {
                        return (
                            <div key={msg.id} className="flex justify-center">
                                <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                    {msg.text}
                                </span>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${msg.sender === 'user'
                                    ? 'bg-accent text-white rounded-br-none'
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                    }`}
                            >
                                <ChatMessage
                                    text={msg.text}
                                    sender={msg.sender}
                                    modes={modes}
                                    onPreferenceChange={handlePreferenceChange}
                                />
                            </div>
                        </div>
                    );
                })}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t('chat.placeholder')}
                        className="flex-grow px-4 py-2 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-sm"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent/90 transition-colors shadow-sm"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </form>
        </div>
    );
};

const SuggestionCard = ({ msg, onAccept, onDismiss }) => {
    const [selected, setSelected] = useState({
        addAuthors: true,
        addGenres: true,
        removeAuthors: true,
        removeGenres: true,
        blockAuthors: true,
        blockGenres: true,
        unblockAuthors: true,
        unblockGenres: true
    });

    const toggle = (key) => setSelected(prev => ({ ...prev, [key]: !prev[key] }));

    const hasAddAuthors = msg.data.favoriteAuthors?.length > 0;
    const hasAddGenres = msg.data.favoriteGenres?.length > 0;
    const hasRemoveAuthors = msg.data.removeFromFavorites?.authors?.length > 0;
    const hasRemoveGenres = msg.data.removeFromFavorites?.genres?.length > 0;
    const hasBlockAuthors = msg.data.blocklist?.authors?.length > 0;
    const hasBlockGenres = msg.data.blocklist?.genres?.length > 0;
    const hasUnblockAuthors = msg.data.removeFromBlocklist?.authors?.length > 0;
    const hasUnblockGenres = msg.data.removeFromBlocklist?.genres?.length > 0;

    return (
        <div className="flex justify-center my-2">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 max-w-[90%] shadow-sm w-full">
                <div className="flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                        <Sparkles size={16} />
                    </div>
                    <div className="flex-grow">
                        <p className="text-sm text-blue-900 font-medium mb-1">
                            Bibbi har ett förslag!
                        </p>
                        <p className="text-sm text-blue-800 mb-3">
                            {msg.data.reason}
                        </p>

                        {/* Specific Changes with Checkboxes */}
                        <div className="mb-3 space-y-2">
                            {hasAddAuthors && (
                                <label className="flex items-start gap-2 text-xs text-blue-900 cursor-pointer bg-white/50 p-2 rounded hover:bg-white/80 transition-colors">
                                    <input type="checkbox" checked={selected.addAuthors} onChange={() => toggle('addAuthors')} className="mt-0.5 rounded text-blue-600 focus:ring-blue-400" />
                                    <div>
                                        <span className="font-semibold">Lägg till i favoriter: </span>
                                        <span>{msg.data.favoriteAuthors.join(', ')}</span>
                                    </div>
                                </label>
                            )}
                            {hasAddGenres && (
                                <label className="flex items-start gap-2 text-xs text-blue-900 cursor-pointer bg-white/50 p-2 rounded hover:bg-white/80 transition-colors">
                                    <input type="checkbox" checked={selected.addGenres} onChange={() => toggle('addGenres')} className="mt-0.5 rounded text-blue-600 focus:ring-blue-400" />
                                    <div>
                                        <span className="font-semibold">Lägg till i favoriter: </span>
                                        <span>{msg.data.favoriteGenres.join(', ')}</span>
                                    </div>
                                </label>
                            )}

                            {hasRemoveAuthors && (
                                <label className="flex items-start gap-2 text-xs text-blue-900 cursor-pointer bg-white/50 p-2 rounded hover:bg-white/80 transition-colors">
                                    <input type="checkbox" checked={selected.removeAuthors} onChange={() => toggle('removeAuthors')} className="mt-0.5 rounded text-blue-600 focus:ring-blue-400" />
                                    <div>
                                        <span className="font-semibold text-orange-700">Ta bort från favoriter: </span>
                                        <span>{msg.data.removeFromFavorites.authors.join(', ')}</span>
                                    </div>
                                </label>
                            )}
                            {hasRemoveGenres && (
                                <label className="flex items-start gap-2 text-xs text-blue-900 cursor-pointer bg-white/50 p-2 rounded hover:bg-white/80 transition-colors">
                                    <input type="checkbox" checked={selected.removeGenres} onChange={() => toggle('removeGenres')} className="mt-0.5 rounded text-blue-600 focus:ring-blue-400" />
                                    <div>
                                        <span className="font-semibold text-orange-700">Ta bort från favoriter: </span>
                                        <span>{msg.data.removeFromFavorites.genres.join(', ')}</span>
                                    </div>
                                </label>
                            )}

                            {hasBlockAuthors && (
                                <label className="flex items-start gap-2 text-xs text-blue-900 cursor-pointer bg-white/50 p-2 rounded hover:bg-white/80 transition-colors">
                                    <input type="checkbox" checked={selected.blockAuthors} onChange={() => toggle('blockAuthors')} className="mt-0.5 rounded text-blue-600 focus:ring-blue-400" />
                                    <div>
                                        <span className="font-semibold text-red-600">Blockera författare: </span>
                                        <span>{msg.data.blocklist.authors.join(', ')}</span>
                                    </div>
                                </label>
                            )}
                            {hasBlockGenres && (
                                <label className="flex items-start gap-2 text-xs text-blue-900 cursor-pointer bg-white/50 p-2 rounded hover:bg-white/80 transition-colors">
                                    <input type="checkbox" checked={selected.blockGenres} onChange={() => toggle('blockGenres')} className="mt-0.5 rounded text-blue-600 focus:ring-blue-400" />
                                    <div>
                                        <span className="font-semibold text-red-600">Blockera genrer: </span>
                                        <span>{msg.data.blocklist.genres.join(', ')}</span>
                                    </div>
                                </label>
                            )}

                            {hasUnblockAuthors && (
                                <label className="flex items-start gap-2 text-xs text-blue-900 cursor-pointer bg-white/50 p-2 rounded hover:bg-white/80 transition-colors">
                                    <input type="checkbox" checked={selected.unblockAuthors} onChange={() => toggle('unblockAuthors')} className="mt-0.5 rounded text-blue-600 focus:ring-blue-400" />
                                    <div>
                                        <span className="font-semibold text-green-600">Ta bort från blocklista: </span>
                                        <span>{msg.data.removeFromBlocklist.authors.join(', ')}</span>
                                    </div>
                                </label>
                            )}
                            {hasUnblockGenres && (
                                <label className="flex items-start gap-2 text-xs text-blue-900 cursor-pointer bg-white/50 p-2 rounded hover:bg-white/80 transition-colors">
                                    <input type="checkbox" checked={selected.unblockGenres} onChange={() => toggle('unblockGenres')} className="mt-0.5 rounded text-blue-600 focus:ring-blue-400" />
                                    <div>
                                        <span className="font-semibold text-green-600">Ta bort från blocklista: </span>
                                        <span>{msg.data.removeFromBlocklist.genres.join(', ')}</span>
                                    </div>
                                </label>
                            )}
                        </div>

                        {!msg.accepted ? (
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={() => onAccept(msg.data, msg.id, selected)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    <Check size={14} />
                                    Ja, spara
                                </button>
                                <button
                                    onClick={onDismiss}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-white text-blue-600 border border-blue-200 text-xs font-medium rounded-md hover:bg-blue-50 transition-colors"
                                >
                                    <X size={14} />
                                    Nej tack
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                                <Check size={16} />
                                <span>Profil uppdaterad!</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
