// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAgkBSziF_pj_EK2A3q8oq17zU9NWEwNXw",
  authDomain: "wdp301-5dae6.firebaseapp.com",
  projectId: "wdp301-5dae6",
  storageBucket: "wdp301-5dae6.firebasestorage.app",
  messagingSenderId: "871536505605",
  appId: "1:871536505605:web:43035e9393daa5538f7d6c",
  measurementId: "G-68L35X27D4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { app, analytics, auth };