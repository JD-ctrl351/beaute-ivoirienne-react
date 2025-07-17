import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import './App.css';
import Header from './components/Header.js';
import Footer from './components/Footer.js';
import AuthModal from './components/AuthModal.js';
import HomePage from './pages/HomePage.js';
import ProfessionalListPage from './pages/ProfessionalListPage.js';
import BlogPage from './pages/BlogPage.js';
import ArticlePage from './pages/ArticlePage.js'; // On importe la nouvelle page
import AppointmentsPage from './pages/AppointmentsPage.js';
import ProsPage from './pages/ProsPage.js';
import ProfessionalProfilePage from './pages/ProfessionalProfilePage.js';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="App">
        <Header onOpenModal={() => setIsModalOpen(true)} />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/liste-prestataires" element={<ProfessionalListPage />} />
            <Route path="/blog" element={<BlogPage />} />
            {/* 👇 NOUVELLE ROUTE DYNAMIQUE POUR LES ARTICLES 👇 */}
            <Route path="/blog/:slug" element={<ArticlePage />} />
            <Route path="/mes-rendez-vous" element={<AppointmentsPage />} />
            <Route path="/prestataires" element={<ProsPage />} />
            <Route path="/prestataire/:id" element={<ProfessionalProfilePage />} />
          </Routes>
        </main>
        <Footer />
        {isModalOpen && <AuthModal onClose={() => setIsModalOpen(false)} />}
      </div>
    </BrowserRouter>
  );
}

export default App;