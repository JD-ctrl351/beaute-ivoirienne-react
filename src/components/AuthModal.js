import React, { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

function AuthModal({ onClose }) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = getAuth();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const name = e.target.elements['signup-name'].value;
    const email = e.target.elements['signup-email'].value;
    const password = e.target.elements['signup-password'].value;

    if (password.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caractères.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // On vérifie si l'utilisateur a choisi d'être un professionnel
      const accountType = e.target.elements['account_type'].value;
      if (accountType === 'professional') {
          await setDoc(doc(db, "professionals", user.uid), {
              uid: user.uid,
              name: name,
              email: email,
              domain: "Non spécifié",
              commune: "Non spécifiée",
              description: "Profil à compléter.",
              reviews: [],
              services: [],
              availability: {}
          });
      } else {
         await setDoc(doc(db, "clients", user.uid), {
            uid: user.uid,
            name: name,
            email: email,
         });
      }

      alert(`Compte pour ${name} créé avec succès !`);
      onClose();
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError("Cet email est déjà utilisé par un autre compte.");
      } else {
        setError("Une erreur est survenue lors de la création du compte.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const email = e.target.elements['login-email'].value;
    const password = e.target.elements['login-password'].value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onClose();
    } catch (err) {
      setError("Email ou mot de passe incorrect.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-xl">×</button>

        {isLoginView ? (
          <div id="login-view">
            <h3 className="text-2xl font-bold text-center mb-6 text-gray-800">Se Connecter</h3>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-gray-700 mb-2">Email</label>
                <input type="email" id="login-email" className="w-full px-4 py-2 border rounded-lg" required />
              </div>
              <div>
                <label htmlFor="login-password" className="block text-gray-700 mb-2">Mot de passe</label>
                <input type="password" id="login-password" className="w-full px-4 py-2 border rounded-lg" required />
              </div>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg transition shadow-md disabled:bg-gray-400">
                {loading ? 'Connexion...' : 'Connexion'}
              </button>
              <p className="text-center text-sm text-gray-600">
                Pas encore de compte ? 
                <button type="button" onClick={() => { setIsLoginView(false); setError(''); }} className="text-orange-500 hover:underline font-semibold ml-1">Créez-en un</button>
              </p>
            </form>
          </div>
        ) : (
          <div id="signup-view">
            <h3 className="text-2xl font-bold text-center mb-6 text-gray-800">Créer un Compte</h3>
            <form onSubmit={handleSignUp} className="space-y-4">
               <div>
                <label htmlFor="signup-name" className="block text-gray-700 mb-2">Votre Nom (ou nom du salon)</label>
                <input type="text" id="signup-name" className="w-full px-4 py-2 border rounded-lg" required />
              </div>
              <div>
                <label htmlFor="signup-email" className="block text-gray-700 mb-2">Email</label>
                <input type="email" id="signup-email" className="w-full px-4 py-2 border rounded-lg" required />
              </div>
              <div>
                <label htmlFor="signup-password" className="block text-gray-700 mb-2">Mot de passe</label>
                <input type="password" id="signup-password" className="w-full px-4 py-2 border rounded-lg" required />
              </div>
               <div className="pt-2">
                    <label className="block text-gray-700 mb-2">Vous êtes :</label>
                    <div className="flex justify-around">
                        <label className="flex items-center">
                            <input type="radio" name="account_type" value="client" className="text-orange-500 focus:ring-orange-500" defaultChecked />
                            <span className="ml-2">Un Client</span>
                        </label>
                        <label className="flex items-center">
                            <input type="radio" name="account_type" value="professional" className="text-orange-500 focus:ring-orange-500" />
                            <span className="ml-2">Un Professionnel</span>
                        </label>
                    </div>
                </div>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg transition shadow-md disabled:bg-gray-400">
                {loading ? 'Création...' : 'Créer mon compte'}
              </button>
              <p className="text-center text-sm text-gray-600">
                Déjà un compte ? 
                <button type="button" onClick={() => { setIsLoginView(true); setError(''); }} className="text-orange-500 hover:underline font-semibold ml-1">Connectez-vous</button>
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
export default AuthModal;