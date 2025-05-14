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
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl shadow-lg">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Veuillez vous connecter</h1>
          <p className="text-gray-600 mb-6">Connectez-vous pour accéder à vos intégrations.</p>
          <a href="/create-account" className="block">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200">
              Aller à la page de connexion
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100">
      <main className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Intégrations
          </h1>
          <p className="text-gray-600 mb-8">Connectez et gérez vos services marketing</p>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-1 md:col-span-2 lg:col-span-3 border-none shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Google Analytics</CardTitle>
                    <CardDescription className="text-gray-600">
                      {connectedGaPropertyId
                        ? `Propriété connectée : ${connectedGaPropertyId}`
                        : selectedAccountObject
                          ? `Compte sélectionné : ${selectedAccountObject.displayName}`
                          : "Connectez votre compte Google Analytics"}
                    </CardDescription>
                  </div>
                </div>

                {!accounts.length ? (
                  <div className="flex justify-center">
                    <GoogleAuthButton />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="gaAccount" className="block text-sm font-medium text-gray-700">
                        Sélectionnez un compte
                      </label>
                      <select
                        id="gaAccount"
                        className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
                          setConnectedGaPropertyId(property.name);
                        }}
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-200">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-50 rounded-xl">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Google Sheets</CardTitle>
                    <CardDescription className="text-gray-600">Connectez vos fichiers Google Sheets</CardDescription>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <GoogleSheetsAuthButton />
                  {connectedSheetsFileName && (
                    <Badge className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
                      Fichier connecté : {connectedSheetsFileName}
                    </Badge>
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
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-200">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-red-50 rounded-xl">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                    </svg>
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Google Ads</CardTitle>
                    <CardDescription className="text-gray-600">Connectez votre compte Google Ads</CardDescription>
                  </div>
                </div>
                <GoogleAdsAuthButton />
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-200">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900">Meta Ads</CardTitle>
                    <CardDescription className="text-gray-600">Connectez votre compte Meta Ads</CardDescription>
                  </div>
                </div>
                <Button 
                  onClick={() => window.location.href = "https://api.askeliott.com/auth/meta"} 
                  className="w-full bg-gradient-to-r from-[#1877F2] to-[#166FE5] text-white shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Connecter Meta Ads
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Integration;
