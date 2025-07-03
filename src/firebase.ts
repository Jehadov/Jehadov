// ✅ firebase.ts or firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBFrkVhq6krL_rsyGHCXjMOtVkc8zbZ90k",
  authDomain: "jehad-store.firebaseapp.com",
  projectId: "jehad-store",
  storageBucket: "jehad-store.appspot.com",
  messagingSenderId: "1007118281137",
  appId: "1:1007118281137:web:6da9865ffa6dd8bcbbf590",
  measurementId: "G-36YMQXSJL1"
};

const app = initializeApp(firebaseConfig);

// ✅ Only one export
export const db = getFirestore(app);
