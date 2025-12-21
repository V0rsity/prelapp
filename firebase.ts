// firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDLaI9nM1Kv5xs5XYky3Ji91aYjodTUEm8",
  authDomain: "prelapp-8781f.firebaseapp.com",
  projectId: "prelapp-8781f",
  storageBucket: "prelapp-8781f.firebasestorage.app",
  messagingSenderId: "48765072976",
  appId: "1:48765072976:web:9797f7b939e8b65b708355",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
