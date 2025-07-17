// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { db };
