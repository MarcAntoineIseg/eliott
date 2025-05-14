import ReactMarkdown from "react-markdown";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import DynamicChart from "@/components/DynamicChart";
import { fetchGoogleAnalyticsTokensFromFirestore } from "@/services/firebaseUser";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { sendToWebhook } from "@/services/webhook";
import {
  GoogleSheetsFile,
  getConnectedSheetsFiles,
  getConnectedSheetsFileIds
} from "@/services/googleSheets";

const Request = () => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartType, setChartType] = useState<"line" | "bar" | "pie">("line");
  const [responseMessage, setResponseMessage] = useState<string | null>(null);

  const [userContext, setUserContext] = useState({
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
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
  const loadContext = async () => {
    const gaTokens = await fetchGoogleAnalyticsTokensFromFirestore();
    const gaAccountId = localStorage.getItem("ga_account_id") || "";
    const gaPropertyId = localStorage.getItem("ga_property_id") || "";

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const idToken = await user.getIdToken();
    const tokenRes = await fetch("https://api.askeliott.com/auth/user/tokens", {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    const userData = await tokenRes.json();
    const sheetFileName = localStorage.getItem("sheetFileName") || "";

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
        userData?.sheets_access_token &&
        userData?.sheets_refresh_token &&
        userData?.sheets_connected_file?.id
          ? {
              accessToken: userData.sheets_access_token,
              refreshToken: userData.sheets_refresh_token,
              fileId: userData.sheets_connected_file.id,
              fileName: sheetFileName,
            }
          : null,
      googleAds: null,
    });
  };

  loadContext(); // ✅ tu l'appelles correctement ici
}, []); // ✅ ICI tu fermes correctement le useEffect

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!query.trim()) return toast.error("Veuillez saisir une question");
  if (!userContext.googleSheets && !userContext.googleAnalytics) {
    return toast.error("Aucune source connectée !");
  }

  setIsLoading(true);
  try {
  const sheetsFiles = JSON.parse(localStorage.getItem("sheetsFiles") || "[]");

  const response = await sendToWebhook({
    query,
    googleSheets: {
      files: sheetsFiles
    },
    googleAnalytics: userContext.googleAnalytics,
    googleAds: userContext.googleAds
  });

  toast.success("Requête envoyée à Eliott ✅");
  setQuery("");

  // ✅ Traitement correct de la réponse : tableau ou objet
  const parsedResponse = Array.isArray(response) ? response[0] : response;

  setResponseMessage(parsedResponse.message || null);

  if (parsedResponse?.chartData?.length && parsedResponse?.chartType) {
    setChartData(parsedResponse.chartData);
    setChartType(parsedResponse.chartType as "line" | "bar" | "pie");
  }

  if (!parsedResponse?.chartData && parsedResponse?.rows) {
    const parsed = (parsedResponse.rows || []).map((row: any) => ({
      label: row.dimensionValues?.[0]?.value,
      value: parseInt(row.metricValues?.[0]?.value || "0", 10),
    }));
    setChartData(parsed);
  }

} catch (error) {
  console.error("❌ Erreur:", error);
  toast.error("Erreur lors de l'envoi ou du traitement de la requête");
  setResponseMessage("Erreur lors du traitement de la réponse.");
} finally {
  setIsLoading(false);
}

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
    Google Sheet connecté : {userContext.googleSheets.fileName || "Nom inconnu"}
  </div>
)}
          {userContext.googleAds && (
            <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm ml-2">
              <span className="h-2 w-2 rounded-full bg-red-500"></span>
              Google Ads connecté
            </div>
          )}
        </div>

        {responseMessage && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow text-gray-800 max-w-3xl">
            <ReactMarkdown className="prose prose-sm max-w-none text-gray-800">
              {responseMessage}
            </ReactMarkdown>
          </div>
        )}

        {chartData.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Données visualisées</h2>
            <DynamicChart type={chartType} data={chartData} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Request;
