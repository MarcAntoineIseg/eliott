import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
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

const Request = () => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [responseMessage, setResponseMessage] = useState<string | null>(null); // ✅ Ajout

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
      fileId: string;
    } | null;
  }>({
    googleAnalytics: null,
    googleSheets: null,
  });

  useEffect(() => {
    const loadContext = () => {
      const gaAccessToken = localStorage.getItem("googleAccessToken") || "";
      const gaRefreshToken = localStorage.getItem("ga_refresh_token") || "";
      const gaPropertyId = localStorage.getItem("ga_property_id") || "";
      const gaAccountId = localStorage.getItem("ga_account_id") || "";

      const sheetsAccessToken = localStorage.getItem("googleSheetsAccessToken") || "";
      const sheetsRefreshToken = localStorage.getItem("googleSheetsRefreshToken") || "";
      const sheetsFileId = localStorage.getItem("googleSheetsFileId") || "";

      setUserContext({
        googleAnalytics: gaAccessToken && gaAccountId && gaPropertyId
          ? {
              accessToken: gaAccessToken,
              refreshToken: gaRefreshToken,
              accountId: gaAccountId,
              propertyId: gaPropertyId,
            }
          : null,
        googleSheets: sheetsAccessToken && sheetsFileId
          ? {
              accessToken: sheetsAccessToken,
              refreshToken: sheetsRefreshToken,
              fileId: sheetsFileId,
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
      if (response.message) {
        setResponseMessage(response.message);
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

  if (!userContext.googleAnalytics && !userContext.googleSheets) {
    return (
      <div className="h-screen w-full flex items-center justify-center text-lg">
        Chargement du contexte utilisateur...
      </div>
    );
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

        {/* ✅ Affichage réponse IA */}
        {responseMessage && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow text-gray-800 max-w-3xl">
            <h2 className="text-xl font-semibold mb-2">Réponse d’Eliott</h2>
            <p className="whitespace-pre-line">{responseMessage}</p>
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
