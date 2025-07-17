import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAAke40Feht1lyk44mnuvJgv7qV-cYOdms",
  authDomain: "dayscountdown-b70df.firebaseapp.com",
  projectId: "dayscountdown-b70df",
  storageBucket: "dayscountdown-b70df.firebasestorage.app",
  messagingSenderId: "1004229904264",
  appId: "1:1004229904264:web:5f1bc567261f31bc609c3d",
  measurementId: "G-SQ2NSQ6CQF"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig); // This line is now exported
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;