import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles } from 'lucide-react';
import { sendMessageToBibbi } from '../services/gemini';
import { getUserProfile } from '../services/storage';

const ChatInterface = ({ modes }) => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'bibbi',
            text: 'Hej! Jag är Bibbi. Jag älskar böcker och att hitta rätt bok till rätt person. Vad är du sugen på att läsa idag?'
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
                    <h3 className="font-heading font-bold text-gray-900">Bibbi</h3>
                    <p className="text-xs text-accent font-medium">Din personliga bokguide</p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {messages.map((msg) => (
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
                ))}
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
                        placeholder="Skriv till Bibbi..."
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
