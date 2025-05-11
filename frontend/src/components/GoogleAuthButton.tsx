
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/services/googleAnalytics";

interface GoogleAuthButtonProps {
  clientId?: string;
  onSuccess?: (response: any) => void;
  onError?: (error: Error) => void;
}

const GoogleAuthButton = ({ clientId }: GoogleAuthButtonProps) => {
  const handleGoogleAuth = () => {
    // Clear existing tokens
    localStorage.removeItem("googleAccessToken");
    localStorage.removeItem("ga_refresh_token");
    localStorage.removeItem("ga_token_expires_at");
    localStorage.removeItem("ga_account_id");
    localStorage.removeItem("ga_property_id");

    // Redirect to the backend OAuth endpoint
    console.log("🔗 Redirecting to backend OAuth endpoint");
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return (
    <Button
      onClick={handleGoogleAuth}
      className="w-full bg-[#f9ab00] hover:bg-[#e09600] text-white"
    >
      <span>Connecter Google Analytics</span>
    </Button>
  );
};

export default GoogleAuthButton;
