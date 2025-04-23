import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { sendToWebhook } from "@/services/webhook";
import { getStoredAccessToken } from "@/services/googleAnalytics";

const Request = () => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [userContext, setUserContext] = useState<{
    accountId: string;
    propertyId: string;
    accessToken: string;
  } | null>(null);

  useEffect(() => {
    const loadUserContext = async () => {
      const token = getStoredAccessToken();
      const accountId = localStorage.getItem("googleAccountId") || "";
      const propertyId = localStorage.getItem("googlePropertyId") || "";

      if (!token || !accountId || !propertyId) return;

      setUserContext({
        accountId,
        propertyId,
        accessToken: token,
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
      await sendToWebhook(query, userContext);
      toast.success("Question envoyée avec succès");
      setQuery("");
    } catch (error) {
      toast.error("Erreur lors de l'envoi de la question");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f6f9]">
      <Navbar />
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
      </main>
    </div>
  );
};

export default Request;