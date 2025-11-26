import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { BookOpen, MessageCircle, Library, User } from 'lucide-react';

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-2 text-accent hover:text-accent-dark transition-colors">
            <BookOpen size={32} />
            <span className="font-heading text-2xl font-bold text-gray-800">Första Kapitlet</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-gray-600 hover:text-accent font-medium">Hem</Link>
            <Link to="/books" className="text-gray-600 hover:text-accent font-medium">Mina Böcker</Link>
            <Link to="/recommendations" className="text-gray-600 hover:text-accent font-medium">Rekommendationer</Link>
          </nav>

          <div className="flex items-center gap-4">
            <button className="btn btn-secondary flex items-center gap-2">
              <MessageCircle size={20} />
              <span>Prata med Bibbi</span>
            </button>
            <button className="p-2 text-gray-400 hover:text-accent rounded-full">
              <User size={24} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow container py-8">
        <Outlet />
      </main>

      <footer className="bg-gray-100 border-t border-gray-200 mt-auto">
        <div className="container py-8 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} Första Kapitlet. Skapad för bokälskare.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
