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
    localStorage.removeItem("ga_refresh_token");
    localStorage.removeItem("ga_account_id");
    localStorage.removeItem("ga_property_id");

    const redirectUri = REDIRECT_URI;
    const scope = GOOGLE_ANALYTICS_SCOPES.join(" ");

    console.log("Redirecting to Google Auth with scopes:", scope);
    console.log("Using redirect_uri:", redirectUri);

    // Construire les bons paramètres pour forcer le refresh_token
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scope,
      response_type: 'code', // ✅ Pas 'token', mais 'code'
      access_type: 'offline', // ✅ pour obtenir un refresh_token
      prompt: 'consent select_account', // ✅ pour forcer l'affichage du choix de compte et demander un nouveau consentement
      state: `${Math.random().toString(36).substring(2)}_${Date.now()}`
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    console.log("Auth URL:", authUrl);

    window.location.href = authUrl;
  };

  return (
    <Button 
      onClick={handleGoogleAuth} 
      className="bg-white text-gray-800 hover:bg-gray-100 border border-gray-300 shadow-sm flex items-center gap-2 w-full"
    >
      <Cloud size={20} />
      <span>Se connecter avec Google Analytics</span>
    </Button>
  );
};

export default GoogleAuthButton;
