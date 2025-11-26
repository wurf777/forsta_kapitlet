import React from 'react';
import ChatInterface from '../components/ChatInterface';
import BookRecommendationsList from '../components/BookRecommendationsList';
import { Sparkles } from 'lucide-react';

const Recommendations = () => {
    return (
        <div className="space-y-8">
            {/* Page header */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 text-accent mb-2">
                    <Sparkles size={32} />
                </div>
                <h1 className="text-4xl font-heading text-gray-900">Prata med Bibbi</h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Bibbi är vår AI-expert på litteratur. Berätta vad du gillar, vad du känner för, eller be om något helt oväntat.
                </p>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left column - Book Recommendations */}
                <div className="lg:col-span-5">
                    <BookRecommendationsList />
                </div>

                {/* Right column - Chat Interface */}
                <div className="lg:col-span-7">
                    <div className="lg:sticky lg:top-6">
                        <ChatInterface />
                    </div>
                </div>
            </div>

            {/* Feature cards */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
                    <h3 className="font-bold text-gray-900 mb-2">Personligt</h3>
                    <p className="text-sm text-gray-600">Bibbi lär sig vad du gillar och ger bättre tips ju mer ni pratar.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
                    <h3 className="font-bold text-gray-900 mb-2">Utforskande</h3>
                    <p className="text-sm text-gray-600">Hitta nya genrer och författare som du kanske missat annars.</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
                    <h3 className="font-bold text-gray-900 mb-2">Alltid redo</h3>
                    <p className="text-sm text-gray-600">Oavsett tid på dygnet finns Bibbi här för att diskutera böcker.</p>
                </div>
            </div>
        </div>
    );
};

export default Recommendations;
