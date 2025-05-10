import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDCVfnIvk-KlpctZIXbcbVcGbmbwyf9ojM",
  authDomain: "askeliott.com", // ✅ au lieu de eliott-analytics.firebaseapp.com
  projectId: "eliott-analytics",
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

export { auth };
