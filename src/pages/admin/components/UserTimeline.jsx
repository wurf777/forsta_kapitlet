import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, BookOpen, MessageCircle, Search, User, Settings } from 'lucide-react';

const CATEGORY_CONFIG = {
    auth: { label: 'Inloggning', icon: User, color: '#8B5CF6' },
    books: { label: 'Böcker', icon: BookOpen, color: '#2C7A7B' },
    search: { label: 'Sök', icon: Search, color: '#6366F1' },
    bibbi: { label: 'Bibbi', icon: MessageCircle, color: '#D69E2E' },
    profile: { label: 'Profil', icon: Settings, color: '#EC4899' },
};

const ACTION_LABELS = {
    login: 'Loggade in',
    register: 'Registrerade sig',
    logout: 'Loggade ut',
    add_to_library: 'Lade till bok',
    update_status: 'Uppdaterade bok',
    remove_from_library: 'Tog bort bok',
    search: 'Sökte',
    chat_message: 'Chattade med Bibbi',
    get_recommendations: 'Begärde rekommendationer',
    daily_tip: 'Fick dagligt tips',
    preference_change: 'Ändrade preferens',
    update_favorites: 'Uppdaterade favoriter',
    update_blocklist: 'Uppdaterade blocklista',
    toggle_format: 'Ändrade format',
    toggle_service: 'Ändrade tjänst',
};

const UserTimeline = ({ data, onBack }) => {
    const { events = [], feature_breakdown = [], first_seen, last_active, total_events } = data;

    const pieData = feature_breakdown.map((b) => ({
        name: CATEGORY_CONFIG[b.event_category]?.label || b.event_category,
        value: parseInt(b.count),
        color: CATEGORY_CONFIG[b.event_category]?.color || '#94A3B8',
    }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h3 className="font-semibold text-gray-900">Användartidslinje</h3>
                    <p className="text-sm text-gray-500">
                        Först sedd: {first_seen ? new Date(first_seen).toLocaleDateString('sv-SE') : '—'} |
                        Senast aktiv: {last_active ? new Date(last_active).toLocaleDateString('sv-SE') : '—'} |
                        Totalt: {total_events} händelser
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pie Chart */}
                {pieData.length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Funktionsfördelning</h4>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                    {pieData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Event List */}
                <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                        <h4 className="font-medium text-gray-900">Händelser ({events.length})</h4>
                    </div>
                    <div className="max-h-[600px] overflow-y-auto divide-y divide-gray-50">
                        {events.map((event) => {
                            const config = CATEGORY_CONFIG[event.event_category] || {};
                            const Icon = config.icon || User;
                            return (
                                <div key={event.id} className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (config.color || '#94A3B8') + '20' }}>
                                        <Icon size={14} style={{ color: config.color || '#94A3B8' }} />
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <div className="text-sm font-medium text-gray-900">
                                            {ACTION_LABELS[event.event_action] || event.event_action}
                                        </div>
                                        {event.event_data && Object.keys(event.event_data).length > 0 && (
                                            <div className="text-xs text-gray-500 mt-0.5">
                                                {formatEventData(event)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400 flex-shrink-0">
                                        {new Date(event.created_at).toLocaleString('sv-SE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            );
                        })}
                        {events.length === 0 && (
                            <div className="p-8 text-center text-gray-500">Inga händelser hittades.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

function formatEventData(event) {
    const d = event.event_data;
    if (!d) return null;

    if (d.book_title) return d.book_title + (d.author ? ` av ${d.author}` : '');
    if (d.status) return `Status: ${d.status}${d.rating ? `, Betyg: ${d.rating}` : ''}`;
    if (event.search_query) return `"${event.search_query}" — ${d.result_count ?? 0} resultat`;
    if (d.type && d.new_value) return `${d.type}: ${d.old_value} → ${d.new_value}`;
    if (d.field && d.value) return `${d.action === 'add' ? '+' : '-'} ${d.value}`;
    if (d.format) return `${d.format}: ${d.enabled ? 'på' : 'av'}`;
    if (d.service) return `${d.service}: ${d.enabled ? 'på' : 'av'}`;

    return null;
}

export default UserTimeline;
