import React from 'react';
import { Download, Printer } from 'lucide-react';
import { api } from '../../../services/api';

const ExportButton = ({ section, filters, userHash }) => {
    const handleCsvExport = () => {
        const exportSection = section === 'overview' ? 'feature_frequency' : section === 'user_timeline' ? 'events' : section;
        const params = { ...filters };
        if (userHash) params.user_hash = userHash;
        const url = api.admin.analytics.exportUrl(exportSection, params);

        // Open in new tab with auth — use fetch to handle auth header
        window.open(url, '_blank');
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="flex items-center gap-1">
            <button
                onClick={handleCsvExport}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                title="Exportera CSV"
            >
                <Download size={14} />
                CSV
            </button>
            <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors print:hidden"
                title="Skriv ut / PDF"
            >
                <Printer size={14} />
                PDF
            </button>
        </div>
    );
};

export default ExportButton;
