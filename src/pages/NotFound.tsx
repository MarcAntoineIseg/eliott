
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
      <div className="max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Oups, il me semble que vous vous êtes perdu.
        </h1>
        
        <div className="mb-8">
          <img 
            src="/lovable-uploads/c3e2cced-1ca0-4dd0-89d7-e51161c720fc.png" 
            alt="Explorateur perdu" 
            className="w-full max-w-md rounded-lg shadow-md mx-auto"
          />
        </div>
        
        <Link 
          to="/request" 
          className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-3 text-lg font-medium shadow-sm hover:bg-primary/90 transition-colors"
        >
          Revenez dans le droit chemin
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
