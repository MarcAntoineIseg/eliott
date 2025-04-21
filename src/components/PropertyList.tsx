
import { useState } from "react";
import { GoogleAnalyticsProperty } from "@/services/googleAnalytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, BarChart } from "lucide-react";

interface PropertyListProps {
  properties: GoogleAnalyticsProperty[];
  isLoading: boolean;
}

const PropertyList = ({ properties, isLoading }: PropertyListProps) => {
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);

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
            <p className="text-sm text-gray-500">
              Pour afficher les données de cette propriété, nous devons implémenter la fonctionnalité de récupération et d'affichage des rapports Google Analytics.
            </p>
            <Button className="mt-4" variant="outline">
              Charger les données analytiques
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PropertyList;
