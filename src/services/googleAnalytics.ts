
// Service pour interagir avec l'API Google Analytics

const CLIENT_ID = "42921046273-93pb94sobo09o0jakrreq2vdeqkgjsdk.apps.googleusercontent.com";

export interface GoogleAnalyticsProperty {
  id: string;
  name: string;
  url?: string;
  createdAt?: string;
}

// Extraction du token d'accès depuis l'URL après redirection OAuth
export const getAccessTokenFromUrl = (): string | null => {
  const hash = window.location.hash;
  if (!hash) return null;
  
  const params = new URLSearchParams(hash.substring(1));
  return params.get("access_token");
};

// Récupération des propriétés Google Analytics
export const fetchGoogleAnalyticsProperties = async (accessToken: string): Promise<GoogleAnalyticsProperty[]> => {
  try {
    console.log("Fetching Google Analytics properties with token:", accessToken.substring(0, 10) + "...");
    
    const response = await fetch(
      "https://analyticsadmin.googleapis.com/v1beta/properties",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API response error:", response.status, errorText);
      throw new Error(`Erreur API: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("API response data:", data);
    
    // Transformation des données
    return data.properties ? data.properties.map((prop: any) => ({
      id: prop.name.split("/").pop(),
      name: prop.displayName,
      url: prop.webLink,
      createdAt: prop.createTime,
    })) : [];
    
  } catch (error) {
    console.error("Erreur lors de la récupération des propriétés:", error);
    throw error; // Relancer l'erreur pour la gérer dans le composant
  }
};

// Les scopes corrects selon la documentation de Google Analytics Admin API
export const GOOGLE_ANALYTICS_SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/analytics.edit"
];

export { CLIENT_ID };
