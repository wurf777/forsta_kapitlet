import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { BookOpen, MessageCircle, Library, User, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import ChatInterface from './ChatInterface';
import { useBibbi } from '../context/BibbiContext';

const Layout = () => {
  const { t } = useLanguage();
  const { isOpen, toggleChat, closeChat, openChat, isDocked } = useBibbi();

  return (
    <div className="min-h-screen flex flex-col relative">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-2 text-accent hover:text-accent-dark transition-colors">
            <BookOpen size={32} />
            <span className="font-heading text-2xl font-bold text-gray-800">Första Kapitlet</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-gray-600 hover:text-accent font-medium">{t('nav.home')}</Link>
            <Link to="/books" className="text-gray-600 hover:text-accent font-medium">{t('nav.myBooks')}</Link>
            <Link to="/recommendations" className="text-gray-600 hover:text-accent font-medium">{t('nav.recommendations')}</Link>
          </nav>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <button
              onClick={openChat}
              className="btn btn-secondary flex items-center gap-2"
            >
              <MessageCircle size={20} />
              <span>{t('nav.talkToBibbi')}</span>
            </button>
            <Link to="/profile" className="p-2 text-gray-400 hover:text-accent rounded-full">
              <User size={24} />
            </Link>
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

      {/* Global Bibbi Chat - Only show if not docked */}
      {!isDocked && (
        <>
          <div className={`fixed bottom-6 right-6 z-50 flex flex-col items-end transition-all duration-300 ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
            <div className="mb-4 w-[400px] max-w-[calc(100vw-3rem)] shadow-2xl rounded-xl overflow-hidden">
              {isOpen && <ChatInterface onClose={closeChat} className="h-[600px] max-h-[calc(100vh-8rem)]" />}
            </div>
          </div>

          {/* Floating Action Button (FAB) */}
          {!isOpen && (
            <button
              onClick={toggleChat}
              className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-accent text-white rounded-full shadow-lg flex items-center justify-center hover:bg-accent-dark hover:scale-110 transition-all duration-300 group"
              aria-label="Prata med Bibbi"
            >
              <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
              <span className="absolute -top-10 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Prata med Bibbi
              </span>
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default Layout;
