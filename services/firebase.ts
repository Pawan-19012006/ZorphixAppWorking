import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBefhLPabmf4yo3RI-eCO7nAGhAq0dzZ1E",
    authDomain: "zorphix-26.firebaseapp.com",
    projectId: "zorphix-26",
    storageBucket: "zorphix-26.firebasestorage.app",
    messagingSenderId: "481146604346",
    appId: "1:481146604346:web:d40a55b61892b26742de03",
    measurementId: "G-QYQM2MM3W0"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with settings to improve connectivity
// (Long polling helps bypass some firewall/network restrictions)
export const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
});
