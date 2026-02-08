import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MessageCircle, Sparkles, ArrowRight } from 'lucide-react';

const BibbiSection = ({ data }) => {
    const { over_time = [], preference_distribution = {}, conversion = {} } = data;

    const timeData = over_time.map((d) => ({
        date: d.date?.substring(5),
        chatt: parseInt(d.chat_count) || 0,
        rekommendationer: parseInt(d.recommendation_count) || 0,
    }));

    return (
        <div className="space-y-6">
            {/* Conversion Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ConversionCard
                    icon={MessageCircle}
                    title="Chatt → Bok tillagd"
                    sessions={conversion.sessions_with_chat || 0}
                    conversions={conversion.chat_to_add || 0}
                    rate={conversion.chat_conversion_percent || 0}
                    color="#2C7A7B"
                />
                <ConversionCard
                    icon={Sparkles}
                    title="Rekommendationer → Bok tillagd"
                    sessions={conversion.sessions_with_recs || 0}
                    conversions={conversion.recs_to_add || 0}
                    rate={conversion.recs_conversion_percent || 0}
                    color="#D69E2E"
                />
            </div>

            {/* Usage Over Time */}
            {timeData.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Bibbi-användning över tid</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={timeData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="chatt" stroke="#2C7A7B" strokeWidth={2} name="Chattmeddelanden" />
                            <Line type="monotone" dataKey="rekommendationer" stroke="#D69E2E" strokeWidth={2} name="Rekommendationer" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Preference Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <PreferenceChart title="Tempo" data={preference_distribution.tempo} color="#2C7A7B" />
                <PreferenceChart title="Stämning" data={preference_distribution.mood} color="#D69E2E" />
                <PreferenceChart title="Längd" data={preference_distribution.length} color="#6366F1" />
            </div>
        </div>
    );
};

const ConversionCard = ({ icon: Icon, title, sessions, conversions, rate, color }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
            <Icon size={18} style={{ color }} />
            <h4 className="font-medium text-gray-900 text-sm">{title}</h4>
        </div>
        <div className="flex items-center gap-3">
            <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{sessions}</div>
                <div className="text-xs text-gray-500">sessioner</div>
            </div>
            <ArrowRight size={16} className="text-gray-300" />
            <div className="text-center">
                <div className="text-2xl font-bold" style={{ color }}>{conversions}</div>
                <div className="text-xs text-gray-500">bok tillagd</div>
            </div>
            <div className="ml-auto text-right">
                <div className="text-xl font-bold" style={{ color }}>{rate}%</div>
                <div className="text-xs text-gray-500">konvertering</div>
            </div>
        </div>
    </div>
);

const PreferenceChart = ({ title, data, color }) => {
    if (!data || Object.keys(data).length === 0) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="font-medium text-gray-900 text-sm mb-3">{title}</h4>
                <p className="text-sm text-gray-500">Ingen data ännu.</p>
            </div>
        );
    }

    const chartData = [1, 2, 3, 4, 5].map((v) => ({
        value: String(v),
        count: parseInt(data[String(v)]) || 0,
    }));

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="font-medium text-gray-900 text-sm mb-3">{title}</h4>
            <ResponsiveContainer width="100%" height={120}>
                <BarChart data={chartData}>
                    <XAxis dataKey="value" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} hide />
                    <Tooltip />
                    <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]} name="Antal" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default BibbiSection;
