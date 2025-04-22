
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import PropertyList from "@/components/PropertyList";
import { toast } from "@/components/ui/sonner";
import { CLIENT_ID, GOOGLE_ANALYTICS_SCOPES, GoogleAnalyticsProperty, getAccessTokenFromUrl, fetchGoogleAnalyticsAccounts, fetchGoogleAnalyticsAccountProperties, checkTokenValidity } from "@/services/googleAnalytics";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Info, LineChart, BarChart3, Presentation } from "lucide-react";

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

const INTEGRATION_CARD_GRADIENTS = [
  "bg-gradient-to-tr from-[#E5DEFF] via-white to-[#D3E4FD]",
  "bg-gradient-to-tr from-[#FEFAF6] via-[#E7F0FD] to-[#F1F0FB]",
  "bg-gradient-to-tr from-[#fdfcfb] via-[#e2d1c3] to-[#fbeee6]",
  "bg-gradient-to-tr from-[#FFE29F] via-[#FFA99F] to-[#FF719A]",
];

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
    <div className="min-h-screen w-full bg-gradient-to-tr from-[#faf8ff] via-[#f5f9ff] to-[#eef2fb]">
      <Navbar />
      <main className="container py-8">
        <h1 className="text-4xl font-extrabold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-300 drop-shadow-sm">Intégrations</h1>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Google Analytics */}
          <Card className={`transition-all duration-200 border-0 shadow-xl hover:shadow-2xl hover:scale-105 ${INTEGRATION_CARD_GRADIENTS[0]} relative`}>
            <div className="absolute top-0 right-0 left-0 h-2 rounded-t-lg bg-gradient-to-r from-[#9b87f5] via-[#7e69ab] to-[#0ea5e9] opacity-60" />
            <CardHeader className="flex flex-row items-center gap-4 border-b border-muted/40">
              <img src="https://www.gstatic.com/analytics-suite/header/suite/v2/ic_analytics.svg" alt="Google Analytics" className="w-12 h-12 rounded-lg border bg-white shadow" />
              <div>
                <CardTitle className="text-lg font-bold text-primary">Google Analytics</CardTitle>
                <CardDescription>Connectez votre compte Google Analytics pour récupérer vos données Insights.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {connectionStatus !== 'connected' && connectionStatus !== 'connecting' ? (
                <GoogleAuthButton clientId={CLIENT_ID} />
              ) : (
                <Button variant="outline" onClick={handleLogout}>Déconnecter</Button>
              )}
              {connectionStatus === "connected" && (
                <div className="mt-4">
                  {accounts.length > 0 && (
                    <div className="mb-4">
                      <label className="block mb-2 text-sm font-medium">Sélectionnez un compte</label>
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
          <Card className={`transition-all duration-200 border-0 shadow-xl hover:shadow-2xl hover:scale-105 ${INTEGRATION_CARD_GRADIENTS[1]} relative`}>
            <div className="absolute top-0 right-0 left-0 h-2 rounded-t-lg bg-gradient-to-r from-[#4285F4] via-[#8B5CF6] to-[#7E69AB] opacity-50" />
            <CardHeader className="flex flex-row items-center gap-4 border-b border-muted/40">
              <LineChart size={48} color="#4285F4" className="rounded-lg bg-white p-2 shadow border" />
              <div>
                <CardTitle className="text-lg font-bold text-primary">Google Ads</CardTitle>
                <CardDescription>Connectez votre compte Google Ads pour récupérer vos campagnes publicitaires.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" disabled className="opacity-70 cursor-not-allowed">
                Connecter (bientôt disponible)
              </Button>
            </CardContent>
          </Card>
          {/* Google Sheets */}
          <Card className={`transition-all duration-200 border-0 shadow-xl hover:shadow-2xl hover:scale-105 ${INTEGRATION_CARD_GRADIENTS[2]} relative`}>
            <div className="absolute top-0 right-0 left-0 h-2 rounded-t-lg bg-gradient-to-r from-[#34A853] via-[#9b87f5] to-[#FFA99F] opacity-40" />
            <CardHeader className="flex flex-row items-center gap-4 border-b border-muted/40">
              <BarChart3 size={48} color="#34A853" className="rounded-lg bg-white p-2 shadow border" />
              <div>
                <CardTitle className="text-lg font-bold text-primary">Google Sheets</CardTitle>
                <CardDescription>Connectez Google Sheets pour automatiser l'export de vos rapports.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" disabled className="opacity-70 cursor-not-allowed">
                Connecter (bientôt disponible)
              </Button>
            </CardContent>
          </Card>
          {/* Hubspot */}
          <Card className={`transition-all duration-200 border-0 shadow-xl hover:shadow-2xl hover:scale-105 ${INTEGRATION_CARD_GRADIENTS[3]} relative`}>
            <div className="absolute top-0 right-0 left-0 h-2 rounded-t-lg bg-gradient-to-r from-[#FF7A59] via-[#FFA99F] to-[#FF719A] opacity-60" />
            <CardHeader className="flex flex-row items-center gap-4 border-b border-muted/40">
              <Presentation size={48} color="#FF7A59" className="rounded-lg bg-white p-2 shadow border" />
              <div>
                <CardTitle className="text-lg font-bold text-primary">HubSpot</CardTitle>
                <CardDescription>Connectez HubSpot pour croiser vos données marketing.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" disabled className="opacity-70 cursor-not-allowed">
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

