
import { useState } from "react";
import { GoogleAnalyticsProperty } from "@/services/googleAnalytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "lucide-react";

interface PropertyListProps {
  properties: GoogleAnalyticsProperty[];
  isLoading: boolean;
}

const PropertyList = ({ properties, isLoading }: PropertyListProps) => {
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse">Chargement des propriétés...</div>
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
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
      {properties.map((property) => (
        <Card 
          key={property.id} 
          className={`cursor-pointer transition-all ${
            selectedProperty === property.id ? "ring-2 ring-blue-500" : ""
          }`}
          onClick={() => setSelectedProperty(property.id)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{property.name}</CardTitle>
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
                    Voir
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PropertyList;
