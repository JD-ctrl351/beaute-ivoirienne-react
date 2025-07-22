// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDR8xPcRVZ0CYzh6YeofkVljMXTJtHZjlc",
  authDomain: "beaute-ivoirienne-app.firebaseapp.com",
  projectId: "beaute-ivoirienne-app",
  storageBucket: "beaute-ivoirienne-app.firebasestorage.app",
  messagingSenderId: "246413335382",
  appId: "1:246413335382:web:390fd9736da133539e54f7",
  measurementId: "G-8SZ6CZZ364"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);