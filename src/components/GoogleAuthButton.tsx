
import { Button } from "@/components/ui/button";
import { Cloud } from "lucide-react";
import { GOOGLE_ANALYTICS_SCOPES } from "@/services/googleAnalytics";

interface GoogleAuthButtonProps {
  clientId: string;
  onSuccess?: (response: any) => void;
  onError?: (error: Error) => void;
}

const GoogleAuthButton = ({ clientId, onSuccess, onError }: GoogleAuthButtonProps) => {
  const handleGoogleAuth = () => {
    // Redirection vers l'authentification Google
    const redirectUri = window.location.origin + "/dashboard";
    
    // Utilisation des scopes corrects depuis le service
    const scope = GOOGLE_ANALYTICS_SCOPES.join(" ");
    
    console.log("Redirecting to Google Auth with scopes:", scope);
    
    // Garantir que tous les paramètres sont correctement encodés
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scope,
      response_type: 'token',
      // Ajout d'un state pour la sécurité
      state: Math.random().toString(36).substring(2),
      // Forcer la sélection du compte Google
      prompt: 'select_account'
    });
    
    const authUrl = `https://accounts.google.com/o/oauth2/auth?${params.toString()}`;
    console.log("Auth URL:", authUrl);
    
    window.location.href = authUrl;
  };

  return (
    <Button 
      onClick={handleGoogleAuth} 
      className="bg-white text-gray-800 hover:bg-gray-100 border border-gray-300 shadow-sm flex items-center gap-2"
    >
      <Cloud size={20} />
      <span>Se connecter avec Google Analytics</span>
    </Button>
  );
};

export default GoogleAuthButton;
