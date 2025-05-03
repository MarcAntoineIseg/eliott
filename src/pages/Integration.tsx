import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import PropertyList from "@/components/PropertyList";
import { toast } from "@/components/ui/sonner";
import { CLIENT_ID, GoogleAnalyticsProperty, getAccessTokenFromUrl, fetchGoogleAnalyticsAccounts, fetchGoogleAnalyticsAccountProperties, checkTokenValidity } from "@/services/googleAnalytics";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { LineChart, BarChart3, Presentation } from "lucide-react";
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

  // Load saved account when component mounts
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

          token ? toast.error("Échec de connexion : token invalide") : toast.error("Session expirée. Veuillez vous reconnecter.");
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du token:", error);
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

  const loadAccounts = async (token: string) => {
    if (!token) return;

    setAccountsLoading(true);
    setError(null);

    try {
      const accountsData = await fetchGoogleAnalyticsAccounts();
      setAccounts(accountsData || []);

      // Check for saved account ID
      const savedAccountId = localStorage.getItem("ga_account_id");
      if (savedAccountId) {
        // Verify the saved account exists in the returned accounts
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
    setConnectionStatus('disconnected');
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

  const handleConnectMetaAds = () => {
    toast.info("La connexion à Meta Ads n'est pas encore implémentée");
  };

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
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-36" />
                          <Skeleton className="h-4 w-12" />
                        </div>
                        <Skeleton className="h-10 w-full" />
                        <div className="pt-3">
                          <Skeleton className="h-4 w-48 mb-2" />
                          <Skeleton className="h-48 w-full" />
                        </div>
                      </div>
                    ) : accounts.length > 0 && (
                      <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium text-gray-700">Sélectionnez un compte</label>
                        <Select 
                          value={selectedAccount ?? ""} 
                          onValueChange={(val) => setSelectedAccount(val)}>
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
                <img src="https://img.freepik.com/free-vector/meta-social-media-design_23-2150333030.jpg" alt="Meta Ads" className="w-12 h-12 rounded-lg border bg-white shadow object-cover" />
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
              <div className="mt-4 text-center text-sm text-gray-500">
                <p>Visualisez et analysez vos campagnes publicitaires Meta</p>
                <div className="flex justify-center gap-4 mt-4">
                  <div className="flex flex-col items-center">
                    <BarChart3 className="h-8 w-8 text-gray-400" />
                    <span className="text-xs mt-1">Statistiques</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <LineChart className="h-8 w-8 text-gray-400" />
                    <span className="text-xs mt-1">Performance</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Presentation className="h-8 w-8 text-gray-400" />
                    <span className="text-xs mt-1">Campagnes</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Integration;
