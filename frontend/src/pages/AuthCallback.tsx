import { useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
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

    // === Google Analytics
    if (gaAccessToken) {
      localStorage.setItem("googleAccessToken", gaAccessToken);
      console.log("✅ Access token GA stocké");

      if (gaRefreshToken) {
        localStorage.setItem("ga_refresh_token", gaRefreshToken);
        console.log("✅ Refresh token GA stocké:", gaRefreshToken.substring(0, 5) + "...");
      }

      const expires = parseInt(gaExpiresIn || "3600"); // fallback à 1h
      const expirationDate = new Date();
      expirationDate.setSeconds(expirationDate.getSeconds() + expires);
      localStorage.setItem("ga_token_expires_at", expirationDate.toISOString());
      console.log("✅ Expiration GA :", expirationDate.toISOString());
    }

    // === Google Sheets
    if (sheetsAccessToken) {
      localStorage.setItem("googleSheetsAccessToken", sheetsAccessToken);
      if (sheetsRefreshToken) localStorage.setItem("sheets_refresh_token", sheetsRefreshToken);
      const expires = parseInt(sheetsExpiresIn || "3600");
      const expirationDate = new Date();
      expirationDate.setSeconds(expirationDate.getSeconds() + expires);
      localStorage.setItem("sheets_token_expires_at", expirationDate.toISOString());
    }

    // === Google Ads
    if (adsAccessToken) {
      localStorage.setItem("googleAdsAccessToken", adsAccessToken);
      if (adsRefreshToken) localStorage.setItem("ads_refresh_token", adsRefreshToken);
      const expires = parseInt(adsExpiresIn || "3600");
      const expirationDate = new Date();
      expirationDate.setSeconds(expirationDate.getSeconds() + expires);
      localStorage.setItem("ads_token_expires_at", expirationDate.toISOString());
    }

    // 🔁 Envoi au backend dès que l'utilisateur Firebase est prêt
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.warn("⚠️ Aucun utilisateur Firebase connecté.");
        navigate("/request"); // ⚠️ redirige même si non connecté pour éviter blocage
        return;
      }

      try {
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
          console.log("✅ Tokens envoyés au backend :", data);
        } else {
          console.error("❌ Erreur backend :", data);
        }
      } catch (err) {
        console.error("❌ Erreur envoi backend :", err);
      }

      // ✅ Navigation
      navigate("/request");
    });
  }, [navigate]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center text-center p-4">
      <h2 className="text-xl font-semibold mb-2">Connexion en cours...</h2>
      <p className="text-muted">Nous finalisons la connexion à votre compte Google.</p>
    </div>
  );
};

export default AuthCallback;
