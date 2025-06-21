// src/firebase.ts (or wherever your file is located)

// Import Firebase core and specific services
import { initializeApp, type FirebaseApp } from "firebase/app"; // Added FirebaseApp type
import { getFirestore, type Firestore } from "firebase/firestore"; // Added Firestore type
import { getAuth, type Auth } from "firebase/auth"; // <-- CORRECTLY IMPORTED

// import { getStorage, type FirebaseStorage } from "firebase/storage"; // Uncomment if you use Firebase Storage

// Firebase configuration (Your existing config is good)
const firebaseConfig = {
  apiKey: "AIzaSyDf-Ivp5_lrvpouHOpsiHKUY91Lw-cxMLc",
  authDomain: "jehadov-store.firebaseapp.com",
  projectId: "jehadov-store",
  storageBucket: "jehadov-store.appspot.com",
  messagingSenderId: "737560144935",
  appId: "1:737560144935:web:56ac20b3a25023c73cf202"
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase Services
const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app); // <-- CORRECTLY INITIALIZED
// const storage: FirebaseStorage = getStorage(app); // Uncomment if you use Firebase Storage

// Export the services you want to use in other parts of your app
// Make sure 'auth' is included in your exports
export { db, auth, /* storage, */ app }; // <-- CORRECTLY EXPORTED 'auth'
// If you are not using storage yet, you can keep it commented out or remove it from exports.