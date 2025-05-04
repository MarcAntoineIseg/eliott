
import { Button } from "@/components/ui/button";

interface GoogleSheetsAuthButtonProps {
  onSuccess?: (response: any) => void;
  onError?: (error: Error) => void;
}

const GoogleSheetsAuthButton = ({ onSuccess, onError }: GoogleSheetsAuthButtonProps) => {
  const handleGoogleSheetsAuth = () => {
    // Clear existing tokens
    localStorage.removeItem("googleSheetsAccessToken");
    localStorage.removeItem("googleSheetsFileId");
    
    window.location.href = "https://api.askeliott.com/auth/google-sheets";
  };

  return (
    <Button
      onClick={handleGoogleSheetsAuth}
      className="w-full bg-[#0F9D58] hover:bg-[#0b8043] text-white"
    >
      <span>Connecter Google Sheets</span>
    </Button>
  );
};

export default GoogleSheetsAuthButton;
