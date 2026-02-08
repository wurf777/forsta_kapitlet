import React from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const RATING_COLORS = ['#EF4444', '#F97316', '#EAB308', '#84CC16', '#22C55E'];

const BooksSection = ({ data }) => {
    const { most_added = [], top_search_terms = [], rating_distribution = [], popular_authors = [], read_conversion } = data;

    const ratingData = [1, 2, 3, 4, 5].map((r) => {
        const found = rating_distribution.find((d) => parseInt(d.rating) === r);
        return { rating: `${r} ★`, count: found ? parseInt(found.count) : 0, fill: RATING_COLORS[r - 1] };
    });

    const conversionData = read_conversion ? [
        { name: 'Vill läsa', value: parseInt(read_conversion.status_want) || 0, color: '#94A3B8' },
        { name: 'Läser', value: parseInt(read_conversion.status_reading) || 0, color: '#D69E2E' },
        { name: 'Läst', value: parseInt(read_conversion.status_read) || 0, color: '#2C7A7B' },
    ] : [];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Most Added Books */}
                {most_added.length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Mest tillagda böcker</h3>
                        <div className="space-y-2">
                            {most_added.map((book, i) => (
                                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                    <div className="min-w-0">
                                        <div className="text-sm font-medium text-gray-900 truncate">{book.title || 'Okänd titel'}</div>
                                        <div className="text-xs text-gray-500">{book.author || 'Okänd författare'}</div>
                                    </div>
                                    <span className="text-sm font-bold text-accent ml-2">{book.add_count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Top Search Terms */}
                {top_search_terms.length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Populäraste söktermerna</h3>
                        <div className="space-y-2">
                            {top_search_terms.map((term, i) => (
                                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                    <span className="text-sm text-gray-700">"{term.term}"</span>
                                    <span className="text-sm font-bold text-indigo-600 ml-2">{term.count} sökningar</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Rating Distribution */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Betygsfördelning</h3>
                    {ratingData.some((d) => d.count > 0) ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={ratingData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="rating" tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="count" name="Antal" radius={[4, 4, 0, 0]}>
                                    {ratingData.map((entry, i) => (
                                        <Cell key={i} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-gray-500">Inga betyg ännu.</p>
                    )}
                </div>

                {/* Read Conversion */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Läskonvertering</h3>
                    {conversionData.some((d) => d.value > 0) ? (
                        <>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={conversionData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="56%"
                                        outerRadius={70}
                                        label={({ name, value }) => `${name}: ${value}`}
                                    >
                                        {conversionData.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            {read_conversion && (
                                <p className="text-center text-sm text-gray-600 mt-2">
                                    {read_conversion.read_rate_percent}% av tillagda böcker har lästs klart
                                </p>
                            )}
                        </>
                    ) : (
                        <p className="text-sm text-gray-500">Ingen data ännu.</p>
                    )}
                </div>
            </div>

            {/* Popular Authors */}
            {popular_authors.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Populäraste författarna</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Författare</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unika böcker</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Gånger tillagd</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {popular_authors.map((author, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 text-sm text-gray-900">{author.author}</td>
                                        <td className="px-4 py-2 text-sm text-gray-600">{author.book_count}</td>
                                        <td className="px-4 py-2 text-sm font-medium text-accent">{author.add_count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BooksSection;
