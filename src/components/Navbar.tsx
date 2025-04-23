
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="border-b bg-white">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-bold text-blue-600">
            AnalyConnect
          </Link>
          <div className="hidden md:flex gap-6">
            <Link to="/" className="text-sm font-medium hover:text-blue-600">
              Accueil
            </Link>
            <Link to="/integration" className="text-sm font-medium hover:text-blue-600">
              Intégrations
            </Link>
            <Link to="/request" className="text-sm font-medium hover:text-blue-600">
              Requête
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/integration">
            <Button variant="outline" className="hidden md:flex gap-2 items-center">
              <LogIn size={16} />
              Connexion
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
