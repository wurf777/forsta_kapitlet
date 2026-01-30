import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { BookOpen, MessageCircle, Library, User, Sparkles, LogOut, LogIn, Menu, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/useAuth';
import LanguageSwitcher from './LanguageSwitcher';
import ChatInterface from './ChatInterface';
import AuthModal from './AuthModal';
import { useBibbi } from '../context/BibbiContext';

const Layout = () => {
  const { t } = useLanguage();
  const { isOpen, toggleChat, closeChat, openChat, isDocked } = useBibbi();
  const { user, isAuthenticated, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <div className="min-h-screen flex flex-col relative">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between py-4 px-4">
          <Link to="/" className="flex items-center gap-2 text-accent hover:text-accent-dark transition-colors">
            <BookOpen className="w-6 h-6 md:w-8 md:h-8" />
            <span className="font-heading text-lg md:text-2xl font-bold text-gray-800">Första Kapitlet</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-gray-600 hover:text-accent font-medium">{t('nav.home')}</Link>
            <Link to="/books" className="text-gray-600 hover:text-accent font-medium">{t('nav.myBooks')}</Link>
            <Link to="/recommendations" className="text-gray-600 hover:text-accent font-medium">{t('nav.recommendations')}</Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />
            <button
              onClick={openChat}
              className="btn btn-secondary flex items-center gap-2"
            >
              <MessageCircle size={20} />
              <span>{t('nav.talkToBibbi')}</span>
            </button>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-2 text-gray-700 hover:text-accent rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <User size={24} />
                  <span className="hidden md:inline font-medium">{user?.name || user?.email}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User size={16} className="inline mr-2" />
                      Profil
                    </Link>
                    <Link
                      to="/admin"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User size={16} className="inline mr-2" />
                      Admin
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={16} className="inline mr-2" />
                      Logga ut
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="btn btn-primary flex items-center gap-2"
              >
                <LogIn size={20} />
                <span>Logga in</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 text-gray-700 hover:text-accent hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="container px-4 py-4 flex flex-col space-y-3">
              <Link
                to="/"
                className="text-gray-600 hover:text-accent font-medium py-2"
                onClick={() => setShowMobileMenu(false)}
              >
                {t('nav.home')}
              </Link>
              <Link
                to="/books"
                className="text-gray-600 hover:text-accent font-medium py-2"
                onClick={() => setShowMobileMenu(false)}
              >
                {t('nav.myBooks')}
              </Link>
              <Link
                to="/recommendations"
                className="text-gray-600 hover:text-accent font-medium py-2"
                onClick={() => setShowMobileMenu(false)}
              >
                {t('nav.recommendations')}
              </Link>

              <div className="pt-3 border-t border-gray-200 space-y-3">
                <LanguageSwitcher />

                <button
                  onClick={() => {
                    openChat();
                    setShowMobileMenu(false);
                  }}
                  className="w-full btn btn-secondary flex items-center justify-center gap-2"
                >
                  <MessageCircle size={20} />
                  <span>{t('nav.talkToBibbi')}</span>
                </button>

                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 p-2 text-gray-700 hover:text-accent rounded-lg hover:bg-gray-100 transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <User size={20} />
                      <span>{user?.name || user?.email}</span>
                    </Link>
                    <Link
                      to="/admin"
                      className="flex items-center gap-2 p-2 text-gray-700 hover:text-accent rounded-lg hover:bg-gray-100 transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <User size={20} />
                      <span>Admin</span>
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setShowMobileMenu(false);
                      }}
                      className="w-full text-left px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                    >
                      <LogOut size={20} />
                      <span>Logga ut</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setShowAuthModal(true);
                      setShowMobileMenu(false);
                    }}
                    className="w-full btn btn-primary flex items-center justify-center gap-2"
                  >
                    <LogIn size={20} />
                    <span>Logga in</span>
                  </button>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-grow container py-8">
        <Outlet />
      </main>

      <footer className="bg-gray-100 border-t border-gray-200 mt-auto">
        <div className="container py-8 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} Första Kapitlet. Skapad för bokälskare.</p>
        </div>
      </footer>

      {/* Global Bibbi Chat - Only show if not docked and authenticated */}
      {!isDocked && isAuthenticated && (
        <>
          <div className={`fixed bottom-4 md:bottom-6 right-4 md:right-6 z-50 flex flex-col items-end transition-all duration-300 ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
            <div className="mb-4 w-[calc(100vw-2rem)] md:w-[400px] max-w-[calc(100vw-2rem)] shadow-2xl rounded-xl overflow-hidden">
              {isOpen && <ChatInterface onClose={closeChat} className="h-[calc(100vh-8rem)] md:h-[600px] md:max-h-[calc(100vh-8rem)]" />}
            </div>
          </div>

          {/* Floating Action Button (FAB) */}
          {!isOpen && (
            <button
              onClick={toggleChat}
              className="fixed bottom-4 md:bottom-6 right-4 md:right-6 z-50 w-12 h-12 md:w-14 md:h-14 bg-accent text-white rounded-full shadow-lg flex items-center justify-center hover:bg-accent-dark hover:scale-110 transition-all duration-300 group"
              aria-label="Prata med Bibbi"
            >
              <Sparkles size={20} className="md:w-6 md:h-6 group-hover:rotate-12 transition-transform" />
              <span className="absolute -top-10 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Prata med Bibbi
              </span>
            </button>
          )}
        </>
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default Layout;
