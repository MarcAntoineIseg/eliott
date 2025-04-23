
import { Button } from "@/components/ui/button";
import { Cloud } from "lucide-react";
import { GOOGLE_ANALYTICS_SCOPES, REDIRECT_URI } from "@/services/googleAnalytics";

interface GoogleAuthButtonProps {
  clientId: string;
  onSuccess?: (response: any) => void;
  onError?: (error: Error) => void;
}

const GoogleAuthButton = ({ clientId, onSuccess, onError }: GoogleAuthButtonProps) => {
  const handleGoogleAuth = () => {
    // Clear any existing tokens before starting a new auth flow
    localStorage.removeItem("googleAccessToken");
    
    // Utilisation des scopes corrects depuis le service
    const scope = GOOGLE_ANALYTICS_SCOPES.join(" ");
    
    // Ajout d'un timestamp unique pour éviter la mise en cache du token
    const timestamp = new Date().getTime();
    const nonce = Math.random().toString(36).substring(2);
    
    // Génération explicite de l'URL OAuth avec prompt=consent et paramètres anti-cache
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=${encodeURIComponent(scope)}&prompt=consent&access_type=online&nonce=${nonce}&_=${timestamp}`;
    console.log("OAuth URL avec anti-cache:", oauthUrl);

    window.location.href = oauthUrl;
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
