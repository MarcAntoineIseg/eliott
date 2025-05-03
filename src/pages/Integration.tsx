import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import PropertyList from "@/components/PropertyList";
import { toast } from "@/components/ui/sonner";
import {
  CLIENT_ID,
  GoogleAnalyticsProperty,
  getAccessTokenFromUrl,
  fetchGoogleAnalyticsAccounts,
  fetchGoogleAnalyticsAccountProperties,
  checkTokenValidity
} from "@/services/googleAnalytics";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const Integration = () => {
  const [googleAdsToken, setGoogleAdsToken] = useState<string | null>(null);
  const [googleAdsCustomerIds, setGoogleAdsCustomerIds] = useState<string[]>([]);
  const [selectedGoogleAdsCustomerId, setSelectedGoogleAdsCustomerId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [properties, setProperties] = useState<GoogleAnalyticsProperty[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [accountsLoading, setAccountsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>("disconnected");
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("googleAdsAccessToken");
    if (token) {
      setGoogleAdsToken(token);
      localStorage.setItem("googleAdsAccessToken", token);
      toast.success("Connexion Google Ads réussie");
      window.history.replaceState({}, document.title, "/integration");
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("googleAdsCustomerId");
    if (saved) setSelectedGoogleAdsCustomerId(saved);
  }, []);

  useEffect(() => {
    const fetchAccounts = async () => {
      if (!googleAdsToken) return;
      try {
        const res = await fetch(`https://api.askeliott.com/api/google-ads/accounts?token=${googleAdsToken}`);
        const data = await res.json();
        if (data.customerIds?.length) {
          setGoogleAdsCustomerIds(data.customerIds);
          toast.success(`${data.customerIds.length} compte(s) Google Ads trouvé(s)`);
        } else {
          toast.info("Aucun compte Google Ads trouvé");
        }
      } catch (err) {
        toast.error("Erreur lors du chargement des comptes Google Ads");
        console.error(err);
      }
    };
    fetchAccounts();
  }, [googleAdsToken]);

  useEffect(() => {
    const savedAccountId = localStorage.getItem("ga_account_id");
    if (savedAccountId) setSelectedAccount(savedAccountId);
  }, []);

  useEffect(() => {
    const clearUrlAndProcessToken = async () => {
      const token = getAccessTokenFromUrl();
      window.history.replaceState({}, document.title, "/integration");
      const tokenToUse = token || localStorage.getItem("googleAccessToken");
      if (!tokenToUse) return setConnectionStatus("disconnected");
      setConnectionStatus("connecting");
      try {
        const isValid = await checkTokenValidity(tokenToUse);
        if (isValid) {
          if (token) localStorage.setItem("googleAccessToken", token);
          setAccessToken(tokenToUse);
          setConnectionStatus("connected");
          toast.success(token ? "Connexion réussie à Google Analytics" : "Session restaurée");
          loadAccounts(tokenToUse);
        } else {
          localStorage.removeItem("googleAccessToken");
          setAccessToken(null);
          setConnectionStatus("disconnected");
          toast.error(token ? "Échec de connexion : token invalide" : "Session expirée. Veuillez vous reconnecter.");
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du token:", error);
        localStorage.removeItem("googleAccessToken");
        setAccessToken(null);
        setConnectionStatus("disconnected");
        toast.error("Erreur lors de la connexion");
      } finally {
        setIsInitialLoad(false);
      }
    };
    clearUrlAndProcessToken();
  }, []);

  const loadAccounts = async (token: string) => {
    if (!token) return;
    setAccountsLoading(true);
    setError(null);
    try {
      const accountsData = await fetchGoogleAnalyticsAccounts();
      setAccounts(accountsData || []);
      const savedAccountId = localStorage.getItem("ga_account_id");
      if (savedAccountId && accountsData.some(acc => acc.name === savedAccountId)) {
        setSelectedAccount(savedAccountId);
      } else if (accountsData.length === 1) {
        setSelectedAccount(accountsData[0].name);
      } else if (accountsData.length === 0) {
        toast.info("Aucun compte Google Analytics trouvé.");
      }
    } catch (err: any) {
      console.error("Erreur lors du chargement des comptes:", err);
      setError(err.message || "Problème lors de la récupération des comptes Google Analytics.");
      toast.error(err.message || "Erreur lors du chargement des comptes Analytics.");
    } finally {
      setAccountsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("googleAccessToken");
    localStorage.removeItem("ga_property_id");
    localStorage.removeItem("ga_account_id");
    setAccessToken(null);
    setAccounts([]);
    setSelectedAccount(null);
    setProperties([]);
    setConnectionStatus("disconnected");
    toast.info("Déconnexion réussie");
  };

  const handleLoadAnalytics = (property: GoogleAnalyticsProperty) => {
    if (!property?.id || !selectedAccount) return toast.error("Propriété ou compte non défini");
    localStorage.setItem("ga_property_id", property.id);
    localStorage.setItem("ga_account_id", selectedAccount);
    toast.success("Propriété sélectionnée enregistrée avec succès !");
  };

  const handleGoogleAdsSelect = (id: string) => {
    localStorage.setItem("googleAdsCustomerId", id);
    setSelectedGoogleAdsCustomerId(id);
    toast.success("Compte Google Ads sélectionné avec succès !");
  };

  const handleConnectGoogleAds = () => window.location.href = "https://api.askeliott.com/auth/google-ads";

  return (
    <div className="min-h-screen w-full bg-[#f4f6f9]">
      <main className="container py-8">
        <h1 className="text-4xl font-extrabold mb-8 text-gray-800">Intégrations</h1>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">

          {/* Carte Google Ads */}
          <Card className="border-2 border-blue-50 hover:border-blue-100 transition-all duration-300 shadow-lg hover:shadow-xl rounded-2xl overflow-hidden">
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
              {!googleAdsToken ? (
                <Button onClick={handleConnectGoogleAds} className="w-full bg-[#4285F4] hover:bg-[#3367D6] text-white">
                  Connecter Google Ads
                </Button>
              ) : (
                <>
                  <Button onClick={() => {
                    setGoogleAdsToken(null);
                    setGoogleAdsCustomerIds([]);
                    setSelectedGoogleAdsCustomerId(null);
                    localStorage.removeItem("googleAdsAccessToken");
                    localStorage.removeItem("googleAdsCustomerId");
                    toast.info("Déconnecté de Google Ads");
                  }} className="w-full mb-4">
                    Déconnecter
                  </Button>
                  {googleAdsCustomerIds.length > 0 && (
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">Sélectionnez un compte</label>
                      <Select value={selectedGoogleAdsCustomerId ?? ""} onValueChange={handleGoogleAdsSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisissez un compte Google Ads" />
                        </SelectTrigger>
                        <SelectContent>
                          {googleAdsCustomerIds.map(id => (
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

          {/* 👉 Tu peux réintégrer ici les autres cartes comme Meta Ads, HubSpot, etc. */}

        </div>
      </main>
    </div>
  );
};

export default Integration;
