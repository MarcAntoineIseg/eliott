
import { useState, useEffect } from "react";
import { GoogleAnalyticsProperty } from "@/services/googleAnalytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";

interface PropertyListProps {
  properties: GoogleAnalyticsProperty[];
  isLoading: boolean;
  accessToken?: string | null;
  error?: string | null;
  selectedAccount: string | null;
  onSelectProperty: (property: GoogleAnalyticsProperty) => void;
}

const PropertyList = ({ properties, isLoading, accessToken, error, selectedAccount, onSelectProperty }: PropertyListProps) => {
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [connectedPropertyId, setConnectedPropertyId] = useState<string | null>(null);
  const [showConnectButton, setShowConnectButton] = useState<boolean>(false);

  useEffect(() => {
    // Load connected property from localStorage on component mount
    const savedPropertyId = localStorage.getItem("ga_property_id");
    if (savedPropertyId) {
      setConnectedPropertyId(savedPropertyId);
    }
  }, []);

  const handlePropertySelect = (property: GoogleAnalyticsProperty) => {
    setSelectedProperty(property.id);
    setShowConnectButton(true);
  };

  const handleConnectProperty = () => {
    if (!selectedAccount) {
      toast.error("Veuillez d'abord sélectionner un compte");
      return;
    }

    const propertyToConnect = properties.find(p => p.id === selectedProperty);
    if (!propertyToConnect) {
      toast.error("Aucune propriété sélectionnée");
      return;
    }

    // Save to localStorage
    localStorage.setItem("ga_property_id", propertyToConnect.id);
    localStorage.setItem("ga_account_id", selectedAccount);
    
    // Update state
    setConnectedPropertyId(propertyToConnect.id);
    setShowConnectButton(false);
    
    // Call parent handler
    onSelectProperty(propertyToConnect);
    
    toast.success("Propriété connectée avec succès");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4 mb-1" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
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
        {properties.length} propriété(s) trouvée(s). Cliquez sur une propriété pour la sélectionner.
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <Card 
            key={property.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedProperty === property.id ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() => handlePropertySelect(property)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                {connectedPropertyId === property.id && (
                  <CheckCircle className="text-green-500 h-5 w-5" />
                )}
                {property.name}
              </CardTitle>
              <CardDescription>ID: {property.id}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {property.createdAt ? new Date(property.createdAt).toLocaleDateString() : "Date inconnue"}
                </div>
                <div className="flex gap-2 items-center">
                  {property.url && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={property.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                        <Link size={14} />
                        Voir dans GA
                      </a>
                    </Button>
                  )}
                  {showConnectButton && selectedProperty === property.id && connectedPropertyId !== property.id && (
                    <Button 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnectProperty();
                      }}
                    >
                      Connecter la propriété
                    </Button>
                  )}
                  {connectedPropertyId === property.id && (
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      ✅ Propriété connectée
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PropertyList;

