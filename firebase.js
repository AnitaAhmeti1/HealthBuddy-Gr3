
// Import the functions you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCi6Kx4v8DWAS5DsMCf29YfPrrUYoiDM-A",
  authDomain: "healthbuddy-545ba.firebaseapp.com",
  projectId: "healthbuddy-545ba",
  storageBucket: "healthbuddy-545ba.firebasestorage.app",
  messagingSenderId: "288329939493",
  appId: "1:288329939493:web:f6f0ee94a7b31a07901dcc",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Firestore
export const db = getFirestore(app);

export default app;