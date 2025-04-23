
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import { Search } from "lucide-react";

const Request = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
              placeholder="Que puis-je faire pour vous ?"
              className="text-base"
            />
            <Button type="submit" className="gap-2">
              <Search className="size-4" />
              Envoyer
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Request;
