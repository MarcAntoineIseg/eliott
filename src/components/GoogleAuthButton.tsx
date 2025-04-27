import { Button } from "@/components/ui/button";
import { Cloud } from "lucide-react";
import { GOOGLE_ANALYTICS_SCOPES, REDIRECT_URI } from "@/services/googleAnalytics";

interface GoogleAuthButtonProps {
  clientId: string;
  onSuccess?: (response: any) => void;
  onError?: (error: Error) => void;
}

const GoogleAuthButton = ({ clientId }: GoogleAuthButtonProps) => {
  const handleGoogleAuth = () => {
    // Clear existing tokens
    localStorage.removeItem("googleAccessToken");
    localStorage.removeItem("ga_refresh_token");
    localStorage.removeItem("ga_account_id");
    localStorage.removeItem("ga_property_id");

    const redirectUri = REDIRECT_URI;
    const scope = GOOGLE_ANALYTICS_SCOPES.join(" ");

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scope,
      response_type: 'token', // ✅ on reste sur 'token' pour recevoir l'access_token directement
      prompt: 'consent select_account', // ✅ pour forcer l'utilisateur à rechoisir son compte et donner son consentement
      state: `${Math.random().toString(36).substring(2)}_${Date.now()}`
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    console.log("🔗 Redirection vers:", authUrl);

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
