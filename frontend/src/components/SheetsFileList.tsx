import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, CheckCircle, X } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  GoogleSheetsFile,
  saveConnectedSheetsFile,
  removeConnectedSheetsFile,
  getConnectedSheetsFiles,
  getConnectedSheetsFileIds,
} from "@/services/googleSheets";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface SheetsFileListProps {
  files: GoogleSheetsFile[];
  isLoading: boolean;
  error?: string | null;
  onSelectFile: (file: GoogleSheetsFile) => void;
  onRemoveFile: (fileId: string) => void;
}

const SheetsFileList = ({
  files,
  isLoading,
  error,
  onSelectFile,
  onRemoveFile,
}: SheetsFileListProps) => {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [connectedFiles, setConnectedFiles] = useState<GoogleSheetsFile[]>([]);
  const [showConnectButton, setShowConnectButton] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    const savedFiles = getConnectedSheetsFiles();
    if (savedFiles) {
      setConnectedFiles(savedFiles);
    }
  }, []);

  const handleFileSelect = (file: GoogleSheetsFile) => {
    setSelectedFileId(file.id);
    setShowConnectButton(true);
  };

  const isFileConnected = (fileId: string) => {
    return connectedFiles.some((f) => f.id === fileId);
  };

  const handleConnectFile = () => {
    const fileToConnect = files.find((f) => f.id === selectedFileId);
    if (!fileToConnect) {
      toast.error("Aucun fichier sélectionné");
      return;
    }
    const updatedFiles = saveConnectedSheetsFile(fileToConnect);
    setConnectedFiles(updatedFiles);
    setShowConnectButton(false);
    onSelectFile(fileToConnect);
    toast.success(`Fichier "${fileToConnect.name}" connecté avec succès`);
  };

  const handleRemoveFile = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    const updatedFiles = removeConnectedSheetsFile(fileId);
    setConnectedFiles(updatedFiles);
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
        </CardContent>
      </Card>
    );
  }

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
        <Input
          placeholder="Rechercher un fichier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/2"
        />
        {connectedFiles.length > 0 && (
          <Badge variant="secondary" className="px-3 py-1 self-start md:self-auto">
            {connectedFiles.length} fichier(s) connecté(s)
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        {filteredFiles.map((file) => (
          <Card
            key={file.id}
            className={`transition-all hover:shadow-md relative w-full ${
              selectedFileId === file.id ? "ring-2 ring-green-500" : ""
            } ${isFileConnected(file.id) ? "opacity-50" : ""}`}
            onClick={() => !isFileConnected(file.id) && handleFileSelect(file)}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex flex-col">
                <span className="font-medium text-base">{file.name}</span>
                <span className="text-xs text-gray-500">
                  ID: {file.id.substring(0, 20)}... • {file.modifiedTime
                    ? new Date(file.modifiedTime).toLocaleDateString()
                    : "Date inconnue"}
                </span>
              </div>
              <div className="flex gap-2 items-center">
                {file.url && (
                  <Button variant="ghost" size="icon" asChild>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link size={16} />
                    </a>
                  </Button>
                )}
                {showConnectButton &&
                  selectedFileId === file.id &&
                  !isFileConnected(file.id) && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnectFile();
                      }}
                    >
                      Connecter
                    </Button>
                  )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SheetsFileList;
