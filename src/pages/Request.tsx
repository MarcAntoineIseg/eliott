import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { sendToWebhook } from "@/services/webhook";
import { getStoredAccessToken } from "@/services/googleAnalytics";
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
  const [agentResponse, setAgentResponse] = useState<string | null>(null);

  const [userContext, setUserContext] = useState<{
    propertyId: string;
    accountId: string;
    accessToken: string;
    refreshToken: string;
  } | null>(null);

  useEffect(() => {
    const loadUserContext = async () => {
      const accessToken = getStoredAccessToken();
      const propertyId = localStorage.getItem("ga_property_id") || "";
      const accountId = localStorage.getItem("ga_account_id") || "";
      const refreshToken = localStorage.getItem("ga_refresh_token") || "";

      if (!accessToken || !propertyId || !accountId || !refreshToken) return;

      setUserContext({
        propertyId,
        accountId,
        accessToken,
        refreshToken,
      });
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
      const response = await sendToWebhook(query, userContext);
      toast.success("Question envoyée avec succès");
      setQuery("");

      console.log("🚀 Réponse reçue :", response);

      if (response.message) {
        setAgentResponse(response.message);
      } else {
        setAgentResponse("Réponse non formatée !");
      }

      if (response.rows) {
        const parsed = (response.rows || []).map((row: any) => ({
          date: row.dimensionValues[0]?.value,
          sessions: parseInt(row.metricValues[0]?.value, 10),
        }));
        setChartData(parsed);
      } else {
        setChartData([]);
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

        {agentResponse && (
          <div className="mt-8 p-4 bg-white rounded shadow">
            <h2 className="text-2xl font-bold mb-4 text-gray-700">Réponse de Eliott :</h2>
            <p className="text-lg text-gray-600">{agentResponse}</p>
          </div>
        )}

        {chartData.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Évolution du trafic
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
