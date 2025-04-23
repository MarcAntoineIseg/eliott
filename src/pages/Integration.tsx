import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import PropertyList from "@/components/PropertyList";
import { toast } from "@/components/ui/sonner";
import { CLIENT_ID, GOOGLE_ANALYTICS_SCOPES, GoogleAnalyticsProperty, getAccessTokenFromUrl, fetchGoogleAnalyticsAccounts, fetchGoogleAnalyticsAccountProperties, checkTokenValidity, REDIRECT_URI } from "@/services/googleAnalytics";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { LineChart, BarChart3, Presentation } from "lucide-react";

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

const Integration = () => {
  // GOOGLE ANALYTICS STATE LOGIC CONSERVÉ
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [properties, setProperties] = useState<GoogleAnalyticsProperty[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [accountsLoading, setAccountsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

  useEffect(() => {
    const clearUrlAndProcessToken = () => {
      const token = getAccessTokenFromUrl();
      window.history.replaceState({}, document.title, "/integration");
      if (token) {
        setAccessToken(token);
        setConnectionStatus('connecting');
        checkTokenValidity(token).then(isValid => {
          if (isValid) {
            localStorage.setItem("googleAccessToken", token);
            setConnectionStatus('connected');
            toast.success("Connexion réussie à Google Analytics");
          } else {
            localStorage.removeItem("googleAccessToken");
            setAccessToken(null);
            setConnectionStatus('disconnected');
            setError("Le token d'accès reçu de Google est invalide. Veuillez réessayer.");
            toast.error("Échec de connexion : token invalide");
          }
        });
      } else {
        const storedToken = localStorage.getItem("googleAccessToken");
        if (storedToken) {
          setConnectionStatus('connecting');
          checkTokenValidity(storedToken).then(isValid => {
            if (isValid) {
              setAccessToken(storedToken);
              setConnectionStatus('connected');
              toast.success("Session restaurée");
            } else {
              localStorage.removeItem("googleAccessToken");
              setConnectionStatus('disconnected');
              toast.error("Session expirée. Veuillez vous reconnecter.");
            }
          });
        } else {
          setConnectionStatus('disconnected');
        }
      }
    };
    clearUrlAndProcessToken();
  }, []);

  useEffect(() => {
    if (connectionStatus !== 'connected' || !accessToken) return;
    setAccountsLoading(true);
    setError(null);
    fetchGoogleAnalyticsAccounts().then(
      (accountsData) => {
        setAccounts(accountsData || []);
        if (accountsData.length === 0) {
          toast.info("Aucun compte Google Analytics trouvé.");
        }
      }
    ).catch(err => {
      setError(err.message || "Problème lors de la récupération des comptes Google Analytics.");
      toast.error(err.message || "Erreur lors du chargement des comptes Analytics.");
    }).finally(() => setAccountsLoading(false));
  }, [connectionStatus, accessToken]);

  useEffect(() => {
    if (!accessToken || !selectedAccount || connectionStatus !== "connected") {
      setProperties([]);
      return;
    }
    setIsLoading(true);
    setError(null);

    console.log("Calling fetchGoogleAnalyticsAccountProperties with accountId:", selectedAccount);
    
    // Vérifier si l'accountId est déjà au bon format (accounts/XXX)
    // Si non, la fonction fetchGoogleAnalyticsAccountProperties s'occupera de le formater correctement
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
    setAccessToken(null);
    setAccounts([]);
    setSelectedAccount(null);
    setProperties([]);
    setConnectionStatus('disconnected');
    toast.info("Déconnexion réussie");
  };

  // UI DES INTEGRATIONS
  return (
    <div className="min-h-screen w-full bg-[#f4f6f9]">
      <Navbar />
      <main className="container py-8">
        <h1 className="text-4xl font-extrabold mb-8 text-gray-800">Intégrations</h1>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Google Analytics */}
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
              {connectionStatus !== 'connected' && connectionStatus !== 'connecting' ? (
                <GoogleAuthButton clientId={CLIENT_ID} />
              ) : (
                <Button variant="outline" onClick={handleLogout} className="w-full">Déconnecter</Button>
              )}
              {connectionStatus === "connected" && (
                <div className="mt-4">
                  {accounts.length > 0 && (
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
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Google Ads */}
          <Card className="border-2 border-gray-50 hover:border-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-gray-50/50 p-4 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <LineChart size={48} color="#4285F4" className="rounded-lg bg-white p-2 shadow border" />
                <div>
                  <CardTitle className="text-lg font-bold text-gray-800">Google Ads</CardTitle>
                  <CardDescription className="text-gray-600">Connectez vos campagnes publicitaires</CardDescription>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <Button variant="outline" disabled className="w-full opacity-70 cursor-not-allowed">
                Connecter (bientôt disponible)
              </Button>
            </CardContent>
          </Card>

          {/* Google Sheets */}
          <Card className="border-2 border-green-50 hover:border-green-100 transition-all duration-300 shadow-lg hover:shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-green-50/50 p-4 border-b border-green-100">
              <div className="flex items-center gap-4">
                <BarChart3 size={48} color="#34A853" className="rounded-lg bg-white p-2 shadow border" />
                <div>
                  <CardTitle className="text-lg font-bold text-gray-800">Google Sheets</CardTitle>
                  <CardDescription className="text-gray-600">Exportez vos rapports automatiquement</CardDescription>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <Button variant="outline" disabled className="w-full opacity-70 cursor-not-allowed">
                Connecter (bientôt disponible)
              </Button>
            </CardContent>
          </Card>

          {/* HubSpot */}
          <Card className="border-2 border-orange-50 hover:border-orange-100 transition-all duration-300 shadow-lg hover:shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-orange-50/50 p-4 border-b border-orange-100">
              <div className="flex items-center gap-4">
                <Presentation size={48} color="#FF7A59" className="rounded-lg bg-white p-2 shadow border" />
                <div>
                  <CardTitle className="text-lg font-bold text-gray-800">HubSpot</CardTitle>
                  <CardDescription className="text-gray-600">Gérez vos données marketing</CardDescription>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <Button variant="outline" disabled className="w-full opacity-70 cursor-not-allowed">
                Connecter (bientôt disponible)
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Integration;
