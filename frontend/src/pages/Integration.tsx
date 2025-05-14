import { useEffect, useState, useMemo } from "react";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PropertyList from "@/components/PropertyList";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import GoogleSheetsAuthButton from "@/components/GoogleSheetsAuthButton";
import GoogleAdsAuthButton from "@/components/GoogleAdsAuthButton";
import AdsAccountList from "@/components/AdsAccountList";
import SheetsFileList from "@/components/SheetsFileList";

import {
  getGoogleAnalyticsAccounts,
  getGoogleAnalyticsAccountProperties
} from "@/services/api";

const Integration = () => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [firebaseLoading, setFirebaseLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(
    localStorage.getItem("ga_account_id")
  );
  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleSheetsFiles, setGoogleSheetsFiles] = useState([]);
  const [googleSheetsLoading, setGoogleSheetsLoading] = useState(false);
  const [googleSheetsError, setGoogleSheetsError] = useState<string | null>(null);
  const [connectedSheetsFileName, setConnectedSheetsFileName] = useState<string | null>(null);
  const [connectedGaPropertyId, setConnectedGaPropertyId] = useState<string | null>(null);

  useEffect(() => {
  const stored = localStorage.getItem("ga_property_id");
  if (stored) setConnectedGaPropertyId(stored);
}, []);

  const selectedAccountObject = useMemo(() => {
    return accounts.find((acc: any) => acc.name === selectedAccount);
  }, [accounts, selectedAccount]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setFirebaseLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!firebaseUser) return;

      try {
        const idToken = await firebaseUser.getIdToken();
        const accounts = await getGoogleAnalyticsAccounts(idToken);
        setAccounts(accounts);
      } catch (err: any) {
        setError("Erreur lors du chargement de Google Analytics");
        console.error(err);
        toast.error("Erreur chargement Google Analytics");
      }
    };

    fetchAnalyticsData();
  }, [firebaseUser]);

  useEffect(() => {
    const fetchPropertiesIfAccountExists = async () => {
      if (!firebaseUser || !selectedAccount) return;

      try {
        setLoadingProperties(true);
        const idToken = await firebaseUser.getIdToken();
        const props = await getGoogleAnalyticsAccountProperties(selectedAccount, idToken);
        setProperties(props);
      } catch (err) {
        toast.error("Erreur chargement des propriétés GA4");
        console.error("❌ GA4 fetch error:", err);
      } finally {
        setLoadingProperties(false);
      }
    };

    fetchPropertiesIfAccountExists();
  }, [firebaseUser, selectedAccount]);

  useEffect(() => {
  const loadGoogleSheetsFiles = async () => {
    if (!firebaseUser) return;

    try {
      setGoogleSheetsLoading(true);
      const idToken = await firebaseUser.getIdToken();

      const filesRes = await fetch("https://api.askeliott.com/api/google-sheets/files", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const filesData = await filesRes.json();
      const files = filesData.files || [];
      setGoogleSheetsFiles(files);

      if (filesData.connectedFile?.id) {
        localStorage.setItem("sheets_file_id", filesData.connectedFile.id);
        setConnectedSheetsFileName(filesData.connectedFile.name);
      }
    } catch (err) {
      console.error("❌ Erreur chargement fichiers Google Sheets :", err);
      setGoogleSheetsError("Erreur chargement fichiers Google Sheets");
    } finally {
      setGoogleSheetsLoading(false);
    }
  };

  loadGoogleSheetsFiles();
}, [firebaseUser]);

  const handleAccountChange = async (accountId: string) => {
    setSelectedAccount(accountId);
    localStorage.setItem("ga_account_id", accountId);
    setProperties([]);
    if (!firebaseUser) return;

    try {
      setLoadingProperties(true);
      const idToken = await firebaseUser.getIdToken();
      const properties = await getGoogleAnalyticsAccountProperties(accountId, idToken);
      setProperties(properties);
    } catch (err) {
      console.error("Erreur chargement propriétés GA4 :", err);
      toast.error("Erreur chargement des propriétés GA4");
    } finally {
      setLoadingProperties(false);
    }
  };

  if (!firebaseUser && !firebaseLoading) {
    return (
      <div className="min-h-screen w-full bg-[#f4f6f9] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Veuillez vous connecter</h1>
        <p className="text-gray-600 mb-4">Connectez-vous pour accéder à vos intégrations.</p>
        <a href="/create-account">
          <Button className="bg-blue-600 text-white">Aller à la page de connexion</Button>
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#f4f6f9]">
      <main className="container py-8">
        <h1 className="text-4xl font-extrabold mb-8 text-gray-800">Intégrations</h1>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-1 md:col-span-2 lg:col-span-3">
            <CardContent className="p-6 space-y-4">
              <CardTitle>Google Analytics</CardTitle>
              <CardDescription>
  {connectedGaPropertyId
    ? `Propriété connectée : ${connectedGaPropertyId}`
    : selectedAccountObject
      ? `Compte sélectionné : ${selectedAccountObject.displayName}`
      : "Connectez votre compte Google Analytics"}
</CardDescription>

              {!accounts.length ? (
                <GoogleAuthButton />
              ) : (
                <>
                  <div className="space-y-2">
                    <label htmlFor="gaAccount" className="block text-sm font-medium text-gray-700">
                      Sélectionnez un compte
                    </label>
                    <select
                      id="gaAccount"
                      className="w-full p-2 border rounded-md"
                      value={selectedAccount || ''}
                      onChange={(e) => handleAccountChange(e.target.value)}
                    >
                      <option value="">-- Choisissez un compte --</option>
                      {accounts.map((acc: any) => (
                        <option key={acc.name} value={acc.name}>
                          {acc.displayName} ({acc.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedAccountObject && (
  <PropertyList
    properties={properties}
    isLoading={loadingProperties}
    selectedAccount={selectedAccount}
    onSelectProperty={(property) => {
      console.log("📌 Propriété sélectionnée :", property);
      localStorage.setItem("ga_property_id", property.name);
      setConnectedGaPropertyId(property.name); // ✅ met à jour l'état local aussi
    }}
  />
)}

                </>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardContent className="p-6 space-y-4">
              <CardTitle>Google Sheets</CardTitle>
              <CardDescription>Connectez vos fichiers Google Sheets</CardDescription>
              <GoogleSheetsAuthButton />
              {connectedSheetsFileName && (
                <Badge className="text-sm bg-green-100 text-green-700 w-fit">Fichier connecté : {connectedSheetsFileName}</Badge>
              )}
              <SheetsFileList
                files={googleSheetsFiles}
                isLoading={googleSheetsLoading}
                error={googleSheetsError}
                onSelectFile={(file) => {
                  console.log("✅ Fichier sélectionné côté front :", file);
                  localStorage.setItem("sheets_file_id", file.id);
                  setConnectedSheetsFileName(file.name);
                }}
                onRemoveFile={(fileId) => {
                  console.log("🗑️ Fichier déconnecté côté front :", fileId);
                  localStorage.removeItem("sheets_file_id");
                  setConnectedSheetsFileName(null);
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <CardTitle>Google Ads</CardTitle>
              <CardDescription>Connectez votre compte Google Ads</CardDescription>
              <GoogleAdsAuthButton />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <CardTitle>Meta Ads</CardTitle>
              <CardDescription>Connectez votre compte Meta Ads</CardDescription>
              <Button onClick={() => window.location.href = "https://api.askeliott.com/auth/meta"} className="w-full bg-[#1877F2] text-white">
                Connecter Meta Ads
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Integration;
