
import { useEffect } from "react";
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

      if (gaExpiresIn) {
        const expirationDate = new Date();
        expirationDate.setSeconds(expirationDate.getSeconds() + parseInt(gaExpiresIn));
        localStorage.setItem("ga_token_expires_at", expirationDate.toISOString());
        console.log("✅ Expiration du token Google Analytics stockée avec succès.");
      }
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

      if (sheetsExpiresIn) {
        const expirationDate = new Date();
        expirationDate.setSeconds(expirationDate.getSeconds() + parseInt(sheetsExpiresIn));
        localStorage.setItem("sheets_token_expires_at", expirationDate.toISOString());
        console.log("✅ Expiration du token Google Sheets stockée avec succès.");
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

      if (adsExpiresIn) {
        const expirationDate = new Date();
        expirationDate.setSeconds(expirationDate.getSeconds() + parseInt(adsExpiresIn));
        localStorage.setItem("ads_token_expires_at", expirationDate.toISOString());
        console.log("✅ Expiration du token Google Ads stockée avec succès.");
      }
    }

    navigate("/request");
  }, [navigate]);

  return (
    <div className="h-screen w-full flex items-center justify-center text-lg">
      Connexion en cours...
    </div>
  );
};

export default AuthCallback;
