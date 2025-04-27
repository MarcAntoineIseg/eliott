
const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-[#f4f6f9] py-12">
      <main className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Politique de confidentialité</h1>
        <div className="prose prose-lg max-w-none space-y-6 bg-white p-8 rounded-lg shadow">
          <p className="text-gray-600">Dernière mise à jour : 27/04/2025</p>

          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Présentation</h2>
            <p>Bienvenue sur Eliott. Nous nous engageons à protéger la confidentialité de vos données personnelles. Cette politique décrit quelles données nous collectons, comment nous les utilisons, et comment vous pouvez exercer vos droits, conformément au Règlement Général sur la Protection des Données (RGPD) et aux exigences de Google API Services User Data Policy.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Responsable du traitement</h2>
            <p>Nom : Eliott</p>
            <p>Adresse : 535 rue du mas de verchant, 34170 Castelnau-le-Lez</p>
            <p>Email de contact : marco99103@gmail.com</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Données collectées</h2>
            <p>Lorsque vous utilisez Eliott, nous collectons uniquement les données nécessaires au fonctionnement de l'application :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Données personnelles : votre nom, votre adresse email, et votre photo de profil Google (lors de l'authentification OAuth).</li>
              <li>Données de connexion : tokens d'accès OAuth 2.0 pour accéder à vos services connectés (Google Analytics).</li>
              <li>Données analytiques : informations issues de vos comptes Google Analytics (nom du compte, ID de propriété, métriques, dimensions).</li>
            </ul>
            <p>Nous ne collectons aucune donnée sensible non nécessaire.</p>
            <p>Nous n'avons pas accès à vos mots de passe.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Finalités de la collecte</h2>
            <p>Les données collectées sont utilisées uniquement pour :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Vous authentifier et sécuriser l'accès à votre compte.</li>
              <li>Permettre la connexion à vos outils marketing (Google Analytics).</li>
              <li>Traiter vos requêtes et afficher les résultats sous forme de tableaux de bord analytiques personnalisés.</li>
              <li>Améliorer la qualité et la sécurité de nos services.</li>
            </ul>
            <p>Nous n'utilisons vos données pour aucune autre finalité que celles décrites ici.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Accès, partage et divulgation</h2>
            <p>Vos données personnelles ne sont ni vendues ni partagées avec des tiers pour des finalités commerciales.</p>
            <p>Vos données peuvent être accessibles :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Aux serveurs et bases de données nécessaires à l'hébergement et au fonctionnement d'Eliott.</li>
              <li>Aux services Google API connectés à votre demande.</li>
            </ul>
            <p>Nous utilisons des prestataires conformes RGPD et protégeons vos données via des mesures contractuelles strictes.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Stockage et sécurité</h2>
            <p>Les données collectées sont stockées de manière sécurisée sur :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Un serveur privé situé en Europe (hébergé par OVH).</li>
              <li>Firebase pour l'authentification et la base de données sécurisée.</li>
            </ul>
            <p>Nous appliquons des mesures de sécurité appropriées pour protéger vos données contre l'accès non autorisé, la perte, l'altération ou la divulgation.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Conservation des données</h2>
            <p>Nous conservons vos données uniquement :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Pendant la durée nécessaire à l'exécution du service.</li>
              <li>Jusqu'à la suppression de votre compte ou votre demande de suppression.</li>
            </ul>
            <p>Vous pouvez à tout moment demander la suppression de vos données en nous contactant à marco99103@gmail.com.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Consentement</h2>
            <p>Lorsque vous connectez votre compte Google, vous consentez explicitement :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>À l'accès par Eliott aux informations minimales nécessaires (identité, Google Analytics data).</li>
              <li>À l'utilisation de ces données uniquement pour vous fournir les fonctionnalités prévues.</li>
            </ul>
            <p>Vous pouvez révoquer l'accès à tout moment via Google Account Permissions page.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Vos droits</h2>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Droit d'accès.</li>
              <li>Droit de rectification.</li>
              <li>Droit d'effacement (droit à l'oubli).</li>
              <li>Droit d'opposition.</li>
              <li>Droit à la limitation du traitement.</li>
              <li>Droit à la portabilité des données.</li>
            </ul>
            <p>Pour exercer ces droits, contactez-nous à marco99103@gmail.com.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Utilisation des API Google</h2>
            <p>Notre application utilise les API de Google uniquement pour accéder aux données nécessaires à son fonctionnement, conformément aux politiques de Google :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Google API Services User Data Policy</li>
              <li>Google OAuth 2.0 Policies</li>
            </ul>
            <p>Nous nous engageons à respecter ces règles et à limiter l'utilisation des données aux seules fonctionnalités prévues.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Modifications de cette politique</h2>
            <p>Nous pouvons mettre à jour cette politique si nécessaire. Les changements importants vous seront notifiés via l'application ou par e-mail.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Contact</h2>
            <p>Pour toute question relative à cette politique ou à vos données personnelles, vous pouvez nous contacter à :</p>
            <p>Email : marco99103@gmail.com</p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
