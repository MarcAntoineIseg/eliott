import { useState, useEffect } from "react";
import { GoogleAnalyticsProperty } from "@/services/googleAnalytics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, CheckCircle } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
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
  const savedPropertyId = localStorage.getItem("ga_property_id");
  if (savedPropertyId) {
    setConnectedPropertyId(savedPropertyId);
    setSelectedProperty(savedPropertyId); // ✅ Ajoute ceci
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

    localStorage.setItem("ga_property_id", propertyToConnect.id);
    localStorage.setItem("ga_account_id", selectedAccount);
    setConnectedPropertyId(propertyToConnect.id);
    setShowConnectButton(false);
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
            <ul className="list-disc pl-5 mt-2">
              <li>Aucune propriété n'existe pour ce compte</li>
              <li>Les permissions ou APIs sont manquantes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500 mb-2">
        {properties.length} propriété(s) trouvée(s). Cliquez pour la sélectionner.
      </div>

      <div className="space-y-2">
  {properties.map((property) => {
    const isSelected = selectedProperty === property.id;
    const isConnected = connectedPropertyId === property.id;

    return (
      <Card
        key={property.id}
        className={`transition-all hover:shadow-md relative w-full cursor-pointer ${
          isSelected ? "ring-2 ring-blue-500" : ""
        }`}
        onClick={() => handlePropertySelect(property)}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex flex-col">
            <span className="font-medium text-base">{property.name}</span>
            <span className="text-xs text-gray-500">
              ID: {property.id} •{" "}
              {property.createdAt
                ? new Date(property.createdAt).toLocaleDateString()
                : "Date inconnue"}
            </span>
          </div>
          <div className="flex gap-2 items-center">
            {property.url && (
              <Button variant="ghost" size="icon" asChild>
                <a
                  href={property.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link size={16} />
                </a>
              </Button>
            )}

            {isConnected ? (
              <span className="text-sm text-green-600 flex items-center gap-1">
                ✅ Propriété connectée
              </span>
            ) : (
              showConnectButton &&
              isSelected && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConnectProperty();
                  }}
                >
                  Connecter
                </Button>
              )
            )}
          </div>
        </div>
      </Card>
    );
  })}
</div>
</div>
  );
};
export default PropertyList;
