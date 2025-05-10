import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import PropertyList from "@/components/PropertyList";
import SheetsFileList from "@/components/SheetsFileList";
import GoogleSheetsAuthButton from "@/components/GoogleSheetsAuthButton";
import GoogleAdsAuthButton from "@/components/GoogleAdsAuthButton";
import AdsAccountList from "@/components/AdsAccountList";
import { auth } from "@/lib/firebase"; // ou "@/services/firebase" selon où tu l’as placé
import { getAuth } from "firebase/auth"; // utile si tu n’utilises pas le `auth` exporté
import { toast } from "sonner";
import {
  CLIENT_ID,
  GoogleAnalyticsProperty,
  getAccessTokenFromUrl,
  getRefreshTokenFromUrl,
  fetchGoogleAnalyticsAccounts,
  fetchGoogleAnalyticsAccountProperties,
  checkTokenValidity
} from "@/services/googleAnalytics";
import {
  GoogleSheetsFile,
  getSheetsAccessTokenFromUrl,
  fetchGoogleSheetsFiles,
  checkSheetsTokenValidity,
  getStoredSheetsAccessToken,
  getStoredSheetsRefreshToken,
  getSheetsRefreshTokenFromUrl,
  getConnectedSheetsFiles,
  saveConnectedSheetsFile,
  removeConnectedSheetsFile
} from "@/services/googleSheets";
import {
  GoogleAdsAccount,
  getAdsAccessTokenFromUrl,
  fetchGoogleAdsAccounts,
  checkAdsTokenValidity,
  getStoredAdsAccessToken
} from "@/services/googleAds";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// 🔐 AJOUT POUR ENREGISTRER TOKENS EN BACKEND AVEC UID FIREBASE
const sendOAuthTokensToBackend = async (accessToken: string, refreshToken: string) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Utilisateur non authentifié");
    const idToken = await user.getIdToken();

    const res = await fetch("https://api.askeliott.com/auth/google/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`
      },
      body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken })
    });

    if (!res.ok) throw new Error("Erreur lors de l'enregistrement des tokens côté serveur");
    toast.success("Tokens Google Analytics enregistrés côté serveur");
  } catch (error: any) {
    console.error("Erreur envoi tokens backend:", error);
    toast.error("Erreur lors de l'enregistrement des tokens en base");
  }
};

