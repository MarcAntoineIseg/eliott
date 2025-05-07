
import { Button } from "@/components/ui/button";

interface GoogleAdsAuthButtonProps {
  onSuccess?: (response: any) => void;
  onError?: (error: Error) => void;
}

const GoogleAdsAuthButton = ({ onSuccess, onError }: GoogleAdsAuthButtonProps) => {
  const handleGoogleAdsAuth = () => {
    // Clear existing tokens
    localStorage.removeItem("googleAdsAccessToken");
    localStorage.removeItem("googleAdsCustomerId");
    
    window.location.href = "https://api.askeliott.com/auth/google-ads";
  };

  return (
    <Button
      onClick={handleGoogleAdsAuth}
      className="w-full bg-[#4285F4] hover:bg-[#3367D6] text-white"
    >
      <span>Connecter Google Ads</span>
    </Button>
  );
};

export default GoogleAdsAuthButton;
