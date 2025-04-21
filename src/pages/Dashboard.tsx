import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Navbar from "@/components/Navbar";
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AlertCircle, Info } from "lucide-react";

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

const Dashboard = () => {
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
      window.history.replaceState({}, document.title, "/dashboard");
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
        console.error("Erreur de chargement des propriétés:", err);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        {connectionStatus === 'connecting' && (
          <div className="flex justify-center items-center my-8">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 w-8 mb-4 rounded-full bg-blue-200 animate-spin"></div>
              <div>Vérification de l'authentification...</div>
            </div>
          </div>
        )}

        {connectionStatus !== 'connected' && connectionStatus !== 'connecting' ? (
          <Card>
            <CardHeader>
              <CardTitle>Connectez votre compte Google Analytics</CardTitle>
              <CardDescription>
                Connectez-vous avec Google pour accéder à vos propriétés Google Analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoogleAuthButton clientId={CLIENT_ID} />
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erreur de connexion</AlertTitle>
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              <div className="mt-4 text-sm text-gray-500">
                <p>Assurez-vous que :</p>
                <ul className="list-disc pl-5 mt-2">
                  <li>Votre compte Google a accès à Google Analytics</li>
                  <li>Vous avez autorisé l'URL de redirection <code>{window.location.origin}/dashboard</code> dans la console Google Cloud</li>
                  <li>Vous avez activé l'API Google Analytics Admin ET l'API Google Analytics Data dans votre projet Google Cloud</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {connectionStatus === 'connected' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Vos comptes Google Analytics</h2>
              <Button variant="outline" onClick={handleLogout}>
                Déconnecter
              </Button>
            </div>

            {accountsLoading &&
              <div className="flex justify-center items-center my-8">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-8 w-8 mb-4 rounded-full bg-blue-200 animate-spin"></div>
                  <div>Chargement des comptes Google Analytics...</div>
                </div>
              </div>
            }

            {accounts.length > 0 && (
              <div className="mb-6 max-w-md">
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

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>{error}</p>
                  <p className="text-sm">
                    Cette erreur peut indiquer un problème d'accès aux données ou de configuration API.
                    Vérifiez les autorisations de votre compte Google et l'activation des APIs requises.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {!error && (
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Statut de connexion</AlertTitle>
                <AlertDescription>
                  Connexion à Google Analytics réussie. Votre token d'accès est valide.
                </AlertDescription>
              </Alert>
            )}

            <PropertyList 
              properties={properties} 
              isLoading={isLoading} 
              accessToken={accessToken}
              error={error}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
