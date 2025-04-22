
export const fetchGoogleAnalyticsAccountProperties = async (accountId: string): Promise<any[]> => {
  if (!accountId) {
    throw new Error("L'identifiant du compte (accountId) est requis.");
  }

  const accessToken = getStoredAccessToken();
  if (!accessToken) {
    throw new Error("Aucun token d'accès trouvé. Veuillez vous reconnecter.");
  }

  try {
    // Log détaillé de l'identifiant de compte
    console.log(`Fetching properties for account ID: ${accountId}`);
    console.log(`Account ID type: ${typeof accountId}`);
    console.log(`Account ID length: ${accountId.length}`);

    // Afficher l'URL complète avec l'accountId et le token
    const url = `${API_BASE_URL}/api/analytics/properties?accountId=${encodeURIComponent(accountId)}&token=${encodeURIComponent(accessToken)}`;
    console.log(`Request URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error response: ${errorText}`);
      throw new Error(`Erreur API: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Properties data:", data);
    return data.properties || [];
  } catch (error) {
    console.error("Erreur lors de la récupération des propriétés GA4 par compte:", error);
    throw error;
  }
};
