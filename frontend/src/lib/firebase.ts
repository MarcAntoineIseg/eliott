import { initializeApp } from "firebase/app";
import { GoogleAuthProvider } from "firebase/auth";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialise Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ✅ Active la persistance de session sur le navigateur
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("✅ Persistance Firebase configurée");
  })
  .catch((error) => {
    console.error("❌ Erreur de persistance Firebase :", error);
  });

const provider = new GoogleAuthProvider();

export { auth, provider };