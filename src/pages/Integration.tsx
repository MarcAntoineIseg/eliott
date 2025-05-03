import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const GoogleAdsIntegration = () => {
  const [adsToken, setAdsToken] = useState<string | null>(null);
  const [adsCustomerIds, setAdsCustomerIds] = useState<string[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("googleAdsAccessToken");
    if (token) {
      setAdsToken(token);
      localStorage.setItem("googleAdsAccessToken", token);
      toast.success("Connexion Google Ads réussie");
      window.history.replaceState({}, document.title, "/integration");
    } else {
      const saved = localStorage.getItem("googleAdsAccessToken");
      if (saved) setAdsToken(saved);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("googleAdsCustomerId");
    if (saved) setSelectedCustomerId(saved);
  }, []);

  useEffect(() => {
    const fetchAccounts = async () => {
      if (!adsToken) return;
      setIsLoading(true);
      try {
        const res = await fetch(`https://api.askeliott.com/api/google-ads/accounts?token=${adsToken}`);
        const data = await res.json();
        if (data.accounts?.length) {
          setAdsCustomerIds(data.accounts);
          toast.success(`${data.accounts.length} compte(s) Google Ads trouvé(s)`);
        } else {
          toast.info("Aucun compte Google Ads trouvé");
        }
      } catch (err) {
        toast.error("Erreur lors du chargement des comptes Google Ads");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAccounts();
  }, [adsToken]);

  const handleSelect = (id: string) => {
    localStorage.setItem("googleAdsCustomerId", id);
    setSelectedCustomerId(id);
    toast.success("Compte Google Ads sélectionné avec succès !");
  };

  const handleConnectGoogleAds = () => window.location.href = "https://api.askeliott.com/auth/google-ads";

  return (
    <Card className="border-2 border-blue-50 hover:border-blue-100 shadow-lg rounded-2xl overflow-hidden">
      <div className="bg-blue-50/50 p-4 border-b border-blue-100">
        <div className="flex items-center gap-4">
          <img src="/lovable-uploads/20f2b0c9-e4ee-4bf1-92e5-5431fb8fec91.png" alt="Google Ads" className="w-[46px] h-[46px] rounded-lg border bg-white shadow object-contain" />
          <div>
            <CardTitle className="text-lg font-bold text-gray-800">Google Ads</CardTitle>
            <CardDescription className="text-gray-600">Connectez votre compte Google Ads</CardDescription>
          </div>
        </div>
      </div>
      <CardContent className="p-6">
        {!adsToken ? (
          <Button onClick={handleConnectGoogleAds} className="w-full bg-[#4285F4] hover:bg-[#3367D6] text-white">
            Connecter Google Ads
          </Button>
        ) : isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <>
            <Button variant="outline" onClick={() => {
              setAdsToken(null);
              setAdsCustomerIds([]);
              setSelectedCustomerId(null);
              localStorage.removeItem("googleAdsAccessToken");
              localStorage.removeItem("googleAdsCustomerId");
              toast.info("Déconnecté de Google Ads");
            }} className="w-full mb-4">
              Déconnecter
            </Button>
            {adsCustomerIds.length > 0 && (
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Sélectionnez un compte</label>
                <Select value={selectedCustomerId ?? ""} onValueChange={handleSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisissez un compte Google Ads" />
                  </SelectTrigger>
                  <SelectContent>
                    {adsCustomerIds.map(id => (
                      <SelectItem key={id} value={id}>{id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleAdsIntegration;
