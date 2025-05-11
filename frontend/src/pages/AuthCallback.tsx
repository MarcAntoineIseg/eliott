import { useEffect } from "react";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  onAuthStateChanged,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const params = new URLSearchParams(window.location.search);

    const idTokenFromUrl = params.get("idToken");

    const gaAccessToken = params.get("access_token");
    const gaRefreshToken = params.get("refresh_token");
    const gaExpiresIn = params.get("expires_in");

    const sheetsAccessToken = params.get("googleSheetsAccessToken");
    const sheetsRefreshToken = params.get("sheetsRefreshToken");
    const sheetsExpiresIn = params.get("sheetsExpiresIn");

    const adsAccessToken = params.get("googleAdsAccessToken");
    const adsRefreshToken = params.get("adsRefreshToken");
    const adsExpiresIn = params.get("adsExpiresIn");

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

    if (idTokenFromUrl) {
      console.log("✅ idToken détecté dans l'URL");
      const credential = GoogleAuthProvider.credential(idTokenFromUrl);

      signInWithCredential(auth, credential)
        .then(({ user }) => {
          console.log("✅ Utilisateur connecté avec idToken :", user);
          handleConnectedUser(user);
        })
        .catch((err) => {
          console.error("❌ Erreur signInWithCredential :", err);
          navigate("/create-account");
        });

      return; // ⛔ Ne pas exécuter le onAuthStateChanged plus bas
    }

    // Cas normal : utilisateur déjà connecté
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("✅ Utilisateur déjà connecté :", user);
        handleConnectedUser(user);
      } else {
        console.warn("⚠️ Aucun utilisateur Firebase détecté");
        navigate("/create-account");
      }
    });
  }, [navigate]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center text-center p-4">
      <h2 className="text-xl font-semibold mb-2">Connexion en cours...</h2>
      <p className="text-muted">Nous finalisons la connexion à votre compte...</p>
    </div>
  );
};

export default AuthCallback;
