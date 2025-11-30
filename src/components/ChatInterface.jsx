import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles, Check, X } from 'lucide-react';
import { sendMessageToBibbi, analyzeChatForPreferences } from '../services/gemini';
import { getUserProfile, updateUserProfile } from '../services/storage';
import { useLanguage } from '../context/LanguageContext';
import { useBibbi } from '../context/BibbiContext';

const ChatInterface = ({ className, onClose }) => {
    const { t } = useLanguage();
    const { messages, setMessages, modes, context } = useBibbi();
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

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
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

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

            // Prepare context for Bibbi
            // If we have a specific book context, we should probably include it in the message or as a separate argument
            // For now, let's append it to the message if it's a book context and it's the first message about it?
            // Or better, let's update sendMessageToBibbi to accept 'context' object.

            // For now, let's pass the context object to sendMessageToBibbi
            // We need to update sendMessageToBibbi signature or handle it here.
            // Let's assume we will update sendMessageToBibbi to take 'context' as an argument.

            const responseText = await sendMessageToBibbi(input, messages, modes, profile, context);
            const bibbiMessage = { id: Date.now() + 1, sender: 'bibbi', text: responseText };

            setMessages(prev => [...prev, bibbiMessage]);

            // Analyze for preferences in background
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
        <div className={`flex flex-col bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden ${className || 'h-[600px]'}`}>
            {/* Header */}
            <div className="bg-accent/10 p-4 border-b border-accent/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white shadow-sm">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3 className="font-heading font-bold text-gray-900">{t('chat.bibbiName')}</h3>
                        <p className="text-xs text-accent font-medium">
                            {context?.type === 'book' ? `Pratar om: ${context.data.title}` : t('chat.bibbiRole')}
                        </p>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-black/5 transition-colors">
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {messages.map((msg) => {
                    if (msg.sender === 'system' && msg.type === 'suggestion') {
                        return (
                            <div key={msg.id} className="flex justify-center my-2">
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 max-w-[90%] shadow-sm">
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
                                                <div className="flex gap-2 flex-wrap">
                                                    <button
                                                        onClick={() => handleAcceptSuggestion(msg.data, msg.id)}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                                                    >
                                                        <Check size={14} />
                                                        Ja, spara
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
                                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${msg.sender === 'user'
                                    ? 'bg-accent text-white rounded-br-none'
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                    }`}
                            >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
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

export default ChatInterface;
