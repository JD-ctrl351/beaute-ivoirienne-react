// src/components/Header.js

import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getAuth, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import Notifications from './Notifications'; // <-- AJOUT 1 : Importer le nouveau composant

// L'UID du service client reste le même
const SERVICE_CLIENT_UID = "ET79QIbEM9hDLDg80LYq9jhNbpy2";
const SERVICE_CLIENT_NAME = "Service Client";

function Header({ onOpenModal }) {
  const { currentUser } = useContext(AuthContext);
  const [userName, setUserName] = useState(null);
  const auth = getAuth();
  const navigate = useNavigate();

  const isServiceClient = currentUser && currentUser.uid === SERVICE_CLIENT_UID;

  useEffect(() => {
    if (currentUser) {
        const fetchUserName = async () => {
            let name = currentUser.email;
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

  const handleContactServiceClient = async () => {
    if (!currentUser) {
        alert("Veuillez vous connecter pour contacter le service client.");
        return;
    }
    if (isServiceClient) {
        navigate('/service-client-dashboard');
        return;
    }
    try {
        const conversationId = currentUser.uid > SERVICE_CLIENT_UID ? `${currentUser.uid}_${SERVICE_CLIENT_UID}` : `${SERVICE_CLIENT_UID}_${currentUser.uid}`;
        const conversationRef = doc(db, 'conversations', conversationId);
        const docSnap = await getDoc(conversationRef);
        if (!docSnap.exists()) {
            await setDoc(conversationRef, {
                participants: [currentUser.uid, SERVICE_CLIENT_UID],
                participantNames: {
                    [currentUser.uid]: userName,
                    [SERVICE_CLIENT_UID]: SERVICE_CLIENT_NAME
                },
                lastMessage: "Conversation initiée avec le service client.",
                lastMessageTimestamp: serverTimestamp(),
            });
        }
        navigate(`/messagerie?id=${conversationId}`);
    } catch (error) {
        console.error("Erreur lors de la création de la conversation avec le service client:", error);
        alert("Impossible de joindre le service client pour le moment.");
    }
  };

  const handleLogout = () => {
    signOut(auth).catch((error) => console.error("Erreur de déconnexion", error));
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <i className="fa-solid fa-palette text-2xl text-orange-500 mr-2"></i>
          <h1 className="text-xl font-bold text-gray-800">Beauté Ivoirienne</h1>
        </Link>
        <nav className="hidden md:flex space-x-8 items-center">
          <Link to="/" className="text-gray-700 hover:text-orange-500 transition">Accueil</Link>
          <Link to="/liste-prestataires" className="text-gray-700 hover:text-orange-500 transition">Trouver un Prestataire</Link>
          <Link to="/blog" className="text-gray-700 hover:text-orange-500 transition">Conseils Beauté</Link>
          {currentUser && !isServiceClient && (
            <Link to="/mes-rendez-vous" className="text-gray-700 hover:text-orange-500 transition">Mes Rendez-vous</Link>
          )}
          
          {isServiceClient ? (
             <Link to="/service-client-dashboard" className="text-gray-700 hover:text-orange-500 transition font-bold">Dashboard Admin</Link>
          ) : (
             <Link to="/prestataires" className="text-gray-700 hover:text-orange-500 transition">Espace Pros</Link>
          )}

        </nav>
        <div className="flex items-center space-x-4">
          {currentUser && (
              <> {/* AJOUT : Englober dans un fragment */}
                <button onClick={handleContactServiceClient} title="Contacter le service client" className="text-gray-600 hover:text-orange-500 transition text-xl">
                  <i className="fa-solid fa-headset"></i>
                </button>
                <Notifications /> {/* <-- AJOUT 2 : Placer le composant ici */}
              </>
          )}

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