import { useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Récupération des tokens depuis les query params
    const gaAccessToken = params.get("access_token");
    const gaRefreshToken = params.get("refresh_token");
    const gaExpiresIn = params.get("expires_in");

    const sheetsAccessToken = params.get("googleSheetsAccessToken");
    const sheetsRefreshToken = params.get("sheetsRefreshToken");
    const sheetsExpiresIn = params.get("sheetsExpiresIn");

    const adsAccessToken = params.get("googleAdsAccessToken");
    const adsRefreshToken = params.get("adsRefreshToken");
    const adsExpiresIn = params.get("adsExpiresIn");

    // 🔁 Envoi au backend dès que l'utilisateur Firebase est prêt
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.warn("⚠️ Aucun utilisateur Firebase connecté.");
        navigate("/request");
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
            analytics: {
              access_token: gaAccessToken,
              refresh_token: gaRefreshToken,
              expires_in: gaExpiresIn
            },
            sheets: {
              access_token: sheetsAccessToken,
              refresh_token: sheetsRefreshToken,
              expires_in: sheetsExpiresIn
            },
            ads: {
              access_token: adsAccessToken,
              refresh_token: adsRefreshToken,
              expires_in: adsExpiresIn
            }
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
