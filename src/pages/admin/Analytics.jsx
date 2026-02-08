import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, Users, BookOpen, Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import AnalyticsFilters from './components/AnalyticsFilters';
import OverviewSection from './components/OverviewSection';
import UsersSection from './components/UsersSection';
import UserTimeline from './components/UserTimeline';
import BooksSection from './components/BooksSection';
import BibbiSection from './components/BibbiSection';
import ExportButton from './components/ExportButton';

const SECTIONS = [
    { key: 'overview', label: 'Översikt', icon: BarChart3 },
    { key: 'users', label: 'Användare', icon: Users },
    { key: 'books', label: 'Böcker', icon: BookOpen },
    { key: 'bibbi', label: 'Bibbi', icon: Sparkles },
];

const Analytics = () => {
    const [section, setSection] = useState('overview');
    const [filters, setFilters] = useState({
        from: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
    });
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const currentSection = selectedUser ? 'user_timeline' : section;
            const params = { ...filters };
            if (selectedUser) params.user_hash = selectedUser;
            const result = await api.admin.analytics.dashboard(currentSection, params);
            setData(result);
        } catch (err) {
            setError(err.message || 'Kunde inte hämta data');
        } finally {
            setLoading(false);
        }
    }, [section, filters, selectedUser]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUserSelect = (userHash) => {
        setSelectedUser(userHash);
    };

    const handleBackFromTimeline = () => {
        setSelectedUser(null);
    };

    const activeSection = selectedUser ? 'user_timeline' : section;

    return (
        <div className="space-y-6">
            {/* Section Navigation */}
            <div className="flex flex-wrap items-center gap-2">
                {SECTIONS.map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => { setSection(key); setSelectedUser(null); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            section === key && !selectedUser
                                ? 'bg-accent text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        <Icon size={16} />
                        {label}
                    </button>
                ))}
                <div className="ml-auto flex items-center gap-2">
                    <ExportButton section={activeSection} filters={filters} userHash={selectedUser} />
                    <button onClick={fetchData} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <AnalyticsFilters filters={filters} onChange={setFilters} />

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {/* Content */}
            {loading && !data ? (
                <div className="text-center py-12 text-gray-500">Laddar data...</div>
            ) : data ? (
                <>
                    {activeSection === 'overview' && <OverviewSection data={data} />}
                    {activeSection === 'users' && <UsersSection data={data} onSelectUser={handleUserSelect} />}
                    {activeSection === 'user_timeline' && <UserTimeline data={data} onBack={handleBackFromTimeline} />}
                    {activeSection === 'books' && <BooksSection data={data} />}
                    {activeSection === 'bibbi' && <BibbiSection data={data} />}
                </>
            ) : null}
        </div>
    );
};

export default Analytics;
