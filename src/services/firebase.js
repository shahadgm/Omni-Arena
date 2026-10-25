import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA-LCfXc-65kxzcO0Bz3sDL4qFSBVbtlQc",
  authDomain: "mr-typist.firebaseapp.com",
  projectId: "mr-typist",
  storageBucket: "mr-typist.firebasestorage.app",
  messagingSenderId: "542261546961",
  appId: "1:542261546961:web:d2639ceca7566cbbe8df01",
  measurementId: "G-KCRK1N14F3"
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Safe initialization of Auth to prevent module-level crashes in restricted environments
let _auth = null;
try {
  _auth = getAuth(app);
} catch (e) {
  console.warn("Firebase Auth deferred initialization:", e);
}
export const auth = _auth;

let _googleProvider = null;
try {
  _googleProvider = new GoogleAuthProvider();
  _googleProvider.setCustomParameters({ prompt: 'select_account' });
} catch (e) {
  console.warn("GoogleAuthProvider deferred initialization:", e);
}
export const googleProvider = _googleProvider;

export const getSafeAuth = () => {
  if (!_auth) {
    try {
      _auth = getAuth(app);
    } catch (e) {
      console.error("Error creating Firebase Auth instance:", e);
    }
  }
  return _auth;
};

export const getSafeGoogleProvider = () => {
  if (!_googleProvider) {
    try {
      _googleProvider = new GoogleAuthProvider();
      _googleProvider.setCustomParameters({ prompt: 'select_account' });
    } catch (e) {
      console.error("Error creating GoogleAuthProvider:", e);
    }
  }
  return _googleProvider;
};
