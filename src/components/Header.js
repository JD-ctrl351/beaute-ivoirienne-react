import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';


function Header({ onOpenModal }) {
  const { currentUser } = useContext(AuthContext);
  const [userName, setUserName] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    if (currentUser) {
        // Fonction pour chercher le nom dans les collections client ou pro
        const fetchUserName = async () => {
            let name = currentUser.email; // Fallback sur l'email
            const clientRef = doc(db, "clients", currentUser.uid);
            const clientSnap = await getDoc(clientRef);

            if (clientSnap.exists()) {
                name = clientSnap.data().name;
            } else {
                const proRef = doc(db, "professionals", currentUser.uid);
                const proSnap = await getDoc(proRef);
                if (proSnap.exists()) {
                    name = proSnap.data().name;
                }
            }
            setUserName(name);
        };
        fetchUserName();
    } else {
        setUserName(null);
    }
  }, [currentUser]);


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
            <>
              <Link to="/messagerie" className="text-gray-700 hover:text-orange-500 transition">Messagerie</Link>
              <Link to="/mes-rendez-vous" className="text-gray-700 hover:text-orange-500 transition">Mes Rendez-vous</Link>
            </>
          )}
          <Link to="/prestataires" className="text-gray-700 hover:text-orange-500 transition">Espace Pros</Link>
        </nav>
        <div className="flex items-center space-x-4">
          {currentUser ? (
            <>
              <span className="text-gray-700 text-sm hidden sm:block">{userName}</span>
              <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm">Déconnexion</button>
            </>
          ) : (
            <button onClick={onOpenModal} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg">Se connecter</button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;