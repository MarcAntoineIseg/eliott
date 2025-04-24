import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
          <div className="container text-center px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">L'analytics propulsé par l'IA</h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Interrogez vos bases de données et obtenez des insights instantannément
            </p>
            <Link to="/dashboard">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-gray-100">
                Commencer maintenant
              </Button>
            </Link>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="container px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Fonctionnalités principales</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3">Connexion simple</h3>
                <p className="text-gray-600">
                  Intégrez facilement vos propriétés Google Analytics en quelques clics.
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3">Visualisation avancée</h3>
                <p className="text-gray-600">
                  Analysez vos données avec des graphiques et visualisations claires.
                </p>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3">Rapports automatisés</h3>
                <p className="text-gray-600">
                  Recevez des rapports périodiques sur les performances de vos sites.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 bg-gray-100">
          <div className="container text-center px-4">
            <h2 className="text-3xl font-bold mb-6">Prêt à optimiser vos analytics?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Rejoignez les entreprises qui utilisent notre plateforme pour améliorer leurs performances.
            </p>
            <Link to="/dashboard">
              <Button size="lg">
                Connecter mon compte Google Analytics
              </Button>
            </Link>
          </div>
        </section>
      </main>
      
      <footer className="bg-gray-800 text-white py-8">
        <div className="container">
          <div className="text-center">
            <p>&copy; 2025 AnalyConnect. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
