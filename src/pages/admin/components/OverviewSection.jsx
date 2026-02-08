import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, Activity, TrendingUp } from 'lucide-react';

const CATEGORY_LABELS = {
    books: 'Böcker',
    bibbi: 'Bibbi',
    search: 'Sök',
    profile: 'Profil',
    auth: 'Inloggning',
};

const CATEGORY_COLORS = {
    books: '#2C7A7B',
    bibbi: '#D69E2E',
    search: '#6366F1',
    profile: '#EC4899',
    auth: '#8B5CF6',
};

const OverviewSection = ({ data }) => {
    const { active_users, feature_frequency, activity_trend } = data;

    const frequencyData = (feature_frequency || []).map((f) => ({
        name: CATEGORY_LABELS[f.event_category] || f.event_category,
        count: parseInt(f.count),
        color: CATEGORY_COLORS[f.event_category] || '#94A3B8',
    }));

    const trendData = (activity_trend || []).map((t) => ({
        date: t.date?.substring(5), // MM-DD
        count: parseInt(t.count),
    }));

    return (
        <div className="space-y-6">
            {/* Active Users Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard icon={Users} label="Idag" value={active_users?.today ?? 0} />
                <StatCard icon={Activity} label="Senaste 7 dagarna" value={active_users?.week ?? 0} />
                <StatCard icon={TrendingUp} label="Senaste 30 dagarna" value={active_users?.month ?? 0} />
            </div>

            {/* Feature Frequency */}
            {frequencyData.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Funktionsanvändning</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={frequencyData} layout="vertical" margin={{ left: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="count" name="Antal" radius={[0, 4, 4, 0]}>
                                {frequencyData.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Activity Trend */}
            {trendData.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Aktivitetstrend</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Line type="monotone" dataKey="count" stroke="#2C7A7B" strokeWidth={2} dot={{ r: 3 }} name="Händelser" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
            <Icon size={24} className="text-accent" />
        </div>
        <div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{label}</div>
        </div>
    </div>
);

export default OverviewSection;
