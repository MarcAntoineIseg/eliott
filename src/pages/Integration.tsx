
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
import { AlertCircle, Info, GoogleAds, GoogleSheets, Hubspot } from "lucide-react";

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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Intégrations</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Google Analytics */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <img src="https://www.gstatic.com/analytics-suite/header/suite/v2/ic_analytics.svg" alt="Google Analytics" className="w-10 h-10" />
              <div>
                <CardTitle>Google Analytics</CardTitle>
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
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <GoogleAds size={40} color="#4285F4" />
              <div>
                <CardTitle>Google Ads</CardTitle>
                <CardDescription>Connectez votre compte Google Ads pour récupérer vos campagnes publicitaires.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" disabled>
                Connecter (bientôt disponible)
              </Button>
            </CardContent>
          </Card>
          {/* Google Sheets */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <GoogleSheets size={40} color="#34A853" />
              <div>
                <CardTitle>Google Sheets</CardTitle>
                <CardDescription>Connectez Google Sheets pour automatiser l'export de vos rapports.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" disabled>
                Connecter (bientôt disponible)
              </Button>
            </CardContent>
          </Card>
          {/* Hubspot */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Hubspot size={40} color="#FF7A59" />
              <div>
                <CardTitle>HubSpot</CardTitle>
                <CardDescription>Connectez HubSpot pour croiser vos données marketing.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" disabled>
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
