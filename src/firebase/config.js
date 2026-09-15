// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAQkw-lzg_JqfhBdwdqa7tzxG7yyoluaOg",
  authDomain: "hpair-deliverable-7a73d.firebaseapp.com",
  projectId: "hpair-deliverable-7a73d",
  storageBucket: "hpair-deliverable-7a73d.firebasestorage.app",
  messagingSenderId: "714174513795",
  appId: "1:714174513795:web:9c6dce80676807654bd1b6",
  measurementId: "G-TXVBM96DE8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

export default app;
