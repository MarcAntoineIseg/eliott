import { useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const params = new URLSearchParams(window.location.search);

    // 🔁 Extraction des tokens depuis l'URL
    const gaAccessToken = params.get("access_token");
    const gaRefreshToken = params.get("refresh_token");
    const gaExpiresIn = params.get("expires_in");

    const sheetsAccessToken = params.get("googleSheetsAccessToken");
    const sheetsRefreshToken = params.get("sheetsRefreshToken");
    const sheetsExpiresIn = params.get("sheetsExpiresIn");

    const adsAccessToken = params.get("googleAdsAccessToken");
    const adsRefreshToken = params.get("adsRefreshToken");
    const adsExpiresIn = params.get("adsExpiresIn");

    // ✅ Traitement de l'utilisateur connecté
    const handleConnectedUser = async (user: any) => {
      try {
        const idToken = await user.getIdToken();

        // Construction dynamique du body (envoie uniquement les tokens présents)
        const body: any = {};
        if (gaAccessToken) {
          body.analytics = {
            access_token: gaAccessToken,
            refresh_token: gaRefreshToken,
            expires_in: gaExpiresIn,
          };
        }
        if (sheetsAccessToken) {
          body.sheets = {
            access_token: sheetsAccessToken,
            refresh_token: sheetsRefreshToken,
            expires_in: sheetsExpiresIn,
          };
        }
        if (adsAccessToken) {
          body.ads = {
            access_token: adsAccessToken,
            refresh_token: adsRefreshToken,
            expires_in: adsExpiresIn,
          };
        }

        if (Object.keys(body).length === 0) {
          console.warn("⚠️ Aucun token à envoyer.");
          navigate("/integration");
          return;
        }

        const res = await fetch("https://api.askeliott.com/auth/google/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify(body),
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

      navigate("/integration"); // 👈 redirige vers la bonne page
    };

    // 🔄 Écoute directe de Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("✅ Utilisateur Firebase détecté :", user);
        handleConnectedUser(user);
      } else {
        console.warn("⚠️ Aucun utilisateur Firebase détecté");
        navigate("/integration");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center text-center p-4">
      <h2 className="text-xl font-semibold mb-2">Connexion en cours...</h2>
      <p className="text-muted">Nous finalisons la connexion à votre compte...</p>
    </div>
  );
};

export default AuthCallback;
