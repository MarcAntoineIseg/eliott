import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const fetchGoogleAnalyticsTokensFromFirestore = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return null;

  const db = getFirestore();
  const userDoc = await getDoc(doc(db, "users", user.uid));

  if (!userDoc.exists()) return null;

  const data = userDoc.data();
  return {
    accessToken: data.ga_access_token,
    refreshToken: data.ga_refresh_token,
  };
};
