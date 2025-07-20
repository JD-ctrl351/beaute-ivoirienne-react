import React, { createContext, useState, useEffect } from 'react';
// On importe "auth" depuis NOTRE fichier de configuration
import { auth } from '../firebase'; 
// On importe seulement les fonctions dont on a besoin, pas getAuth
import { onAuthStateChanged } from 'firebase/auth';

// On crée le "contexte"
export const AuthContext = createContext();

// On crée un "fournisseur" de contexte.
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged est un écouteur de Firebase qui se déclenche
    // à chaque fois que l'état de connexion change.
    // Il utilise maintenant l'instance "auth" correctement initialisée depuis firebase.js
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false);
    });

    // On se désabonne de l'écouteur quand le composant est "démonté"
    return unsubscribe;
  }, []); // "auth" a été retiré des dépendances car il ne change jamais

  const value = {
    currentUser,
  };

  // On ne rend les enfants que lorsque le chargement initial est terminé
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}