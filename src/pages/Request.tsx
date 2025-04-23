
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import { Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { sendToWebhook } from "@/services/webhook";

const Request = () => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast.error("Veuillez saisir une question");
      return;
    }

    setIsLoading(true);
    try {
      await sendToWebhook(query);
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
