import { useEffect } from "react";
import { getAuth, getRedirectResult } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const RedirectHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();

    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log("✅ Connexion Firebase réussie :", result.user.uid);
          toast.success("Connexion réussie !");
        } else {
          console.warn("⚠️ Aucun résultat de redirection");
        }
      })
      .catch((error) => {
        console.error("❌ Erreur retour de redirection Firebase :", error);
        toast.error("Erreur lors de la connexion.");
      })
      .finally(() => {
        // Redirige vers la page intégration
        navigate("/integration");
      });
  }, [navigate]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center text-center p-4">
      <h2 className="text-xl font-semibold mb-2">Connexion en cours...</h2>
      <p className="text-muted">Nous traitons votre connexion à Firebase.</p>
    </div>
  );
};

export default RedirectHandler;
