import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';

import ProtectedRoute from './components/ProtectedRoute';

const Home = lazy(() => import('./pages/Home'));
const MyBooks = lazy(() => import('./pages/MyBooks'));
const BookDetail = lazy(() => import('./pages/BookDetail'));
const Recommendations = lazy(() => import('./pages/Recommendations'));
const Profile = lazy(() => import('./pages/Profile'));
const Contact = lazy(() => import('./pages/Contact'));
const Admin = lazy(() => import('./pages/Admin'));

const PageFallback = () => (
  <div className="py-10 text-center text-gray-500">Laddar...</div>
);

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ScrollToTop />
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="contact" element={<Contact />} />
              <Route path="books" element={
                <ProtectedRoute>
                  <MyBooks />
                </ProtectedRoute>
              } />
              <Route path="book/:id" element={
                <ProtectedRoute>
                  <BookDetail />
                </ProtectedRoute>
              } />
              <Route path="recommendations" element={
                <ProtectedRoute>
                  <Recommendations />
                </ProtectedRoute>
              } />
              <Route path="profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="admin" element={<Admin />} />
              {/* Redirect old beta-signup URL to contact */}
              <Route path="beta-signup" element={<Navigate to="/contact" replace />} />
              {/* Handle index.html suffix if server serves it explicitly */}
              <Route path="index.html" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
