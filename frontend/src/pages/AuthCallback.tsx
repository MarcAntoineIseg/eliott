import { useEffect } from "react";
import { getAuth, getRedirectResult, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const gaAccessToken = params.get("access_token");
    const gaRefreshToken = params.get("refresh_token");
    const gaExpiresIn = params.get("expires_in");

    const sheetsAccessToken = params.get("googleSheetsAccessToken");
    const sheetsRefreshToken = params.get("sheetsRefreshToken");
    const sheetsExpiresIn = params.get("sheetsExpiresIn");

    const adsAccessToken = params.get("googleAdsAccessToken");
    const adsRefreshToken = params.get("adsRefreshToken");
    const adsExpiresIn = params.get("adsExpiresIn");

    const auth = getAuth();

    const handleConnectedUser = async (user: any) => {
      try {
        const idToken = await user.getIdToken();

        const res = await fetch("https://api.askeliott.com/auth/google/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            analytics: {
              access_token: gaAccessToken,
              refresh_token: gaRefreshToken,
              expires_in: gaExpiresIn,
            },
            sheets: {
              access_token: sheetsAccessToken,
              refresh_token: sheetsRefreshToken,
              expires_in: sheetsExpiresIn,
            },
            ads: {
              access_token: adsAccessToken,
              refresh_token: adsRefreshToken,
              expires_in: adsExpiresIn,
            },
          }),
        });

        const data = await res.json();
        if (res.ok) {
          console.log("✅ Tokens envoyés au backend :", data);
        } else {
          console.error("❌ Erreur backend :", data);
        }
      } catch (err) {
        console.error("❌ Erreur envoi backend :", err);
      }

      navigate("/request");
    };

    // 🔄 Essaye d'abord de récupérer le résultat du redirect OAuth
    getRedirectResult(auth)
      .then((result) => {
        if (result && result.user) {
          console.log("✅ Utilisateur détecté via redirect :", result.user);
          handleConnectedUser(result.user);
