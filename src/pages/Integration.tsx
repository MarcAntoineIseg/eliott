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
  const handleConnectMeta = () => window.location.href = "https://api.askeliott.com/auth/meta";
  const handleConnectHubspot = () => window.location.href = "https://api.askeliott.com/auth/hubspot";
  const handleConnectSheets = () => window.location.href = "https://api.askeliott.com/auth/google-sheets";
  const handleConnectShopify = () => window.location.href = "https://api.askeliott.com/auth/shopify";

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-6">Intégrations</h1>

      {/* Google Analytics */}
      <Card className="border rounded-lg shadow mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <img src="https://www.gstatic.com/analytics-suite/header/suite/v2/ic_analytics.svg" className="w-12 h-12" alt="GA" />
            <div>
              <CardTitle>Google Analytics</CardTitle>
              <CardDescription>Connectez votre compte Google Analytics</CardDescription>
            </div>
          </div>

          {connectionStatus === 'disconnected' ? (
            <GoogleAuthButton clientId={CLIENT_ID} />
          ) : connectionStatus === 'connecting' && isInitialLoad ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <>
              <Button variant="outline" onClick={handleLogout} className="w-full mb-4">Déconnecter</Button>
              {accounts.length > 0 && (
                <div className="mb-4">
                  <label className="block mb-2 text-sm font-medium text-gray-700">Sélectionnez un compte</label>
                  <Select value={selectedAccount ?? ""} onValueChange={(val) => setSelectedAccount(val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisissez un compte" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(acct => (
                        <SelectItem key={acct.name} value={acct.name}>{acct.displayName || acct.name}</SelectItem>
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Google Ads */}
      <Card className="border rounded-lg shadow mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <img src="/lovable-uploads/20f2b0c9-e4ee-4bf1-92e5-5431fb8fec91.png" className="w-12 h-12" alt="Google Ads" />
            <div>
              <CardTitle>Google Ads</CardTitle>
              <CardDescription>Connectez votre compte Google Ads</CardDescription>
            </div>
          </div>

          {!googleAdsToken ? (
            <Button onClick={handleConnectGoogleAds} className="w-full bg-blue-600 text-white">
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

      {/* Autres cartes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border rounded-lg shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 mb-4">
              <img src="/lovable-uploads/eeca5120-a156-4d1b-a16a-82810e51ce6a.png" className="w-12 h-12" alt="Meta" />
              <div>
                <CardTitle>Meta Ads</CardTitle>
                <CardDescription>Connectez votre compte Meta Ads</CardDescription>
              </div>
            </div>
            <Button onClick={handleConnectMeta} className="w-full bg-[#1877F2] text-white">
              Connecter Meta Ads
            </Button>
          </CardContent>
        </Card>

        <Card className="border rounded-lg shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 mb-4">
              <img src="/lovable-uploads/1eb64ec7-60ab-434d-95d1-45b61ae3d30d.png" className="w-12 h-12" alt="Hubspot" />
              <div>
                <CardTitle>HubSpot</CardTitle>
                <CardDescription>Connectez votre compte HubSpot</CardDescription>
              </div>
            </div>
            <Button onClick={handleConnectHubspot} className="w-full bg-[#FF7A59] text-white">
              Connecter HubSpot
            </Button>
          </CardContent>
        </Card>

        <Card className="border rounded-lg shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 mb-4">
              <img src="/lovable-uploads/a5d2d998-d3cd-4f60-9128-d43a7fc8377c.png" className="w-12 h-12" alt="Sheets" />
              <div>
                <CardTitle>Google Sheets</CardTitle>
                <CardDescription>Connectez votre compte Google Sheets</CardDescription>
              </div>
            </div>
            <Button onClick={handleConnectSheets} className="w-full bg-[#0F9D58] text-white">
              Connecter Google Sheets
            </Button>
          </CardContent>
        </Card>

        <Card className="border rounded-lg shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 mb-4">
              <img src="/lovable-uploads/ac7b886c-02ac-4f1c-a2e3-114a217db20e.png" className="w-12 h-12" alt="Shopify" />
              <div>
                <CardTitle>Shopify</CardTitle>
                <CardDescription>Connectez votre boutique Shopify</CardDescription>
              </div>
            </div>
            <Button onClick={handleConnectShopify} className="w-full bg-[#95BF47] text-white">
              Connecter Shopify
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Integration;
