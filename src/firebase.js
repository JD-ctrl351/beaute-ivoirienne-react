// Importez les fonctions Firebase nécessaires
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Votre configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDR8xPcRVZ0CYzh6YeofkVljMXTJtHZjlc",
  authDomain: "beaute-ivoirienne-app.firebaseapp.com",
  projectId: "beaute-ivoirienne-app",
  storageBucket: "beaute-ivoirienne-app.firebasestorage.app",
  messagingSenderId: "246413335382",
  appId: "1:246413335382:web:390fd9736da133539e54f7",
  measurementId: "G-8SZ6CZZ364"
};

// Initialisez Firebase
const app = initializeApp(firebaseConfig);

// Exportez une instance de la base de données Firestore pour l'utiliser dans d'autres fichiers
export const db = getFirestore(app);