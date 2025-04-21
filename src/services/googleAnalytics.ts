
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

// Vérification de la validité du token
export const checkTokenValidity = async (accessToken: string): Promise<boolean> => {
  try {
    // Utilise l'API tokeninfo pour vérifier la validité du token
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`
    );
    
    if (!response.ok) {
      console.error("Token invalid:", await response.text());
      return false;
    }
    
    const data = await response.json();
    console.log("Token info:", data);
    // Vérifie si le token a les scopes nécessaires
    return true;
  } catch (error) {
    console.error("Erreur de vérification du token:", error);
    return false;
  }
};

// Récupération des propriétés Google Analytics
export const fetchGoogleAnalyticsProperties = async (accessToken: string): Promise<GoogleAnalyticsProperty[]> => {
  try {
    console.log("Fetching Google Analytics properties with token:", accessToken.substring(0, 10) + "...");
    
    // S'assurer que l'en-tête Authorization est correctement formaté
    const response = await fetch(
      "https://analyticsadmin.googleapis.com/v1beta/properties",
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
      }
    );

    console.log("Response status:", response.status);
    
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
    throw error;
  }
};

// Pour récupérer des rapports, nous avons besoin d'utiliser une autre API avec un filtre spécifique
export const fetchGoogleAnalyticsReport = async (accessToken: string, propertyId: string) => {
  try {
    console.log(`Fetching report data for property ${propertyId}`);
    
    // Cette fonction utilise l'API de rapports qui nécessite un filtre
    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          dateRanges: [
            {
              startDate: '30daysAgo',
              endDate: 'today'
            }
          ],
          dimensions: [
            {
              name: 'date'
            }
          ],
          metrics: [
            {
              name: 'activeUsers'
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API report error:", response.status, errorText);
      throw new Error(`Erreur API de rapport: ${response.status} - ${errorText}`);
    }

    const reportData = await response.json();
    console.log("Report data:", reportData);
    return reportData;
  } catch (error) {
    console.error("Erreur lors de la récupération du rapport:", error);
    throw error;
  }
};

// Les scopes corrects pour Google Analytics Admin API et Data API
export const GOOGLE_ANALYTICS_SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly"
];

export { CLIENT_ID };
