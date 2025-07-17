import React, { createContext, useState, useEffect, useContext } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';

// On crée le "contexte"
export const AuthContext = createContext();

// On crée un "fournisseur" de contexte. C'est lui qui contiendra la logique.
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    // onAuthStateChanged est un écouteur de Firebase qui se déclenche
    // à chaque fois que l'état de connexion change (connexion, déconnexion).
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false);
    });

    // On se désabonne de l'écouteur quand le composant est "démonté"
    return unsubscribe;
  }, [auth]);

  const value = {
    currentUser,
    // on pourra ajouter d'autres fonctions ici plus tard
  };

  // On ne rend les enfants que lorsque le chargement initial est terminé
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}