// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getHosting } from "firebase/hosting";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyB9ererNsNonAzH0zQo_GS79XPOyCoMxr4",
    authDomain: "waterdtection.firebaseapp.com",
    databaseURL: "https://waterdtection-default-rtdb.firebaseio.com",
    projectId: "waterdtection",
    storageBucket: "waterdtection.firebasestorage.app",
    messagingSenderId: "690886375729",
    appId: "1:690886375729:web:172c3a47dda6585e4e1810",
    measurementId: "G-TXF33Y6XY0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export default app;