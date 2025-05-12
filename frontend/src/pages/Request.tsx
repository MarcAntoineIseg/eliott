import ReactMarkdown from "react-markdown";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { fetchGoogleAnalyticsTokensFromFirestore } from "@/services/firebaseUser";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { sendToWebhook } from "@/services/webhook";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { 
  GoogleSheetsFile, 
  getConnectedSheetsFiles,
  getConnectedSheetsFileIds
} from "@/services/googleSheets";

const Request = () => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [responseMessage, setResponseMessage] = useState<string | null>(null);

  const [userContext, setUserContext] = useState<{
    googleAnalytics: {
      accountId: string;
      propertyId: string;
      accessToken: string;
      refreshToken: string;
    } | null;
    googleSheets: {
      accessToken: string;
      refreshToken: string;
      files: GoogleSheetsFile[];
      fileIds?: string[];
    } | null;
    googleAds: {
      accessToken: string;
      refreshToken: string;
      customerId: string;
    } | null;
  }>({
    googleAnalytics: null,
    googleSheets: null,
    googleAds: null,
  });

  const navigate = useNavigate();

useEffect(() => {
  const auth = getAuth();
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (!user) {
      console.warn("⚠️ Aucun utilisateur Firebase détecté. Redirection...");
      navigate("/create-account");
    } else {
      console.log("✅ Session Firebase détectée :", user.email);
    }
  });

  return () => unsubscribe(); // Nettoyage
}, [navigate]);

  useEffect(() => {
  const loadContext = async () => {
    // GA : récupération côté serveur (Firestore)
    const gaTokens = await fetchGoogleAnalyticsTokensFromFirestore();
    const gaAccountId = localStorage.getItem("ga_account_id") || "";
    const gaPropertyId = localStorage.getItem("ga_property_id") || "";

    // Sheets : depuis le localStorage
    const sheetsAccessToken = localStorage.getItem("googleSheetsAccessToken") || "";
    const sheetsRefreshToken = localStorage.getItem("sheets_refresh_token") || "";
    const sheetsFiles = getConnectedSheetsFiles();
    const sheetsFileIds = getConnectedSheetsFileIds();

    // Ads : depuis le localStorage
    const adsAccessToken = localStorage.getItem("googleAdsAccessToken") || "";
    const adsRefreshToken = localStorage.getItem("ads_refresh_token") || "";
    const adsCustomerId = localStorage.getItem("googleAdsCustomerId") || "";

    console.log("📦 GA Context:", {
      accessToken: gaTokens?.accessToken ? "présent" : "absent",
      refreshToken: gaTokens?.refreshToken ? "présent" : "absent",
      gaAccountId,
      gaPropertyId,
    });

    setUserContext({
      googleAnalytics:
        gaTokens?.accessToken && gaAccountId && gaPropertyId
          ? {
              accessToken: gaTokens.accessToken,
              refreshToken: gaTokens.refreshToken,
              accountId: gaAccountId,
              propertyId: gaPropertyId,
            }
          : null,
      googleSheets:
        sheetsAccessToken && sheetsFiles.length > 0
          ? {
              accessToken: sheetsAccessToken,
              refreshToken: sheetsRefreshToken,
              files: sheetsFiles,
              fileIds: sheetsFileIds,
            }
          : null,
      googleAds:
        adsAccessToken && adsCustomerId
          ? {
              accessToken: adsAccessToken,
              refreshToken: adsRefreshToken,
              customerId: adsCustomerId,
            }
          : null,
    });
  };

  loadContext();
}, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return toast.error("Veuillez saisir une question");
    if (!userContext.googleSheets && !userContext.googleAnalytics) {
      return toast.error("Aucune source connectée !");
    }

    setIsLoading(true);
    try {
      const response = await sendToWebhook(query, userContext);
      toast.success("Requête envoyée à Eliott ✅");
      setQuery("");

      // ✅ Gérer le message texte de l'IA
      if (typeof response === "string" && response.trim().length > 0) {
  try {
    const parsed = JSON.parse(response);
    setResponseMessage(typeof parsed === "string" ? JSON.parse(parsed) : parsed);
  } catch {
    setResponseMessage(response);
  }
} else {
  console.warn("❌ Réponse du webhook invalide :", response);
  setResponseMessage(null);
}

      // ✅ Gérer les données graphiques si présentes
      const parsed = (response.rows || []).map((row: any) => ({
        date: row.dimensionValues?.[0]?.value,
        sessions: parseInt(row.metricValues?.[0]?.value || "0", 10),
      }));
      setChartData(parsed);
    } catch (error) {
      console.error("❌ Erreur:", error);
      toast.error("Erreur lors de l'envoi de la requête");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f6f9]">
      <main className="container py-8">
        <h1 className="text-4xl font-extrabold mb-8 text-gray-800">Hey Eliott! 👋</h1>

        <form onSubmit={handleSubmit} className="max-w-3xl">
          <div className="flex gap-3">
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Que puis-je faire pour vous ?"
              className="text-base"
            />
            <Button type="submit" disabled={isLoading} className="gap-2">
              <Search className="size-4" />
              {isLoading ? "Envoi..." : "Envoyer"}
            </Button>
          </div>
        </form>

        {/* Afficher un résumé des sources connectées */}
        <div className="mt-4 space-y-2">
          {userContext.googleAnalytics && (
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              Google Analytics connecté
            </div>
          )}
          
          {userContext.googleSheets && (
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm ml-2">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              {userContext.googleSheets.files.length} fichier(s) Google Sheets connecté(s)
            </div>
          )}
          
          {userContext.googleAds && (
            <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm ml-2">
              <span className="h-2 w-2 rounded-full bg-red-500"></span>
              Google Ads connecté
            </div>
          )}
        </div>

        {/* ✅ Affichage réponse IA */}
        {responseMessage && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow text-gray-800 max-w-3xl">
<ReactMarkdown className="prose prose-sm max-w-none text-gray-800">
  {responseMessage}
</ReactMarkdown>

          </div>
        )}

        {chartData.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Évolution du trafic</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sessions" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </main>
    </div>
  );
};

export default Request;
