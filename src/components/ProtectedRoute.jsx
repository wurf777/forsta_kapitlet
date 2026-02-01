import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/useAuth';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>;
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <LogIn size={48} className="mx-auto text-gray-300 mb-4" />
                    <h2 className="text-xl font-heading font-bold text-gray-900 mb-2">
                        Du behöver logga in
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Den här sidan kräver att du är inloggad. Gå till startsidan för att logga in.
                    </p>
                    <Link to="/" className="btn btn-primary px-6 py-2">
                        Till startsidan
                    </Link>
                </div>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;
