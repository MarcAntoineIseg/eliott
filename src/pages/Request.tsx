import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
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

type UserContext = {
  accessToken: string;
  refreshToken: string;
  propertyId: string; // GA propertyId ou Google Sheets fileId
  accountId: string;  // "sheets" ou ID GA
};

const Request = () => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [userContext, setUserContext] = useState<UserContext | null>(null);

  // Chargement dynamique du contexte utilisateur (Analytics ou Sheets)
  useEffect(() => {
    const loadUserContext = () => {
      // Google Analytics
      const gaAccessToken = localStorage.getItem("googleAccessToken");
      const gaRefreshToken = localStorage.getItem("ga_refresh_token") || "";
      const gaPropertyId = localStorage.getItem("ga_property_id");
      const gaAccountId = localStorage.getItem("ga_account_id");

      // Google Sheets
      const sheetsAccessToken = localStorage.getItem("googleSheetsAccessToken");
      const sheetsFileId = localStorage.getItem("googleSheetsFileId");

      console.log("GA Context:", { gaAccessToken, gaPropertyId, gaAccountId });
      console.log("Sheets Context:", { sheetsAccessToken, sheetsFileId });

      if (gaAccessToken && gaPropertyId && gaAccountId) {
        setUserContext({
          accessToken: gaAccessToken,
          refreshToken: gaRefreshToken,
          propertyId: gaPropertyId,
          accountId: gaAccountId,
        });
        return;
      }

      if (sheetsAccessToken && sheetsFileId) {
        setUserContext({
          accessToken: sheetsAccessToken,
          refreshToken: "",
          propertyId: sheetsFileId,
          accountId: "sheets",
        });
        return;
      }

      console.error("❌ Contexte utilisateur incomplet !");
    };

    loadUserContext();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      toast.error("Veuillez saisir une question");
      return;
    }

    if (!userContext) {
      toast.error("Contexte utilisateur manquant !");
      return;
    }

    setIsLoading(true);
    try {
      const webhookUrl =
        userContext.accountId === "sheets"
          ? process.env.NEXT_PUBLIC_WEBHOOK_SHEETS
          : process.env.NEXT_PUBLIC_WEBHOOK_ANALYTICS;

      const response = await sendToWebhook(query, userContext, webhookUrl);
      toast.success("Question envoyée avec succès");
      setQuery("");

      // Affichage seulement si GA (tu peux adapter ça si tu veux afficher un autre type de graphique pour Sheets)
      if (userContext.accountId !== "sheets" && response?.rows) {
        const parsed = response.rows.map((row: any) => ({
          date: row.dimensionValues[0]?.value,
          sessions: parseInt(row.metricValues[0]?.value, 10),
        }));
        setChartData(parsed);
      }
    } catch (error) {
      toast.error("Erreur lors de l'envoi de la question");
    } finally {
      setIsLoading(false);
    }
  };

  if (!userContext) {
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

        {chartData.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Évolution du trafic
            </h2>
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
