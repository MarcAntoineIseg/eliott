
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, CheckCircle, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  GoogleSheetsFile, 
  saveConnectedSheetsFile, 
  removeConnectedSheetsFile, 
  getConnectedSheetsFiles,
  getConnectedSheetsFileIds
} from "@/services/googleSheets";
import { Badge } from "@/components/ui/badge";

interface SheetsFileListProps {
  files: GoogleSheetsFile[];
  isLoading: boolean;
  error?: string | null;
  onSelectFile: (file: GoogleSheetsFile) => void;
  onRemoveFile: (fileId: string) => void;
}

const SheetsFileList = ({ files, isLoading, error, onSelectFile, onRemoveFile }: SheetsFileListProps) => {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [connectedFiles, setConnectedFiles] = useState<GoogleSheetsFile[]>([]);
  const [showConnectButton, setShowConnectButton] = useState<boolean>(false);

  useEffect(() => {
    // Load connected files from localStorage on component mount
    const savedFiles = getConnectedSheetsFiles();
    if (savedFiles) {
      setConnectedFiles(savedFiles);
    }
    
    // Log both the array-based file list and individual IDs for debugging
    console.log("Connected files (array):", savedFiles);
    console.log("Connected file IDs (individual):", getConnectedSheetsFileIds());
  }, []);

  const handleFileSelect = (file: GoogleSheetsFile) => {
    setSelectedFileId(file.id);
    setShowConnectButton(true);
  };

  const isFileConnected = (fileId: string) => {
    return connectedFiles.some(f => f.id === fileId);
  };

  const handleConnectFile = () => {
    const fileToConnect = files.find(f => f.id === selectedFileId);
    if (!fileToConnect) {
      toast.error("Aucun fichier sélectionné");
      return;
    }

    // Save to localStorage (both in array and as individual entry)
    const updatedFiles = saveConnectedSheetsFile(fileToConnect);
    setConnectedFiles(updatedFiles);
    
    // Reset UI state
    setShowConnectButton(false);
    
    // Call parent handler
    onSelectFile(fileToConnect);
    
    toast.success(`Fichier "${fileToConnect.name}" connecté avec succès`);
  };

  const handleRemoveFile = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    
    // Remove from localStorage (both from array and individual entry)
    const updatedFiles = removeConnectedSheetsFile(fileId);
    setConnectedFiles(updatedFiles);
    
    // Call parent handler
    onRemoveFile(fileId);
    
    toast.success("Fichier déconnecté avec succès");
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
            Une erreur s'est produite lors du chargement des fichiers Google Sheets.
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
              <li>Vérifiez que votre authentification Google Sheets est correcte</li>
              <li>Assurez-vous que l'API Google Sheets est activée dans votre projet Google Cloud</li>
              <li>Vérifiez que votre compte Google a accès à des fichiers Google Sheets</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (files.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Aucun fichier trouvé</CardTitle>
          <CardDescription>
            Aucun fichier Google Sheets n'est disponible pour ce compte.
            Vérifiez que votre compte a bien accès à Google Sheets et que vous avez des documents dans votre Drive.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">
            <p>Possibles raisons :</p>
            <ul className="list-disc pl-5 mt-2">
              <li>Aucun fichier Google Sheets n'existe dans votre Google Drive</li>
              <li>Votre compte n'a pas les permissions nécessaires pour accéder aux fichiers</li>
              <li>L'API Google Sheets n'est pas activée dans votre projet Google Cloud</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500 mb-2">
          {files.length} fichier(s) trouvé(s). Cliquez sur un fichier pour le sélectionner.
        </div>
        {connectedFiles.length > 0 && (
          <Badge variant="secondary" className="px-3 py-1">
            {connectedFiles.length} fichier(s) connecté(s)
          </Badge>
        )}
      </div>
      
      {connectedFiles.length > 0 && (
        <div className="mb-4">
          <h3 className="text-md font-medium mb-2">Fichiers connectés</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {connectedFiles.map((file) => (
              <Card key={file.id} className="border-green-200 bg-green-50/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="text-green-500 h-5 w-5" />
                    {file.name}
                  </CardTitle>
                  <CardDescription>
                    ID: {file.id.substring(0, 20)}...
                    <div className="text-xs text-green-700 mt-1">
                      localStorage: googleSheetsFileId_{file.id.substring(0, 8)}...
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : "Date inconnue"}
                    </div>
                    <div className="flex gap-2 items-center">
                      {file.url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                            <Link size={14} />
                            Ouvrir
                          </a>
                        </Button>
                      )}
                      <Button 
                        variant="destructive"
                        size="sm"
                        onClick={(e) => handleRemoveFile(e, file.id)}
                      >
                        <X size={14} className="mr-1" />
                        Déconnecter
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-4">
        <h3 className="text-md font-medium mb-2">Fichiers disponibles</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {files.map((file) => (
            <Card 
              key={file.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedFileId === file.id ? "ring-2 ring-green-500" : ""
              } ${isFileConnected(file.id) ? "opacity-50" : ""}`}
              onClick={() => !isFileConnected(file.id) && handleFileSelect(file)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  {file.name}
                  {isFileConnected(file.id) && (
                    <Badge className="ml-2">Connecté</Badge>
                  )}
                </CardTitle>
                <CardDescription>ID: {file.id.substring(0, 20)}...</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : "Date inconnue"}
                  </div>
                  <div className="flex gap-2 items-center">
                    {file.url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a 
                          href={file.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link size={14} />
                          Ouvrir
                        </a>
                      </Button>
                    )}
                    {showConnectButton && selectedFileId === file.id && !isFileConnected(file.id) && (
                      <Button 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConnectFile();
                        }}
                      >
                        Connecter le fichier
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SheetsFileList;
