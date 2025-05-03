import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import PropertyList from "@/components/PropertyList";
import { toast } from "@/components/ui/sonner";
import { CLIENT_ID, GoogleAnalyticsProperty, getAccessTokenFromUrl, fetchGoogleAnalyticsAccounts, fetchGoogleAnalyticsAccountProperties, checkTokenValidity } from "@/services/googleAnalytics";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

const Integration = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [properties, setProperties] = useState<GoogleAnalyticsProperty[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [accountsLoading, setAccountsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const isMetaConnected = !!localStorage.getItem("metaAccessToken");

  useEffect(() => {
    const savedAccountId = localStorage.getItem("ga_account_id");
    if (savedAccountId) {
      setSelectedAccount(savedAccountId);
    }
  }, []);

  useEffect(() => {
    const clearUrlAndProcessToken = async () => {
      const token = getAccessTokenFromUrl();
      window.history.replaceState({}, document.title, "/integration");

      const tokenToUse = token || localStorage.getItem("googleAccessToken");
      if (!tokenToUse) {
        setConnectionStatus('disconnected');
        return;
      }

      setConnectionStatus('connecting');
      try {
        const isValid = await checkTokenValidity(tokenToUse);
        if (isValid) {
          if (token) {
            localStorage.setItem("googleAccessToken", token);
          }

          setAccessToken(tokenToUse);
          setConnectionStatus('connected');

          token ? toast.success("Connexion réussie à Google Analytics") : toast.success("Session restaurée");
          loadAccounts(tokenToUse);
        } else {
          localStorage.removeItem("googleAccessToken");
          setAccessToken(null);
          setConnectionStatus('disconnected');

          token ? toast.error("\u00c9chec de connexion : token invalide") : toast.error("Session expir\u00e9e. Veuillez vous reconnecter.");
        }
      } catch (error) {
        console.error("Erreur lors de la v\u00e9rification du token:", error);
        localStorage.removeItem("googleAccessToken");
        setAccessToken(null);
        setConnectionStatus('disconnected');
        toast.error("Erreur lors de la connexion");
      } finally {
        setIsInitialLoad(false);
      }
    };

    clearUrlAndProcessToken();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const metaAccessToken = params.get("metaAccessToken");
    const metaAdAccount = params.get("metaAdAccount");

    if (metaAccessToken && metaAdAccount) {
      localStorage.setItem("metaAccessToken", metaAccessToken);
      localStorage.setItem("metaAdAccount", metaAdAccount);
      toast.success("✅ Connexion réussie à Meta Ads");
      window.history.replaceState({}, document.title, "/integration");
    }
  }, []);

  const loadAccounts = async (token: string) => {
    if (!token) return;

    setAccountsLoading(true);
    setError(null);

    try {
      const accountsData = await fetchGoogleAnalyticsAccounts();
      setAccounts(accountsData || []);

      const savedAccountId = localStorage.getItem("ga_account_id");
      if (savedAccountId) {
        const accountExists = accountsData.some(acc => acc.name === savedAccountId);
        if (accountExists) {
          setSelectedAccount(savedAccountId);
        } else if (accountsData.length === 1) {
          setSelectedAccount(accountsData[0].name);
        }
      } else if (accountsData.length === 1) {
        setSelectedAccount(accountsData[0].name);
      } else if (accountsData.length === 0) {
        toast.info("Aucun compte Google Analytics trouv\u00e9.");
      }
    } catch (err: any) {
      console.error("Erreur lors du chargement des comptes:", err);
      setError(err.message || "Probl\u00e8me lors de la r\u00e9cup\u00e9ration des comptes Google Analytics.");
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

        if (propsList.length === 0) {
          toast.info("Aucune propri\u00e9t\u00e9 trouv\u00e9e pour ce compte.");
        } else {
          toast.success(`${propsList.length} propri\u00e9t\u00e9(s) Google Analytics trouv\u00e9e(s)`);
        }
      })
      .catch(err => {
        setError(err.message || "Impossible de charger les propri\u00e9t\u00e9s pour ce compte.");
        setProperties([]);
        toast.error(err.message || "Erreur lors du chargement des propri\u00e9t\u00e9s.");
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
    setConnectionStatus('disconnected');
    toast.info("D\u00e9connexion r\u00e9ussie");
  };

  const handleLoadAnalytics = (property: GoogleAnalyticsProperty) => {
    if (!property?.id || !selectedAccount) {
      toast.error("Propri\u00e9t\u00e9 ou compte non d\u00e9fini");
      return;
    }

    localStorage.setItem("ga_property_id", property.id);
    localStorage.setItem("ga_account_id", selectedAccount);
    toast.success("Propri\u00e9t\u00e9 s\u00e9lectionn\u00e9e enregistr\u00e9e avec succ\u00e8s !");
  };

  const handleConnectMetaAds = () => {
    window.location.href = "https://app.askeliott.com/auth/meta";
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f6f9]">
      <main className="container py-8">
        <h1 className="text-4xl font-extrabold mb-8 text-gray-800">Int\u00e9grations</h1>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Google Analytics Card */}
          {/* ... (inchang\u00e9) */}

          {/* Meta Ads Card */}
          <Card className="border-2 border-blue-50 hover:border-blue-100 transition-all duration-300 shadow-lg hover:shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-blue-50/50 p-4 border-b border-blue-100">
              <div className="flex items-center gap-4">
                <img 
                  src="/lovable-uploads/eeca5120-a156-4d1b-a16a-82810e51ce6a.png" 
                  alt="Meta Ads" 
                  className="w-[46px] h-[46px] rounded-lg border bg-white shadow object-contain" 
                />
                <div>
                  <CardTitle className="text-lg font-bold text-gray-800">Meta Ads</CardTitle>
                  <CardDescription className="text-gray-600">Connectez votre compte Meta Ads</CardDescription>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              {isMetaConnected && (
                <p className="text-sm text-green-600 mb-4">
                  ✅ Compte Meta connect\u00e9
                </p>
              )}
              <Button onClick={handleConnectMetaAds} className="w-full bg-[#1877F2] hover:bg-[#0e64d3] text-white">
                Connecter Meta Ads
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Integration;
