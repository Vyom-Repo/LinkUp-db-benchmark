import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DatabaseProvider } from './context/DatabaseContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import FeedPage from './pages/FeedPage';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminLabPage from './pages/AdminLabPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DatabaseProvider>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <main style={{ flex: 1 }}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/feed" element={<FeedPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/profile/:username" element={<ProfilePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/admin" element={<AdminLabPage />} />
              </Routes>
            </main>
          </div>
        </DatabaseProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
