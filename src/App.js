import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import './App.css';
import Header from './components/Header.js';
import Footer from './components/Footer.js';
import AuthModal from './components/AuthModal.js';
import HomePage from './pages/HomePage.js';
import ProfessionalListPage from './pages/ProfessionalListPage.js';
import BlogPage from './pages/BlogPage.js';
import ArticlePage from './pages/ArticlePage.js';
import AppointmentsPage from './pages/AppointmentsPage.js';
import ProsPage from './pages/ProsPage.js';
import ProfessionalProfilePage from './pages/ProfessionalProfilePage.js';
import AboutPage from './pages/AboutPage.js';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage.js';
import TermsPage from './pages/TermsPage.js';
import MessagingPage from './pages/MessagingPage.js';
import ClientProfilePage from './pages/ClientProfilePage.js';
import ServiceClientPage from './pages/ServiceClientPage.js'; // 1. Importer la nouvelle page

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="App flex flex-col min-h-screen">
        <Header onOpenModal={() => setIsModalOpen(true)} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/liste-prestataires" element={<ProfessionalListPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<ArticlePage />} />
            <Route path="/mes-rendez-vous" element={<AppointmentsPage />} />
            <Route path="/prestataires" element={<ProsPage />} />
            <Route path="/prestataire/:id" element={<ProfessionalProfilePage />} />
            <Route path="/client/:id" element={<ClientProfilePage />} />
            <Route path="/service-client-dashboard" element={<ServiceClientPage />} /> {/* 2. Ajouter la route */}
            <Route path="/a-propos" element={<AboutPage />} />
            <Route path="/politique-de-confidentialite" element={<PrivacyPolicyPage />} />
            <Route path="/cgv" element={<TermsPage />} />
            <Route path="/messagerie" element={<MessagingPage />} />
          </Routes>
        </main>
        <Footer />
        {isModalOpen && <AuthModal onClose={() => setIsModalOpen(false)} />}
      </div>
    </BrowserRouter>
  );
}

export default App;