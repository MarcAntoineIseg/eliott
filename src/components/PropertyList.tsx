
import { useState } from "react";
import { GoogleAnalyticsProperty } from "@/services/googleAnalytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, BarChart } from "lucide-react";
import { getGoogleAnalyticsData } from "@/services/api";
import { toast } from "@/components/ui/sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface PropertyListProps {
  properties: GoogleAnalyticsProperty[];
  isLoading: boolean;
  accessToken?: string | null;
  error?: string | null;
}

const PropertyList = ({ properties, isLoading, accessToken, error }: PropertyListProps) => {
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);

  const handleLoadData = async () => {
    if (!selectedProperty || !accessToken) return;
    
    setIsLoadingData(true);
    setDataError(null);
    
    try {
      const data = await getGoogleAnalyticsData(accessToken, selectedProperty);
      setAnalyticsData(data);
      toast.success("Données analytiques chargées avec succès");
    } catch (error: any) {
      console.error("Erreur lors du chargement des données:", error);
      setDataError(error.message || "Erreur lors du chargement des données analytiques");
      toast.error(error.message || "Erreur lors du chargement des données analytiques");
    } finally {
      setIsLoadingData(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 mb-4 rounded-full bg-blue-200 animate-spin"></div>
          <div>Chargement des propriétés Google Analytics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Erreur de chargement
          </CardTitle>
          <CardDescription>
            Une erreur s'est produite lors du chargement des propriétés.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Détails de l'erreur</AlertTitle>
            <AlertDescription className="mt-2 text-sm">
              {error}
            </AlertDescription>
          </Alert>
          <div className="text-sm text-gray-500">
            <p>Voici quelques suggestions :</p>
            <ul className="list-disc pl-5 mt-2">
              <li>Vérifiez que votre backend est correctement configuré pour l'API Google Analytics</li>
              <li>Assurez-vous que les APIs Google Analytics Admin et Data sont activées dans votre projet</li>
              <li>Vérifiez les journaux d'erreur côté serveur pour plus de détails</li>
              <li>L'URL de l'API n'est peut-être pas correcte ou le format des paramètres attendu diffère</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (properties.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Aucune propriété trouvée</CardTitle>
          <CardDescription>
            Aucune propriété Google Analytics n'est disponible pour ce compte.
            Vérifiez que votre compte a bien accès à Google Analytics et que les APIs nécessaires sont activées.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">
            <p>Possibles raisons :</p>
            <ul className="list-disc pl-5 mt-2">
              <li>Aucune propriété Google Analytics n'a été créée avec ce compte Google</li>
              <li>Votre compte n'a pas les permissions nécessaires pour accéder aux propriétés</li>
              <li>Les APIs Analytics nécessaires ne sont pas activées dans votre projet Google Cloud</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500 mb-2">
        {properties.length} propriété(s) trouvée(s). Cliquez sur une propriété pour afficher ses données.
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <Card 
            key={property.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedProperty === property.id ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() => setSelectedProperty(property.id)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart size={16} className="text-blue-500" />
                {property.name}
              </CardTitle>
              <CardDescription>ID: {property.id}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {property.createdAt ? new Date(property.createdAt).toLocaleDateString() : "Date inconnue"}
                </div>
                {property.url && (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={property.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                      <Link size={14} />
                      Voir dans GA
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {selectedProperty && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              Données pour la propriété sélectionnée
            </CardTitle>
            <CardDescription>
              ID de propriété: {selectedProperty}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dataError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{dataError}</AlertDescription>
              </Alert>
            )}
            
            {!analyticsData ? (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Cliquez sur le bouton ci-dessous pour charger les données analytiques de cette propriété.
                </p>
                <Button 
                  onClick={handleLoadData} 
                  disabled={isLoadingData}
                  className="w-full md:w-auto"
                >
                  {isLoadingData ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span>
                      Chargement...
                    </>
                  ) : (
                    "Charger les données analytiques"
                  )}
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <p className="font-medium">Données analytiques chargées avec succès!</p>
                <div className="bg-gray-50 p-4 rounded-md">
                  <pre className="text-xs overflow-auto">{JSON.stringify(analyticsData, null, 2)}</pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PropertyList;
