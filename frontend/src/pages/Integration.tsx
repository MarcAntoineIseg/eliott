import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
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
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

        if (accounts.length > 0) {
          const accountId = accounts[0].name; // ex: "accounts/123456"
          setSelectedAccount(accountId);

          setLoadingProperties(true);
          const properties = await getGoogleAnalyticsAccountProperties(accountId, idToken);
          setProperties(properties);
          setLoadingProperties(false);
        }
      } catch (err: any) {
        setError("Erreur lors du chargement de Google Analytics");
        console.error(err);
        toast.error("Erreur chargement Google Analytics");
      }
    };

    fetchAnalyticsData();
  }, [firebaseUser]);

  if (firebaseLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

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
          <Card>
            <CardContent className="p-6">
              <CardTitle>Google Analytics</CardTitle>
              <CardDescription>Connectez votre compte Google Analytics</CardDescription>
              <GoogleAuthButton />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <CardTitle>Google Sheets</CardTitle>
              <CardDescription>Connectez vos fichiers Google Sheets</CardDescription>
              <GoogleSheetsAuthButton />
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

          <Card>
            <CardContent className="p-6">
              <CardTitle>HubSpot</CardTitle>
              <CardDescription>Connectez votre compte HubSpot</CardDescription>
              <Button onClick={() => window.location.href = "https://api.askeliott.com/auth/hubspot"} className="w-full bg-[#FF7A59] text-white">
                Connecter HubSpot
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <CardTitle>Shopify</CardTitle>
              <CardDescription>Connectez votre boutique Shopify</CardDescription>
              <Button onClick={() => window.location.href = "https://api.askeliott.com/auth/shopify"} className="w-full bg-[#95BF47] text-white">
                Connecter Shopify
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Affichage des propriétés GA */}
        <div className="mt-12">
          <PropertyList
            properties={properties}
            isLoading={loadingProperties}
            selectedAccount={selectedAccount}
            onSelectProperty={(property) => {
              console.log("📌 Propriété sélectionnée :", property);
              // Tu peux ajouter une action ici si nécessaire
            }}
          />
        </div>
      </main>
    </div>
  );
};

export default Integration;
