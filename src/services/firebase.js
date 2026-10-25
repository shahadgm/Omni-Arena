import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA-LCfXc-65kxzcO0Bz3sDL4qFSBVbtlQc",
  authDomain: "mr-typist.firebaseapp.com",
  projectId: "mr-typist",
  storageBucket: "mr-typist.firebasestorage.app",
  messagingSenderId: "940929482305",
  appId: "1:940929482305:web:ce75770ebafc86e69510c0"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
