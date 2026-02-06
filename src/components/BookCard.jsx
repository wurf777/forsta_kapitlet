import React from 'react';
import { Star, Book } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const getStatusClass = (status) => {
    if (status === 'Läst') return 'status-badge-read';
    if (status === 'Läser') return 'status-badge-reading';
    return 'status-badge-queued';
};

const BookCard = ({ id, title, author, cover, rating, progress, status, vibe, tempo }) => {
    const { t } = useLanguage();

    return (
        <Link to={`/book/${id}`} className="card flex flex-col h-full group hover:no-underline">
            <div className="relative aspect-[2/3] bg-stone-200 rounded-xl mb-4 overflow-hidden book-tilt">
                {cover ? (
                    <img src={cover} alt={title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400 bg-stone-100">
                        <Book size={48} />
                    </div>
                )}
                {status && (
                    <div className={`absolute top-2 right-2 status-badge ${getStatusClass(status)}`}>
                        {t(`status.${status}`) || status}
                    </div>
                )}
            </div>

            <div className="flex-grow">
                <h3 className="font-heading text-xl text-gray-900 leading-snug mb-1 line-clamp-2" title={title}>{title}</h3>
                <p className="text-sm text-stone-600 mb-2 truncate">{author}</p>

                {(vibe || tempo) && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                        {vibe && (
                            <span className="text-[10px] px-2 py-0.5 bg-warm-light text-warm-dark rounded-full border border-warm/20 truncate max-w-full">
                                ✨ {vibe}
                            </span>
                        )}
                        {tempo && (
                            <span className="text-[10px] px-2 py-0.5 bg-accent-light text-accent-dark rounded-full border border-accent/20">
                                ⚡ {tempo}/5
                            </span>
                        )}
                    </div>
                )}

                {rating > 0 && (
                    <div className="flex items-center gap-1 text-highlight mb-3">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} fill={i < rating ? 'currentColor' : 'none'} />
                        ))}
                    </div>
                )}
            </div>

            {progress !== undefined && (
                <div className="mt-auto pt-3">
                    <div className="w-full bg-stone-200 rounded-full h-1.5 mb-1">
                        <div className="bg-accent h-1.5 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs text-stone-500 text-right">{progress}%</p>
                </div>
            )}
        </Link>
    );
};

export default BookCard;
