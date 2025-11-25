import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- CONFIGURATION ---
// Ces valeurs doivent être définies dans les variables d'environnement Vercel (VITE_...)
// Pour le développement local ou si les clés sont manquantes, on évite le crash.

const getEnv = (key: string) => {
    // @ts-ignore
    if (import.meta && import.meta.env && import.meta.env[key]) {
        // @ts-ignore
        return import.meta.env[key];
    }
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
        // @ts-ignore
        return process.env[key];
    }
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key.replace('VITE_', '')]) {
        // @ts-ignore
        return process.env[key.replace('VITE_', '')];
    }
    return undefined;
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID')
};

// Singleton instances
let app: any;
let auth: any;
let db: any;

try {
    if (firebaseConfig.apiKey) {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        console.log("Firebase initialized successfully");
    } else {
        console.warn("Firebase credentials missing. Cloud sync will be disabled.");
    }
} catch (e) {
    console.error("Firebase initialization failed:", e);
}

export { auth, db };

// Helper pour vérifier si Firebase est actif
export const isFirebaseReady = () => !!auth && !!db;
