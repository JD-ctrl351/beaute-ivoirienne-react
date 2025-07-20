// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // <-- AJOUT IMPORTANT

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDR8xPcRVZ0CYzh6YeofkVljMXTJtHZjlc",
  authDomain: "beaute-ivoirienne-app.firebaseapp.com",
  projectId: "beaute-ivoirienne-app",
  // Mettez ici le nom du NOUVEAU dossier de stockage (bucket) que vous avez créé en Europe
  storageBucket: "photos-beaute-ivoirienne-app",
  messagingSenderId: "246413335382",
  appId: "G-8SZ6CZZ364"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // <-- AJOUT IMPORTANT