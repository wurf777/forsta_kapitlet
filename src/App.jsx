import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import MyBooks from './pages/MyBooks';
import BookDetail from './pages/BookDetail';
import Recommendations from './pages/Recommendations';
import Profile from './pages/Profile';
import BetaSignup from './pages/BetaSignup';

import ProtectedRoute from './components/ProtectedRoute';

// ... (existing imports)

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="beta-signup" element={<BetaSignup />} />
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
            {/* Handle index.html suffix if server serves it explicitly */}
            <Route path="index.html" element={<Navigate to="/" replace />} />
            {/* Add more routes here as needed */}
          </Route>
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
