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

  const handleGoogleAdsSelect = (id: string) => {
    localStorage.setItem("googleAdsCustomerId", id);
    setSelectedGoogleAdsCustomerId(id);
    toast.success("Compte Google Ads sélectionné avec succès !");
  };

  const handleConnectGoogleAds = () => window.location.href = "https://api.askeliott.com/auth/google-ads";

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-6">Intégrations</h1>

      {/* Google Analytics */}
      <Card className="border rounded-lg shadow mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <img src="https://www.gstatic.com/analytics-suite/header/suite/v2/ic_analytics.svg" className="w-12 h-12" alt="Google Analytics" />
            <div>
              <CardTitle>Google Analytics</CardTitle>
              <CardDescription>Connectez votre compte Google Analytics</CardDescription>
            </div>
          </div>

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
              <Button variant="outline" onClick={handleLogout} className="w-full mb-4">Déconnecter</Button>
              {accountsLoading ? (
                <Skeleton className="h-10 w-full mb-4" />
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Integration;
