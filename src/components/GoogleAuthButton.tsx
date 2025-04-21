
import { Button } from "@/components/ui/button";
import { Cloud } from "lucide-react";

interface GoogleAuthButtonProps {
  clientId: string;
  onSuccess?: (response: any) => void;
  onError?: (error: Error) => void;
}

const GoogleAuthButton = ({ clientId, onSuccess, onError }: GoogleAuthButtonProps) => {
  const handleGoogleAuth = () => {
    // Redirection vers l'authentification Google
    const redirectUri = window.location.origin + "/dashboard";
    const scope = "https://www.googleapis.com/auth/analytics.readonly";
    
    const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=token&prompt=consent`;
    
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
