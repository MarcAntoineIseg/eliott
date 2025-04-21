
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import PropertyList from "@/components/PropertyList";
import { 
  CLIENT_ID, 
  GoogleAnalyticsProperty, 
  getAccessTokenFromUrl,
  fetchGoogleAnalyticsProperties
} from "@/services/googleAnalytics";

const Dashboard = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [properties, setProperties] = useState<GoogleAnalyticsProperty[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Vérifier si un token d'accès est présent dans l'URL (après redirection OAuth)
    const token = getAccessTokenFromUrl();
    if (token) {
      setAccessToken(token);
      // On peut sauvegarder le token dans le localStorage pour le conserver
      localStorage.setItem("googleAccessToken", token);
    } else {
      // Essayer de récupérer un token précédemment stocké
      const storedToken = localStorage.getItem("googleAccessToken");
      if (storedToken) {
        setAccessToken(storedToken);
      }
    }
  }, []);

  useEffect(() => {
    const loadProperties = async () => {
      if (!accessToken) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const propertiesData = await fetchGoogleAnalyticsProperties(accessToken);
        setProperties(propertiesData);
      } catch (err) {
        console.error("Erreur lors du chargement des propriétés:", err);
        setError("Impossible de charger vos propriétés Google Analytics. Veuillez réessayer.");
        // Si l'erreur est due à un token expiré, on peut le supprimer
        localStorage.removeItem("googleAccessToken");
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadProperties();
  }, [accessToken]);

  const handleLogout = () => {
    localStorage.removeItem("googleAccessToken");
    setAccessToken(null);
    setProperties([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        
        {!accessToken ? (
          <Card>
            <CardHeader>
              <CardTitle>Connectez votre compte Google Analytics</CardTitle>
              <CardDescription>
                Connectez-vous avec Google pour accéder à vos propriétés Google Analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoogleAuthButton clientId={CLIENT_ID} />
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
              <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
                {error}
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
