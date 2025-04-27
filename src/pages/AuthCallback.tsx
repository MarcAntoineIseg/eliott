
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = fragment.get("access_token");
    const refreshToken = fragment.get("refresh_token"); // rare mais parfois présent

    if (accessToken) {
      localStorage.setItem("googleAccessToken", accessToken);
      if (refreshToken) {
        localStorage.setItem("ga_refresh_token", refreshToken);
      }
      console.log("✅ Token(s) stockés avec succès.");

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
