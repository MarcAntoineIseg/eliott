import { useEffect } from "react";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Google Analytics
    const gaAccessToken = params.get("access_token");
    const gaRefreshToken = params.get("refresh_token");
    const gaExpiresIn = params.get("expires_in");

    // Google Sheets
    const sheetsAccessToken = params.get("googleSheetsAccessToken");
    const sheetsRefreshToken = params.get("sheetsRefreshToken");
    const sheetsExpiresIn = params.get("sheetsExpiresIn");

    // Google Ads
    const adsAccessToken = params.get("googleAdsAccessToken");
    const adsRefreshToken = params.get("adsRefreshToken");
    const adsExpiresIn = params.get("adsExpiresIn");

    // ✅ Google Analytics
    if (gaAccessToken) {
      localStorage.setItem("googleAccessToken", gaAccessToken);
      console.log("✅ Access token Google Analytics stocké avec succès.");

      if (gaRefreshToken) {
        localStorage.setItem("ga_refresh_token", gaRefreshToken);
        console.log("✅ Refresh token Google Analytics stocké avec succès:", gaRefreshToken.substring(0, 5) + "...");
      } else {
        console.warn("⚠️ Aucun refresh token Google Analytics reçu!");
      }

      const expires = parseInt(gaExpiresIn || "0");
      if (!isNaN(expires) && expires > 0) {
        const expirationDate = new Date();
        expirationDate.setSeconds(expirationDate.getSeconds() + expires);
        localStorage.setItem("ga_token_expires_at", expirationDate.toISOString());
        console.log("✅ Expiration GA stockée :", expirationDate.toISOString());
      } else {
        console.warn("⚠️ Expiration GA non définie ou invalide :", gaExpiresIn);
      }

      // 🔁 Envoi au backend
      const sendTokensToBackend = async () => {
        try {
          const auth = getAuth();
          const user = auth.currentUser;

          if (!user) {
            console.warn("⚠️ Aucun utilisateur Firebase connecté.");
            return;
          }

          const idToken = await user.getIdToken();
          const res = await fetch("https://api.askeliott.com/auth/google/start", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`
            },
            body: JSON.stringify({
              access_token: gaAccessToken,
              refresh_token: gaRefreshToken
            })
          });

          const data = await res.json();
          if (res.ok) {
            console.log("✅ Tokens envoyés au backend avec succès :", data);
          } else {
            console.error("❌ Erreur backend :", data);
          }
        } catch (err) {
          console.error("❌ Erreur envoi token backend :", err);
        }
      };

      sendTokensToBackend();
    }

    // ✅ Google Sheets
    if (sheetsAccessToken) {
      localStorage.setItem("googleSheetsAccessToken", sheetsAccessToken);
      console.log("✅ Access token Google Sheets stocké avec succès.");

      if (sheetsRefreshToken) {
        localStorage.setItem("sheets_refresh_token", sheetsRefreshToken);
        console.log("✅ Refresh token Google Sheets stocké avec succès:", sheetsRefreshToken.substring(0, 5) + "...");
      } else {
        console.warn("⚠️ Aucun refresh token Google Sheets reçu!");
      }

      const expires = parseInt(sheetsExpiresIn || "0");
      if (!isNaN(expires) && expires > 0) {
        const expirationDate = new Date();
        expirationDate.setSeconds(expirationDate.getSeconds() + expires);
        localStorage.setItem("sheets_token_expires_at", expirationDate.toISOString());
        console.log("✅ Expiration Google Sheets stockée :", expirationDate.toISOString());
      }
    }

    // ✅ Google Ads
    if (adsAccessToken) {
      localStorage.setItem("googleAdsAccessToken", adsAccessToken);
      console.log("✅ Access token Google Ads stocké avec succès.");

      if (adsRefreshToken) {
        localStorage.setItem("ads_refresh_token", adsRefreshToken);
        console.log("✅ Refresh token Google Ads stocké avec succès:", adsRefreshToken.substring(0, 5) + "...");
      } else {
        console.warn("⚠️ Aucun refresh token Google Ads reçu!");
      }

      const expires = parseInt(adsExpiresIn || "0");
      if (!isNaN(expires) && expires > 0) {
        const expirationDate = new Date();
        expirationDate.setSeconds(expirationDate.getSeconds() + expires);
        localStorage.setItem("ads_token_expires_at", expirationDate.toISOString());
        console.log("✅ Expiration Google Ads stockée :", expirationDate.toISOString());
      }
    }

    navigate("/request");
  }, [navigate]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center text-center p-4">
      <h2 className="text-xl font-semibold mb-2">Connexion en cours...</h2>
      <p className="text-muted">Nous finalisons la connexion à votre compte Google.</p>
    </div>
  );
};

export default AuthCallback;
