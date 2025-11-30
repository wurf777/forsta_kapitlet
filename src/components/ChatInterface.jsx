import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles, Check, X } from 'lucide-react';
import { sendMessageToBibbi, analyzeChatForPreferences } from '../services/gemini';
import { getUserProfile, updateUserProfile } from '../services/storage';
import { useLanguage } from '../context/LanguageContext';

const ChatInterface = ({ modes }) => {
    const { t } = useLanguage();
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'bibbi',
            text: t('chat.welcome')
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleAcceptSuggestion = (suggestion, messageId) => {
        const current = getUserProfile();
        const newProfile = {
            ...current,
            favoriteAuthors: [...new Set([...(current.favoriteAuthors || []), ...(suggestion.favoriteAuthors || [])])],
            favoriteGenres: [...new Set([...(current.favoriteGenres || []), ...(suggestion.favoriteGenres || [])])],
            blocklist: {
                authors: [...new Set([...(current.blocklist?.authors || []), ...(suggestion.blocklist?.authors || [])])],
                genres: [...new Set([...(current.blocklist?.genres || []), ...(suggestion.blocklist?.genres || [])])],
                books: current.blocklist?.books || []
            }
        };

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

            const responseText = await sendMessageToBibbi(input, messages, modes, profile);
            const bibbiMessage = { id: Date.now() + 1, sender: 'bibbi', text: responseText };

            setMessages(prev => [...prev, bibbiMessage]);

            // Analyze for preferences in background
            // We construct the history manually to ensure we have the latest messages including the ones just added
            const historyForAnalysis = [...messages, userMessage, bibbiMessage];

            analyzeChatForPreferences(historyForAnalysis).then(suggestion => {
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
        <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-accent/10 p-4 border-b border-accent/20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white shadow-sm">
                    <Sparkles size={20} />
                </div>
                <div>
                    <h3 className="font-heading font-bold text-gray-900">{t('chat.bibbiName')}</h3>
                    <p className="text-xs text-accent font-medium">{t('chat.bibbiRole')}</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {messages.map((msg) => {
                    if (msg.sender === 'system' && msg.type === 'suggestion') {
                        return (
                            <div key={msg.id} className="flex justify-center my-2">
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 max-w-[80%] shadow-sm">
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

                                            {/* Show specific changes */}
                                            <div className="mb-3 bg-white/50 rounded p-2 text-xs text-blue-900">
                                                {msg.data.favoriteAuthors?.length > 0 && (
                                                    <div className="flex gap-1 mb-1">
                                                        <span>❤️</span>
                                                        <span className="font-semibold">Lägg till författare:</span>
                                                        <span>{msg.data.favoriteAuthors.join(', ')}</span>
                                                    </div>
                                                )}
                                                {msg.data.favoriteGenres?.length > 0 && (
                                                    <div className="flex gap-1 mb-1">
                                                        <span>❤️</span>
                                                        <span className="font-semibold">Lägg till genrer:</span>
                                                        <span>{msg.data.favoriteGenres.join(', ')}</span>
                                                    </div>
                                                )}
                                                {msg.data.blocklist?.authors?.length > 0 && (
                                                    <div className="flex gap-1 mb-1">
                                                        <span>🚫</span>
                                                        <span className="font-semibold">Blockera författare:</span>
                                                        <span>{msg.data.blocklist.authors.join(', ')}</span>
                                                    </div>
                                                )}
                                                {msg.data.blocklist?.genres?.length > 0 && (
                                                    <div className="flex gap-1 mb-1">
                                                        <span>🚫</span>
                                                        <span className="font-semibold">Blockera genrer:</span>
                                                        <span>{msg.data.blocklist.genres.join(', ')}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {!msg.accepted ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleAcceptSuggestion(msg.data, msg.id)}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                                                    >
                                                        <Check size={14} />
                                                        Ja, spara ändringar
                                                    </button>
                                                    <button
                                                        onClick={() => setMessages(prev => prev.filter(m => m.id !== msg.id))}
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
                    }

                    return (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${msg.sender === 'user'
                                    ? 'bg-accent text-white rounded-br-none'
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                    }`}
                            >
                                <p className="text-sm leading-relaxed">{msg.text}</p>
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
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t('chat.placeholder')}
                        className="flex-grow px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className="btn btn-primary px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatInterface;
