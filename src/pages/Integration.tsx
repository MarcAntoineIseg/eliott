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
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [properties, setProperties] = useState<GoogleAnalyticsProperty[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [accountsLoading, setAccountsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>("disconnected");
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const [googleAdsToken, setGoogleAdsToken] = useState<string | null>(null);
  const [googleAdsCustomerIds, setGoogleAdsCustomerIds] = useState<string[]>([]);

  useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const googleAdsToken = params.get("googleAdsAccessToken");
  if (googleAdsToken) {
    localStorage.setItem("googleAdsAccessToken", googleAdsToken);
    setGoogleAdsToken(googleAdsToken);
    toast.success("Connexion réussie à Google Ads");
    window.history.replaceState({}, document.title, "/integration");
    }
  }, []);

  useEffect(() => {
  const fetchGoogleAdsAccounts = async () => {
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
      console.error("Erreur récupération comptes Google Ads:", err);
      toast.error("Erreur Google Ads API");
    }
  };
  fetchGoogleAdsAccounts();
}, [googleAdsToken]);

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

  useEffect(() => {
    if (!accessToken || !selectedAccount || connectionStatus !== "connected") {
      setProperties([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    fetchGoogleAnalyticsAccountProperties(selectedAccount)
      .then(propertiesData => {
        const propsList = (propertiesData || []).map((prop: any) => ({
          id: prop.name ? prop.name.split("/").pop() : prop.id,
          name: prop.displayName,
          url: prop.webLink,
          createdAt: prop.createTime,
        }));
        setProperties(propsList);
        toast[propsList.length ? 'success' : 'info'](
          propsList.length ? `${propsList.length} propriété(s) Google Analytics trouvée(s)` : "Aucune propriété trouvée pour ce compte."
        );
      })
      .catch(err => {
        setError(err.message || "Impossible de charger les propriétés pour ce compte.");
        setProperties([]);
        toast.error(err.message || "Erreur lors du chargement des propriétés.");
      })
      .finally(() => setIsLoading(false));
  }, [accessToken, selectedAccount, connectionStatus]);

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

  const handleConnectMetaAds = () => window.location.href = "https://api.askeliott.com/auth/meta";
  const handleConnectGoogleAds = () => window.location.href = "https://api.askeliott.com/auth/google-ads";
  const handleConnectHubspot = () => window.location.href = "https://api.askeliott.com/auth/hubspot";
  const handleConnectGoogleSheets = () => window.location.href = "https://api.askeliott.com/auth/google-sheets";
  const handleConnectShopify = () => window.location.href = "https://api.askeliott.com/auth/shopify";

  return (
    <div className="min-h-screen w-full bg-[#f4f6f9]">
      <main className="container py-8">
        <h1 className="text-4xl font-extrabold mb-8 text-gray-800">Intégrations</h1>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">

          {/* Google Analytics Card */}
          <Card className="border-2 border-blue-50 hover:border-blue-100 transition-all duration-300 shadow-lg hover:shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-blue-50/50 p-4 border-b border-blue-100">
              <div className="flex items-center gap-4">
                <img src="https://www.gstatic.com/analytics-suite/header/suite/v2/ic_analytics.svg" alt="Google Analytics" className="w-12 h-12 rounded-lg border bg-white shadow" />
                <div>
                  <CardTitle className="text-lg font-bold text-gray-800">Google Analytics</CardTitle>
                  <CardDescription className="text-gray-600">Connectez votre compte Google Analytics</CardDescription>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              {connectionStatus === 'disconnected' ? (
                <GoogleAuthButton clientId={CLIENT_ID} />
              ) : connectionStatus === 'connecting' && isInitialLoad ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 rounded-full bg-blue-200 animate-pulse"></div>
                    <span>Vérification de la connexion...</span>
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <Button variant="outline" onClick={handleLogout} className="w-full">Déconnecter</Button>
                  <div className="mt-4">
                    {accountsLoading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-4 w-48 mb-2" />
                        <Skeleton className="h-48 w-full" />
                      </div>
                    ) : accounts.length > 0 && (
                      <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium text-gray-700">Sélectionnez un compte</label>
                        <Select value={selectedAccount ?? ""} onValueChange={(val) => setSelectedAccount(val)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisissez un compte" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map(acct => (
                              <SelectItem key={acct.name} value={acct.name}>
                                {acct.displayName || acct.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <PropertyList
                      properties={properties}
                      isLoading={isLoading}
                      accessToken={accessToken}
                      error={error}
                      selectedAccount={selectedAccount}
                      onSelectProperty={handleLoadAnalytics}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Meta Ads Card */}
          <Card className="border-2 border-blue-50 hover:border-blue-100 transition-all duration-300 shadow-lg hover:shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-blue-50/50 p-4 border-b border-blue-100">
              <div className="flex items-center gap-4">
                <img src="/lovable-uploads/eeca5120-a156-4d1b-a16a-82810e51ce6a.png" alt="Meta Ads" className="w-[46px] h-[46px] rounded-lg border bg-white shadow object-contain" />
                <div>
                  <CardTitle className="text-lg font-bold text-gray-800">Meta Ads</CardTitle>
                  <CardDescription className="text-gray-600">Connectez votre compte Meta Ads</CardDescription>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <Button onClick={handleConnectMetaAds} className="w-full bg-[#1877F2] hover:bg-[#0e64d3] text-white">
                Connecter Meta Ads
              </Button>
            </CardContent>
          </Card>

          {/* HubSpot Card */}
          <Card className="border-2 border-blue-50 hover:border-blue-100 transition-all duration-300 shadow-lg hover:shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-blue-50/50 p-4 border-b border-blue-100">
              <div className="flex items-center gap-4">
                <img src="/lovable-uploads/1eb64ec7-60ab-434d-95d1-45b61ae3d30d.png" alt="HubSpot" className="w-[46px] h-[46px] rounded-lg border bg-white shadow object-contain" />
                <div>
                  <CardTitle className="text-lg font-bold text-gray-800">HubSpot</CardTitle>
                  <CardDescription className="text-gray-600">Connectez votre compte HubSpot</CardDescription>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <Button onClick={handleConnectHubspot} className="w-full bg-[#FF7A59] hover:bg-[#f06845] text-white">
                Connecter HubSpot
              </Button>
            </CardContent>
          </Card>

          {/* Google Ads Card */}
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
              <Button onClick={handleConnectGoogleAds} className="w-full bg-[#4285F4] hover:bg-[#3367D6] text-white">
                Connecter Google Ads
              </Button>
            </CardContent>
          </Card>

          {/* Google Sheets Card */}
          <Card className="border-2 border-blue-50 hover:border-blue-100 transition-all duration-300 shadow-lg hover:shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-blue-50/50 p-4 border-b border-blue-100">
              <div className="flex items-center gap-4">
                <img src="/lovable-uploads/a5d2d998-d3cd-4f60-9128-d43a7fc8377c.png" alt="Google Sheets" className="w-[46px] h-[46px] rounded-lg border bg-white shadow object-contain" />
                <div>
                  <CardTitle className="text-lg font-bold text-gray-800">Google Sheets</CardTitle>
                  <CardDescription className="text-gray-600">Connectez votre compte Google Sheets</CardDescription>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <Button onClick={handleConnectGoogleSheets} className="w-full bg-[#0F9D58] hover:bg-[#0b8043] text-white">
                Connecter Google Sheets
              </Button>
            </CardContent>
          </Card>

          {/* Shopify Card */}
          <Card className="border-2 border-blue-50 hover:border-blue-100 transition-all duration-300 shadow-lg hover:shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-blue-50/50 p-4 border-b border-blue-100">
              <div className="flex items-center gap-4">
                <img src="/lovable-uploads/ac7b886c-02ac-4f1c-a2e3-114a217db20e.png" alt="Shopify" className="w-[46px] h-[46px] rounded-lg border bg-white shadow object-contain" />
                <div>
                  <CardTitle className="text-lg font-bold text-gray-800">Shopify</CardTitle>
                  <CardDescription className="text-gray-600">Connectez votre boutique Shopify</CardDescription>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <Button onClick={handleConnectShopify} className="w-full bg-[#95BF47] hover:bg-[#7ea83b] text-white">
                Connecter Shopify
              </Button>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
};

export default Integration;
