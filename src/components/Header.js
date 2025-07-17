import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getAuth, signOut } from 'firebase/auth';

// Le Header reçoit maintenant "onOpenModal"
function Header({ onOpenModal }) {
  const { currentUser } = useContext(AuthContext);
  const auth = getAuth();

  const handleLogout = () => {
    signOut(auth).catch((error) => console.error("Erreur de déconnexion", error));
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <i className="fas fa-palette text-2xl text-orange-500 mr-2"></i>
          <h1 className="text-xl font-bold text-gray-800">Beauté Ivoirienne</h1>
        </Link>
        <nav className="hidden md:flex space-x-8">
          <Link to="/" className="text-gray-700 hover:text-orange-500 transition">Accueil</Link>
          <Link to="/liste-prestataires" className="text-gray-700 hover:text-orange-500 transition">Trouver un Prestataire</Link>
          <Link to="/blog" className="text-gray-700 hover:text-orange-500 transition">Conseils Beauté</Link>
          {currentUser && (
            <Link to="/mes-rendez-vous" className="text-gray-700 hover:text-orange-500 transition">Mes Rendez-vous</Link>
          )}
          <Link to="/prestataires" className="text-gray-700 hover:text-orange-500 transition">Espace Pros</Link>
        </nav>
        <div className="flex items-center space-x-4">
          {currentUser ? (
            <>
              <span className="text-gray-700 text-sm">{currentUser.email}</span>
              <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm">Déconnexion</button>
            </>
          ) : (
            // Le bouton utilise maintenant la fonction reçue
            <button onClick={onOpenModal} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg">Se connecter</button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;