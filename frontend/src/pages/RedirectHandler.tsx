import { useEffect } from "react";
import { getAuth, getRedirectResult } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const RedirectHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();

    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log("✅ Utilisateur détecté via redirect :", result.user);

          // Redirection vers la page de finalisation
          window.location.href = "https://app.askeliott.com/auth/callback";
        } else {
          console.warn("⚠️ Aucun résultat de redirection trouvé");
          navigate("/create-account");
        }
      })
      .catch((error) => {
        console.error("❌ Erreur retour de redirection Firebase :", error);
        navigate("/create-account");
      });
  }, [navigate]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center text-center p-4">
      <h2 className="text-xl font-semibold mb-2">Connexion en cours...</h2>
      <p className="text-muted">Nous traitons votre connexion...</p>
    </div>
  );
};

export default RedirectHandler;
