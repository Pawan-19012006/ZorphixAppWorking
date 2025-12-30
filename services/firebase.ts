import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDkW692RAux_2An3zXkXUzzzfGb5i31AJU",
    authDomain: "zorphix-sync-test.firebaseapp.com",
    projectId: "zorphix-sync-test",
    storageBucket: "zorphix-sync-test.firebasestorage.app",
    messagingSenderId: "1036642648512",
    appId: "1:1036642648512:web:5716a2c677fda919224825"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with settings to improve connectivity
// (Long polling helps bypass some firewall/network restrictions)
export const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
});
