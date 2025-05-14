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
import SheetsFileList from "@/components/SheetsFileList";
import { getGoogleAnalyticsAccounts, getGoogleAnalyticsAccountProperties } from "@/services/api";

const Integration = () => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [firebaseLoading, setFirebaseLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(localStorage.getItem("ga_account_id"));
  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [connectedGaPropertyId, setConnectedGaPropertyId] = useState<string | null>(localStorage.getItem("ga_property_id"));
  const [googleSheetsFiles, setGoogleSheetsFiles] = useState([]);
  const [googleSheetsLoading, setGoogleSheetsLoading] = useState(false);
  const [googleSheetsError, setGoogleSheetsError] = useState<string | null>(null);

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
      } catch (err) {
        toast.error("Erreur chargement Google Analytics");
        console.error(err);
      }
    };
    fetchAnalyticsData();
  }, [firebaseUser]);

  useEffect(() => {
    const fetchProperties = async () => {
      if (!firebaseUser || !selectedAccount) return;
      try {
        setLoadingProperties(true);
        const idToken = await firebaseUser.getIdToken();
        const props = await getGoogleAnalyticsAccountProperties(selectedAccount, idToken);
        setProperties(props);
      } catch (err) {
        toast.error("Erreur chargement des propriétés GA4");
        console.error(err);
      } finally {
        setLoadingProperties(false);
      }
    };
    fetchProperties();
  }, [firebaseUser, selectedAccount]);

  useEffect(() => {
    const fetchGoogleSheetsFiles = async () => {
      if (!firebaseUser) return;
      try {
        setGoogleSheetsLoading(true);
        const idToken = await firebaseUser.getIdToken();
        const res = await fetch("https://api.askeliott.com/api/google-sheets/files", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = await res.json();
        const files = data.files || [];
        setGoogleSheetsFiles(files);
        localStorage.setItem("sheetsFiles", JSON.stringify(files));
      } catch (err) {
        toast.error("Erreur chargement fichiers Google Sheets");
        console.error(err);
        setGoogleSheetsError("Erreur chargement fichiers Google Sheets");
      } finally {
        setGoogleSheetsLoading(false);
      }
    };
    fetchGoogleSheetsFiles();
  }, [firebaseUser]);

  const handleAccountChange = async (accountId: string) => {
    setSelectedAccount(accountId);
    localStorage.setItem("ga_account_id", accountId);
    setProperties([]);
    try {
      setLoadingProperties(true);
      if (!firebaseUser) return;
      const idToken = await firebaseUser.getIdToken();
      const props = await getGoogleAnalyticsAccountProperties(accountId, idToken);
      setProperties(props);
    } catch (err) {
      toast.error("Erreur chargement des propriétés GA4");
      console.error(err);
    } finally {
      setLoadingProperties(false);
    }
  };

  const handleDisconnectIntegration = async (service: string) => {
    if (!firebaseUser) return;
    try {
      const idToken = await firebaseUser.getIdToken();
      const res = await fetch(`https://api.askeliott.com/auth/${service}/disconnect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });
      if (!res.ok) throw new Error("Erreur lors de la déconnexion");
      toast.success(`${service} déconnecté avec succès`);
      if (service === "google/analytics") {
        localStorage.removeItem("ga_account_id");
        localStorage.removeItem("ga_property_id");
        setSelectedAccount(null);
        setConnectedGaPropertyId(null);
        setAccounts([]);
        setProperties([]);
      } else if (service === "google-ads") {
        localStorage.removeItem("google_ads_customer_id");
      }
    } catch (err) {
      console.error(`Erreur déconnexion ${service} :`, err);
      toast.error("Impossible de déconnecter");
    }
  };

  if (!firebaseUser && !firebaseLoading) {
    return (
      <div className="min-h-screen w-full bg-gray-100 flex flex-col items-center justify-center">
        <div className="p-6 bg-white shadow rounded-xl text-center">
          <h1 className="text-2xl font-bold mb-4">Veuillez vous connecter</h1>
          <a href="/create-account">
            <Button>Se connecter</Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100">
      <main className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8">Intégrations</h1>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Google Analytics */}
          <Card>
            <CardContent className="space-y-4">
              <CardTitle>Google Analytics</CardTitle>
              <CardDescription>
                {connectedGaPropertyId
                  ? `Propriété connectée : ${connectedGaPropertyId}`
                  : selectedAccountObject
                  ? `Compte : ${selectedAccountObject.displayName}`
                  : "Aucune connexion"}
              </CardDescription>
              {!accounts.length ? <GoogleAuthButton /> : null}
              {accounts.length > 0 && (
                <>
                  <select
                    className="w-full p-2 border border-gray-300 rounded"
                    value={selectedAccount || ""}
                    onChange={(e) => handleAccountChange(e.target.value)}
                  >
                    <option value="">Choisir un compte</option>
                    {accounts.map((acc: any) => (
                      <option key={acc.name} value={acc.name}>
                        {acc.displayName}
                      </option>
                    ))}
                  </select>
                  <PropertyList
                    properties={properties}
                    isLoading={loadingProperties}
                    selectedAccount={selectedAccount}
                    onSelectProperty={(prop) => {
                      localStorage.setItem("ga_property_id", prop.name);
                      setConnectedGaPropertyId(prop.name);
                    }}
                  />
                  <Button variant="destructive" onClick={() => handleDisconnectIntegration("google/analytics")}>
                    Déconnecter
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Google Sheets */}
          <Card>
            <CardContent className="space-y-4">
              <CardTitle>Google Sheets</CardTitle>
              <GoogleSheetsAuthButton />
              <SheetsFileList
                files={googleSheetsFiles}
                isLoading={googleSheetsLoading}
                error={googleSheetsError}
                onSelectFile={(file) => {
                  console.log("Fichier connecté :", file);
                }}
                onRemoveFile={(fileId) => {
                  console.log("Fichier déconnecté :", fileId);
                }}
              />
            </CardContent>
          </Card>

          {/* Google Ads */}
          <Card>
            <CardContent className="space-y-4">
              <CardTitle>Google Ads</CardTitle>
              <GoogleAdsAuthButton />
              <Button variant="destructive" onClick={() => handleDisconnectIntegration("google-ads")}>
                Déconnecter
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Integration;
