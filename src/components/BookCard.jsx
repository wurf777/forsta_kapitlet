import React from 'react';
import { Star, Book } from 'lucide-react';
import { Link } from 'react-router-dom';

const BookCard = ({ id, title, author, cover, rating, progress, status, vibe, tempo }) => {
    return (
        <Link to={`/book/${id}`} className="card flex flex-col h-full group hover:no-underline">
            <div className="relative aspect-[2/3] bg-gray-200 rounded-md mb-4 overflow-hidden">
                {cover ? (
                    <img src={cover} alt={title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                        <Book size={48} />
                    </div>
                )}
                {status && (
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold text-gray-700 shadow-sm">
                        {status}
                    </div>
                )}
            </div>

            <div className="flex-grow">
                <h3 className="font-bold text-gray-900 leading-tight mb-1">{title}</h3>
                <p className="text-sm text-gray-600 mb-2">{author}</p>

                {/* AI Metadata Badges */}
                {(vibe || tempo) && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {vibe && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100 truncate max-w-full">
                                ✨ {vibe}
                            </span>
                        )}
                        {tempo && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-stone-100 text-stone-600 rounded border border-stone-200">
                                ⚡ {tempo}/5
                            </span>
                        )}
                    </div>
                )}

                {rating > 0 && (
                    <div className="flex items-center gap-1 text-yellow-500 mb-3">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} fill={i < rating ? "currentColor" : "none"} />
                        ))}
                    </div>
                )}
            </div>

            {progress !== undefined && (
                <div className="mt-auto pt-4">
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                        <div className="bg-accent h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 text-right">{progress}%</p>
                </div>
            )}
        </Link>
    );
};

export default BookCard;
