import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyA37m6g-_f8iIyF0jZBc-1hX7PpllHkyq8",
    authDomain: "learnerds-1bd6f.firebaseapp.com",
    projectId: "learnerds-1bd6f",
    storageBucket: "learnerds-1bd6f.firebasestorage.app",
    messagingSenderId: "1094541551100",
    appId: "1:1094541551100:web:ff6747a912ef5ddf823e79"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };

