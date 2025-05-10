import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDCVfnIvk-KlpctZIXbcbVcGbmbwyf9ojM",
  authDomain: "eliott-analytics.firebaseapp.com",
  projectId: "eliott-analytics",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