const Integration = () => {
  // Google Analytics states
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [properties, setProperties] = useState<GoogleAnalyticsProperty[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [accountsLoading, setAccountsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>("disconnected");
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  
  // Google Ads states
  const [googleAdsToken, setGoogleAdsToken] = useState<string | null>(null);
  const [googleAdsAccounts, setGoogleAdsAccounts] = useState<GoogleAdsAccount[]>([]);
  const [selectedAdsAccount, setSelectedAdsAccount] = useState<GoogleAdsAccount | null>(null);
  const [adsLoading, setAdsLoading] = useState<boolean>(false);
  const [adsError, setAdsError] = useState<string | null>(null);
  const [adsConnectionStatus, setAdsConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>("disconnected");
  
  // Google Sheets states
  const [sheetsAccessToken, setSheetsAccessToken] = useState<string | null>(null);
  const [sheetsRefreshToken, setSheetsRefreshToken] = useState<string | null>(null);
  const [googleSheetsFiles, setGoogleSheetsFiles] = useState<GoogleSheetsFile[]>([]);
  const [connectedSheetsFiles, setConnectedSheetsFiles] = useState<GoogleSheetsFile[]>([]);
  const [sheetsLoading, setSheetsLoading] = useState<boolean>(false);
  const [sheetsError, setSheetsError] = useState<string | null>(null);
  const [sheetsConnectionStatus, setSheetsConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>("disconnected");

  // Google Ads token handling
  useEffect(() => {
    const clearUrlAndProcessAdsToken = async () => {
      const token = getAdsAccessTokenFromUrl();
      if (token) {
        window.history.replaceState({}, document.title, "/integration");
        localStorage.setItem("googleAdsAccessToken", token);
        setGoogleAdsToken(token);
        setAdsConnectionStatus("connected");
        toast.success("Connexion réussie à Google Ads");
        loadAdsAccounts(token);
      } else {
        const storedToken = getStoredAdsAccessToken();
        if (storedToken) {
          setAdsConnectionStatus("connecting");
          try {
            const isValid = await checkAdsTokenValidity(storedToken);
            if (isValid) {
              setGoogleAdsToken(storedToken);
              setAdsConnectionStatus("connected");
              loadAdsAccounts(storedToken);
            } else {
              localStorage.removeItem("googleAdsAccessToken");
              setGoogleAdsToken(null);
              setAdsConnectionStatus("disconnected");
            }
          } catch (error) {
            console.error("Erreur lors de la vérification du token Ads:", error);
            localStorage.removeItem("googleAdsAccessToken");
            setGoogleAdsToken(null);
            setAdsConnectionStatus("disconnected");
          }
        }
      }
    };
    clearUrlAndProcessAdsToken();
  }, []);

  // Fetch Google Ads accounts
  const loadAdsAccounts = async (token: string) => {
    if (!token) return;
    setAdsLoading(true);
    setAdsError(null);
    
    try {
      const accounts = await fetchGoogleAdsAccounts(token);
      setGoogleAdsAccounts(accounts);
      
      // Check if we have a previously selected account
      const savedAccountId = localStorage.getItem("googleAdsCustomerId");
      if (savedAccountId && accounts.some(account => account.customerId === savedAccountId)) {
        const savedAccount = accounts.find(account => account.customerId === savedAccountId);
        if (savedAccount) setSelectedAdsAccount(savedAccount);
      }
      
      if (accounts.length === 0) {
        toast.info("Aucun compte Google Ads trouvé");
      } else {
        toast.success(`${accounts.length} compte(s) Google Ads trouvé(s)`);
      }
    } catch (err: any) {
      console.error("Erreur lors du chargement des comptes Ads:", err);
      setAdsError(err.message || "Problème lors de la récupération des comptes Google Ads.");
      toast.error(err.message || "Erreur lors du chargement des comptes Ads.");
    } finally {
      setAdsLoading(false);
    }
  };

  // Google Sheets token handling
  useEffect(() => {
    const clearUrlAndProcessSheetsToken = async () => {
      const token = getSheetsAccessTokenFromUrl();
      const refreshToken = getSheetsRefreshTokenFromUrl();
      
      if (token) {
        window.history.replaceState({}, document.title, "/integration");
        localStorage.setItem("googleSheetsAccessToken", token);
        setSheetsAccessToken(token);
        
        // Store the refresh token if available
        if (refreshToken) {
          localStorage.setItem("googleSheetsRefreshToken", refreshToken);
          setSheetsRefreshToken(refreshToken);
        }
        
        setSheetsConnectionStatus("connected");
        toast.success("Connexion réussie à Google Sheets");
        loadSheetsFiles(token);
      } else {
        const storedToken = getStoredSheetsAccessToken();
        const storedRefreshToken = getStoredSheetsRefreshToken();
        
        if (storedToken) {
          setSheetsConnectionStatus("connecting");
          try {
            const isValid = await checkSheetsTokenValidity(storedToken);
            if (isValid) {
              setSheetsAccessToken(storedToken);
              if (storedRefreshToken) setSheetsRefreshToken(storedRefreshToken);
              setSheetsConnectionStatus("connected");
              
              // Charger les fichiers connectés depuis localStorage
              const savedFiles = getConnectedSheetsFiles();
              setConnectedSheetsFiles(savedFiles);
              
              loadSheetsFiles(storedToken);
            } else {
              localStorage.removeItem("googleSheetsAccessToken");
              localStorage.removeItem("googleSheetsRefreshToken");
              setSheetsAccessToken(null);
              setSheetsRefreshToken(null);
              setSheetsConnectionStatus("disconnected");
            }
          } catch (error) {
            console.error("Erreur lors de la vérification du token Sheets:", error);
            localStorage.removeItem("googleSheetsAccessToken");
            localStorage.removeItem("googleSheetsRefreshToken");
            setSheetsAccessToken(null);
            setSheetsRefreshToken(null);
            setSheetsConnectionStatus("disconnected");
          }
        }
      }
    };
    clearUrlAndProcessSheetsToken();
  }, []);

  // Fetch Google Sheets files
  const loadSheetsFiles = async (token: string) => {
    if (!token) return;
    setSheetsLoading(true);
    setSheetsError(null);
    
    try {
      const files = await fetchGoogleSheetsFiles(token);
      setGoogleSheetsFiles(files);
      
      // Charger les fichiers connectés depuis localStorage
      const savedFiles = getConnectedSheetsFiles();
      setConnectedSheetsFiles(savedFiles);
      
      if (files.length === 0) {
        toast.info("Aucun fichier Google Sheets trouvé");
      } else {
        toast.success(`${files.length} fichier(s) Google Sheets trouvé(s)`);
      }
    } catch (err: any) {
      console.error("Erreur lors du chargement des fichiers Sheets:", err);
      setSheetsError(err.message || "Problème lors de la récupération des fichiers Google Sheets.");
      toast.error(err.message || "Erreur lors du chargement des fichiers Sheets.");
    } finally {
      setSheetsLoading(false);
    }
  };

  // Initialize Google Analytics connection
useEffect(() => {
  const initGoogleAnalytics = async () => {
    const token = localStorage.getItem("googleAccessToken");
    const refreshToken = localStorage.getItem("ga_refresh_token");

    if (!token) {
      setConnectionStatus("disconnected");
      return;
    }

    setConnectionStatus("connecting");

    try {
      const isValid = await checkTokenValidity(token);
      if (isValid) {
        setAccessToken(token);
        setConnectionStatus("connected");

        // 🔐 Envoi au backend si l'utilisateur Firebase est bien authentifié
        const user = auth.currentUser;
        if (user && refreshToken) {
          try {
            await sendOAuthTokensToBackend(token, refreshToken);
          } catch (err) {
            console.error("Erreur lors de l'envoi des tokens à Firebase :", err);
          }
        }

        toast.success("Connexion réussie à Google Analytics");
        loadAccounts(token);
      } else {
        localStorage.removeItem("googleAccessToken");
        localStorage.removeItem("ga_refresh_token");
        setAccessToken(null);
        setConnectionStatus("disconnected");
        toast.error("Token expiré, veuillez vous reconnecter.");
      }
    } catch (err) {
      console.error("Erreur lors de la vérification du token:", err);
      setConnectionStatus("disconnected");
      toast.error("Erreur lors de la connexion à Google Analytics");
    } finally {
      setIsInitialLoad(false);
    }
  };

  initGoogleAnalytics();
}, []);

  // Load Google Analytics accounts
  const loadAccounts = async (token: string) => {
    if (!token) return;
    setAccountsLoading(true);
    setError(null);
    try {
      const accountsData = await fetchGoogleAnalyticsAccounts();
      setAccounts(accountsData || []);
      const savedAccountId = localStorage.getItem("ga_account_id");
      if (savedAccountId && accountsData.some(acc => acc.name === savedAccountId)) {
        setSelectedAccount(savedAccountId);
      } else if (accountsData.length === 1) {
        setSelectedAccount(accountsData[0].name);
      } else if (accountsData.length === 0) {
        toast.info("Aucun compte Google Analytics trouvé.");
      }
    } catch (err: any) {
      console.error("Erreur lors du chargement des comptes:", err);
      setError(err.message || "Problème lors de la récupération des comptes Google Analytics.");
      toast.error(err.message || "Erreur lors du chargement des comptes Analytics.");
    } finally {
      setAccountsLoading(false);
    }
  };

  // Fetch Google Analytics properties when account is selected
  useEffect(() => {
    if (!accessToken || !selectedAccount || connectionStatus !== "connected") {
      setProperties([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    fetchGoogleAnalyticsAccountProperties(selectedAccount)
      .then(propertiesData => {
        const propsList = (propertiesData || []).map((prop: any) => ({
          id: prop.name ? prop.name.split("/").pop() : prop.id,
          name: prop.displayName,
          url: prop.webLink,
          createdAt: prop.createTime,
        }));
        setProperties(propsList);
        toast[propsList.length ? 'success' : 'info'](
          propsList.length ? `${propsList.length} propriété(s) Google Analytics trouvée(s)` : "Aucune propriété trouvée pour ce compte."
        );
      })
      .catch(err => {
        setError(err.message || "Impossible de charger les propriétés pour ce compte.");
        setProperties([]);
        toast.error(err.message || "Erreur lors du chargement des propriétés.");
      })
      .finally(() => setIsLoading(false));
  }, [accessToken, selectedAccount, connectionStatus]);

  const handleLogout = () => {
    localStorage.removeItem("googleAccessToken");
    localStorage.removeItem("googleRefreshToken");
    localStorage.removeItem("ga_property_id");
    localStorage.removeItem("ga_account_id");
    setAccessToken(null);
    setAccounts([]);
    setSelectedAccount(null);
    setProperties([]);
    setConnectionStatus("disconnected");
    toast.info("Déconnexion réussie");
  };

  const handleSheetsLogout = () => {
    localStorage.removeItem("googleSheetsAccessToken");
    localStorage.removeItem("googleSheetsRefreshToken");
    localStorage.removeItem("googleSheetsFiles");
    setSheetsAccessToken(null);
    setSheetsRefreshToken(null);
    setGoogleSheetsFiles([]);
    setConnectedSheetsFiles([]);
    setSheetsConnectionStatus("disconnected");
    toast.info("Déconnexion de Google Sheets réussie");
  };

  const handleAdsLogout = () => {
    localStorage.removeItem("googleAdsAccessToken");
    localStorage.removeItem("googleAdsCustomerId");
    setGoogleAdsToken(null);
    setGoogleAdsAccounts([]);
    setSelectedAdsAccount(null);
    setAdsConnectionStatus("disconnected");
    toast.info("Déconnexion de Google Ads réussie");
  };

  const handleLoadAnalytics = (property: GoogleAnalyticsProperty) => {
    if (!property?.id || !selectedAccount) return toast.error("Propriété ou compte non défini");
    localStorage.setItem("ga_property_id", property.id);
    localStorage.setItem("ga_account_id", selectedAccount);
    toast.success("Propriété sélectionnée enregistrée avec succès !");
  };

  const handleSelectSheetsFile = (file: GoogleSheetsFile) => {
    const updatedFiles = saveConnectedSheetsFile(file);
    setConnectedSheetsFiles(updatedFiles);
    toast.success(`Fichier Google Sheets "${file.name}" connecté avec succès !`);
  };

  const handleRemoveSheetsFile = (fileId: string) => {
    const updatedFiles = removeConnectedSheetsFile(fileId);
    setConnectedSheetsFiles(updatedFiles);
  };

  const handleSelectAdsAccount = (account: GoogleAdsAccount) => {
    setSelectedAdsAccount(account);
    localStorage.setItem("googleAdsCustomerId", account.customerId || account.id);
    toast.success(`Compte Google Ads "${account.name}" connecté avec succès !`);
  };

  const handleConnectMetaAds = () => window.location.href = "https://api.askeliott.com/auth/meta";
  const handleConnectGoogleAds = () => window.location.href = "https://api.askeliott.com/auth/google-ads";
  const handleConnectHubspot = () => window.location.href = "https://api.askeliott.com/auth/hubspot";
  const handleConnectShopify = () => window.location.href = "https://api.askeliott.com/auth/shopify";

  return (
    <div className="min-h-screen w-full bg-[#f4f6f9]">
      <main className="container py-8">
        <h1 className="text-4xl font-extrabold mb-8 text-gray-800">Intégrations</h1>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">

          {/* Google Analytics Card */}
          <Card className="border-2 border-blue-50 hover:border-blue-100 transition-all duration-300 shadow-lg hover:shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-blue-50/50 p-4 border-b border-blue-100">
              <div className="flex items-center gap-4">
                <img src="https://www.gstatic.com/analytics-suite/header/suite/v2/ic_analytics.svg" alt="Google Analytics" className="w-12 h-12 rounded-lg border bg-white shadow" />
                <div>
                  <CardTitle className="text-lg font-bold text-gray-800">Google Analytics</CardTitle>
                  <CardDescription className="text-gray-600">Connectez votre compte Google Analytics</CardDescription>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              {connectionStatus === 'disconnected' ? (
                <GoogleAuthButton clientId={CLIENT_ID} />
              ) : connectionStatus === 'connecting' && isInitialLoad ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 rounded-full bg-blue-200 animate-pulse"></div>
                    <span>Vérification de la connexion...</span>
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <Button variant="outline" onClick={handleLogout} className="w-full">Déconnecter</Button>
                  <div className="mt-4">
                    {accountsLoading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-4 w-48 mb-2" />
                        <Skeleton className="h-48 w-full" />
                      </div>
                    ) : accounts.length > 0 && (
                      <div className="mb-4">
                        <label className="block mb-2 text-sm font-medium text-gray-700">Sélectionnez un compte</label>
                        <Select value={selectedAccount ?? ""} onValueChange={(val) => setSelectedAccount(val)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisissez un compte" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map(acct => (
                              <SelectItem key={acct.name} value={acct.name}>
                                {acct.displayName || acct.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <PropertyList
                      properties={properties}
                      isLoading={isLoading}
                      accessToken={accessToken}
                      error={error}
                      selectedAccount={selectedAccount}
                      onSelectProperty={handleLoadAnalytics}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Meta Ads Card */}
          <Card className="border-2 border-blue-50 hover:border-blue-100 transition-all duration-300 shadow-lg hover:shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-blue-50/50 p-4 border-b border-blue-100">
              <div className="flex items-center gap-4">
                <img src="/lovable-uploads/eeca5120-a156-4d1b-a16a-82810e51ce6a.png" alt="Meta Ads" className="w-[46px] h-[46px] rounded-lg border bg-white shadow object-contain" />
                <div>
                  <CardTitle className="text-lg font-bold text-gray-800">Meta Ads</CardTitle>
                  <CardDescription className="text-gray-600">Connectez votre compte Meta Ads</CardDescription>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <Button onClick={handleConnectMetaAds} className="w-full bg-[#1877F2] hover:bg-[#0e64d3] text-white">
                Connecter Meta Ads
              </Button>
            </CardContent>
          </Card>

          {/* HubSpot Card */}
          <Card className="border-2 border-blue-50 hover:border-blue-100 transition-all duration-300 shadow-lg hover:shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-blue-50/50 p-4 border-b border-blue-100">
              <div className="flex items-center gap-4">
                <img src="/lovable-uploads/1eb64ec7-60ab-434d-95d1-45b61ae3d30d.png" alt="HubSpot" className="w-[46px] h-[46px] rounded-lg border bg-white shadow object-contain" />
                <div>
                  <CardTitle className="text-lg font-bold text-gray-800">HubSpot</CardTitle>
                  <CardDescription className="text-gray-600">Connectez votre compte HubSpot</CardDescription>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <Button onClick={handleConnectHubspot} className="w-full bg-[#FF7A59] hover:bg-[#f06845] text-white">
                Connecter HubSpot
              </Button>
            </CardContent>
          </Card>

          {/* Google Ads Card */}
          <Card className="border-2 border-blue-50 hover:border-blue-100 transition-all duration-300 shadow-lg hover:shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-blue-50/50 p-4 border-b border-blue-100">
              <div className="flex items-center gap-4">
                <img src="/lovable-uploads/20f2b0c9-e4ee-4bf1-92e5-5431fb8fec91.png" alt="Google Ads" className="w-[46px] h-[46px] rounded-lg border bg-white shadow object-contain" />
                <div>
                  <CardTitle className="text-lg font-bold text-gray-800">Google Ads</CardTitle>
                  <CardDescription className="text-gray-600">Connectez votre compte Google Ads</CardDescription>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              {adsConnectionStatus === 'disconnected' ? (
                <GoogleAdsAuthButton />
              ) : adsConnectionStatus === 'connecting' ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 rounded-full bg-blue-200 animate-pulse"></div>
                    <span>Vérification de la connexion...</span>
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <Button variant="outline" onClick={handleAdsLogout} className="w-full">Déconnecter</Button>
                  <div className="mt-4">
                    <AdsAccountList
                      accounts={googleAdsAccounts}
                      isLoading={adsLoading}
                      error={adsError}
                      onSelectAccount={handleSelectAdsAccount}
                    />
                    {selectedAdsAccount && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-md">
                        <p className="text-sm text-green-800">
                          Compte connecté: <strong>{selectedAdsAccount.name}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Google Sheets Card */}
          <Card className="border-2 border-blue-50 hover:border-blue-100 transition-all duration-300 shadow-lg hover:shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-blue-50/50 p-4 border-b border-blue-100">
              <div className="flex items-center gap-4">
                <img src="/lovable-uploads/a5d2d998-d3cd-4f60-9128-d43a7fc8377c.png" alt="Google Sheets" className="w-[46px] h-[46px] rounded-lg border bg-white shadow object-contain" />
                <div>
                  <CardTitle className="text-lg font-bold text-gray-800">Google Sheets</CardTitle>
                  <CardDescription className="text-gray-600">Connectez vos fichiers Google Sheets</CardDescription>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              {sheetsConnectionStatus === 'disconnected' ? (
                <GoogleSheetsAuthButton />
              ) : sheetsConnectionStatus === 'connecting' ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 rounded-full bg-green-200 animate-pulse"></div>
                    <span>Vérification de la connexion...</span>
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <span className="text-sm font-medium">
                        {connectedSheetsFiles.length} fichier(s) connecté(s)
                      </span>
                    </div>
                    <Button variant="outline" onClick={handleSheetsLogout}>Déconnecter</Button>
                  </div>
                  <div className="mt-4">
                    <SheetsFileList
                      files={googleSheetsFiles}
                      isLoading={sheetsLoading}
                      error={sheetsError}
                      onSelectFile={handleSelectSheetsFile}
                      onRemoveFile={handleRemoveSheetsFile}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Shopify Card */}
          <Card className="border-2 border-blue-50 hover:border-blue-100 transition-all duration-300 shadow-lg hover:shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-blue-50/50 p-4 border-b border-blue-100">
              <div className="flex items-center gap-4">
                <img src="/lovable-uploads/ac7b886c-02ac-4f1c-a2e3-114a217db20e.png" alt="Shopify" className="w-[46px] h-[46px] rounded-lg border bg-white shadow object-contain" />
                <div>
                  <CardTitle className="text-lg font-bold text-gray-800">Shopify</CardTitle>
                  <CardDescription className="text-gray-600">Connectez votre boutique Shopify</CardDescription>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <Button onClick={handleConnectShopify} className="w-full bg-[#95BF47] hover:bg-[#7ea83b] text-white">
                Connecter Shopify
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Integration;
