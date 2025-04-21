
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
  fetchGoogleAnalyticsProperties,
  checkTokenValidity
} from "@/services/googleAnalytics";
import { AlertCircle, Info } from "lucide-react";

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

const Dashboard = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [properties, setProperties] = useState<GoogleAnalyticsProperty[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

  useEffect(() => {
    // Supprimer tous les paramètres hash de l'URL tout en préservant le token
    const clearUrlAndProcessToken = () => {
      // Vérifier si un token d'accès est présent dans l'URL (après redirection OAuth)
      const token = getAccessTokenFromUrl();
      
      // Nettoyer l'URL après avoir récupéré le token pour éviter les problèmes de partage d'URL
      window.history.replaceState({}, document.title, "/dashboard");
      
      if (token) {
        console.log("Token found in URL, now processing it");
        setAccessToken(token);
        setConnectionStatus('connecting');
        
        // Vérifier la validité du token immédiatement
        checkTokenValidity(token).then(isValid => {
          if (isValid) {
            console.log("Token is valid, saving to localStorage");
            localStorage.setItem("googleAccessToken", token);
            setConnectionStatus('connected');
            toast.success("Connexion réussie à Google Analytics");
          } else {
            console.error("Token from URL is invalid");
            localStorage.removeItem("googleAccessToken");
            setAccessToken(null);
            setConnectionStatus('disconnected');
            setError("Le token d'accès reçu de Google est invalide. Veuillez réessayer.");
            toast.error("Échec de connexion : token invalide");
          }
        });
      } else {
        // Essayer de récupérer un token précédemment stocké
        const storedToken = localStorage.getItem("googleAccessToken");
        if (storedToken) {
          console.log("Token found in localStorage, checking validity");
          setConnectionStatus('connecting');
          
          // Vérifier la validité du token avant de l'utiliser
          checkTokenValidity(storedToken).then(isValid => {
            if (isValid) {
              console.log("Stored token is valid");
              setAccessToken(storedToken);
              setConnectionStatus('connected');
              toast.success("Session restaurée");
            } else {
              console.log("Stored token is invalid, removing");
              localStorage.removeItem("googleAccessToken");
              setConnectionStatus('disconnected');
              toast.error("Session expirée. Veuillez vous reconnecter.");
            }
          });
        } else {
          console.log("No token found - user needs to authenticate");
          setConnectionStatus('disconnected');
        }
      }
    };
    
    clearUrlAndProcessToken();
  }, []);

  useEffect(() => {
    const loadProperties = async () => {
      if (!accessToken || connectionStatus !== 'connected') return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log("Loading properties with validated token");
        const propertiesData = await fetchGoogleAnalyticsProperties(accessToken);
        setProperties(propertiesData);
        
        if (propertiesData.length === 0) {
          toast.info("Aucune propriété Google Analytics n'a été trouvée pour ce compte");
        } else {
          toast.success(`${propertiesData.length} propriété(s) Google Analytics trouvée(s)`);
        }
      } catch (err: any) {
        console.error("Erreur lors du chargement des propriétés:", err);
        const errorMessage = err.message || "Impossible de charger vos propriétés Google Analytics. Veuillez réessayer.";
        setError(errorMessage);
        toast.error(errorMessage);
        
        // Si l'erreur est due à un token expiré ou invalide, on peut le supprimer
        if (err.message && (
          err.message.includes("401") || 
          err.message.includes("403") || 
          err.message.includes("UNAUTHENTICATED")
        )) {
          console.log("Authentication error detected, clearing token");
          localStorage.removeItem("googleAccessToken");
          setAccessToken(null);
          setConnectionStatus('disconnected');
          toast.error("Session expirée. Veuillez vous reconnecter.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadProperties();
  }, [accessToken, connectionStatus]);

  const handleLogout = () => {
    localStorage.removeItem("googleAccessToken");
    setAccessToken(null);
    setProperties([]);
    setConnectionStatus('disconnected');
    toast.info("Déconnexion réussie");
  };

  // Rendering part with fix:
  return (
    <div className="min-h-screen bg-gray-50">
      
      <Navbar />
      
      <main className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        {connectionStatus !== 'connected' ? (
          
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
        ) : (
          <div>
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Vos propriétés Google Analytics</h2>
              <Button variant="outline" onClick={handleLogout}>
                Déconnecter
              </Button>
            </div>
            
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

            {!error && connectionStatus === 'connected' && (
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Statut de connexion</AlertTitle>
                <AlertDescription>
                  Connexion à Google Analytics réussie. Votre token d'accès est valide.
                </AlertDescription>
              </Alert>
            )}

            {/* Fixed the TypeScript error by changing the logical condition */}
            {connectionStatus === 'connecting' && (
              <div className="flex justify-center items-center my-8">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-8 w-8 mb-4 rounded-full bg-blue-200 animate-spin"></div>
                  <div>Vérification de l'authentification...</div>
                </div>
              </div>
            )}

            <PropertyList properties={properties} isLoading={isLoading} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
