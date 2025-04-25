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

  const [userContext, setUserContext] = useState<{
    propertyId: string;
    accountId: string;
    accessToken: string;
  } | null>(null);

  useEffect(() => {
  const loadUserContext = async () => {
    const accessToken = getStoredAccessToken();
    const propertyId = localStorage.getItem("ga_property_id") || "";
    const accountId = localStorage.getItem("ga_account_id") || "";
    const refreshToken = localStorage.getItem("ga_refresh_token") || ""; // 👈 ici

    if (!accessToken || !propertyId || !accountId || !refreshToken) return;

    const refreshToken = localStorage.getItem("ga_refresh_token") || "";

setUserContext({
  propertyId,
  accountId,
  accessToken: token,
  refreshToken, // ✅ on ajoute bien le refreshToken ici
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

      // Traitement des données de sessions par date
      const parsed = (response.rows || []).map((row: any) => ({
        date: row.dimensionValues[0]?.value,
        sessions: parseInt(row.metricValues[0]?.value, 10),
      }));
      setChartData(parsed);
    } catch (error) {
      toast.error("Erreur lors de l'envoi de la question");
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
