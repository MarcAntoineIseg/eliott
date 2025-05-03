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
  checkTokenValidity,
} from "@/services/googleAnalytics";
import { fetchGoogleAdsCustomerInfo } from "@/services/googleAds";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
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

  const [googleAdsConnected, setGoogleAdsConnected] = useState(false);
  const [googleAdsCustomerId, setGoogleAdsCustomerId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleAdsToken = params.get("googleAdsAccessToken");

    if (googleAdsToken) {
      fetchGoogleAdsCustomerInfo(googleAdsToken)
        .then((customerId) => {
          if (customerId) {
            localStorage.setItem("googleAdsAccessToken", googleAdsToken);
            localStorage.setItem("googleAdsCustomerId", customerId);
            setGoogleAdsCustomerId(customerId);
            setGoogleAdsConnected(true);
            toast.success("Connexion réussie à Google Ads");
          } else {
            toast.error("Aucun compte Google Ads trouvé.");
          }
        })
        .catch(() => toast.error("Erreur lors de la récupération des données Google Ads"));

      window.history.replaceState({}, document.title, "/integration");
    } else {
      const savedId = localStorage.getItem("googleAdsCustomerId");
      if (savedId) {
        setGoogleAdsCustomerId(savedId);
        setGoogleAdsConnected(true);
      }
    }
  }, []);

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
        setConnectionStatus("disconnected");
        return;
      }

      setConnectionStatus("connecting");
      try {
        const isValid = await checkTokenValidity(tokenToUse);
        if (isValid) {
          if (token) {
            localStorage.setItem("googleAccessToken", token);
          }

          setAccessToken(tokenToUse);
          setConnectionStatus("connected");

          token
            ? toast.success("Connexion réussie à Google Analytics")
            : toast.success("Session restaurée");

          loadAccounts(tokenToUse);
        } else {
          localStorage.removeItem("googleAccessToken");
          setAccessToken(null);
          setConnectionStatus("disconnected");

          token
            ? toast.error("Échec de connexion : token invalide")
            : toast.error("Session expirée. Veuillez vous reconnecter.");
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

        if (propsList.length === 0) {
          toast.info("Aucune propriété trouvée pour ce compte.");
        } else {
          toast.success(`${propsList.length} propriété(s) Google Analytics trouvée(s)`);
        }
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
    if (!property?.id || !selectedAccount) {
      toast.error("Propriété ou compte non défini");
      return;
    }
    localStorage.setItem("ga_property_id", property.id);
    localStorage.setItem("ga_account_id", selectedAccount);
    toast.success("Propriété sélectionnée enregistrée avec succès !");
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f6f9]">
      <main className="container py-8">
        <h1 className="text-4xl font-extrabold mb-8 text-gray-800">Intégrations</h1>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Google Ads Card */}
          <Card className="border-2 border-blue-50 hover:border-blue-100 transition-all duration-300 shadow-lg hover:shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-blue-50/50 p-4 border-b border-blue-100">
              <div className="flex items-center gap-4">
                <img
                  src="/lovable-uploads/20f2b0c9-e4ee-4bf1-92e5-5431fb8fec91.png"
                  alt="Google Ads"
                  className="w-[46px] h-[46px] rounded-lg border bg-white shadow object-contain"
                />
                <div>
                  <CardTitle className="text-lg font-bold text-gray-800">Google Ads</CardTitle>
                  <CardDescription className="text-gray-600">Connectez votre compte Google Ads</CardDescription>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              {googleAdsConnected && googleAdsCustomerId ? (
                <>
                  <p className="text-green-700 mb-4">Connecté (ID : {googleAdsCustomerId})</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      localStorage.removeItem("googleAdsAccessToken");
                      localStorage.removeItem("googleAdsCustomerId");
                      setGoogleAdsConnected(false);
                      setGoogleAdsCustomerId(null);
                      toast.info("Déconnecté de Google Ads");
                    }}
                    className="w-full"
                  >
                    Déconnecter
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => window.location.href = "https://api.askeliott.com/auth/google-ads"}
                  className="w-full bg-[#4285F4] hover:bg-[#3367D6] text-white"
                >
                  Connecter Google Ads
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Integration;