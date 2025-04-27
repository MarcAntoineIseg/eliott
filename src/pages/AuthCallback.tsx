import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const expiresIn = params.get("expires_in");

    if (accessToken) {
      localStorage.setItem("googleAccessToken", accessToken);
      console.log("✅ Access token stocké avec succès.");

      if (refreshToken) {
        localStorage.setItem("ga_refresh_token", refreshToken);
        console.log("✅ Refresh token stocké avec succès.");
      }

      if (expiresIn) {
        const expirationDate = new Date();
        expirationDate.setSeconds(expirationDate.getSeconds() + parseInt(expiresIn));
        localStorage.setItem("ga_token_expires_at", expirationDate.toISOString());
        console.log("✅ Expiration du token stockée avec succès.");
      }

      navigate("/request"); // ➔ Redirige vers ta page principale
    } else {
      console.error("❌ Aucun access_token trouvé !");
    }
  }, [navigate]);

  return (
    <div className="h-screen w-full flex items-center justify-center text-lg">
      Connexion en cours...
    </div>
  );
};

export default AuthCallback;
