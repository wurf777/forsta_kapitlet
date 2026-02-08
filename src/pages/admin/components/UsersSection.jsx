import React from 'react';
import { ChevronRight } from 'lucide-react';

const CATEGORY_LABELS = {
    books: 'Böcker',
    bibbi: 'Bibbi',
    search: 'Sök',
    profile: 'Profil',
    auth: 'Inloggning',
};

const UsersSection = ({ data, onSelectUser }) => {
    const users = data?.users || [];

    if (users.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                Inga användare hittades för det valda datumintervallet.
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Användare ({users.length})</h3>
                <p className="text-sm text-gray-500">Klicka på en användare för att se deras tidslinje</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Användare</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Först sedd</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Senast aktiv</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Händelser</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mest aktiv</th>
                            <th className="px-4 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map((user) => (
                            <tr
                                key={user.user_hash}
                                onClick={() => onSelectUser(user.user_hash)}
                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.label}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                    {new Date(user.first_seen).toLocaleDateString('sv-SE')}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                    {new Date(user.last_active).toLocaleDateString('sv-SE')}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 font-medium">{user.total_events}</td>
                                <td className="px-4 py-3 text-sm">
                                    <span className="px-2 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                                        {CATEGORY_LABELS[user.top_category] || user.top_category}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-400">
                                    <ChevronRight size={16} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UsersSection;
