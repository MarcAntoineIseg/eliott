
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
  if (!hash || hash.length < 2) return null;
  
  try {
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");
    console.log("Access token extracted from URL:", accessToken ? "Found (length: " + accessToken.length + ")" : "Not found");
    return accessToken;
  } catch (error) {
    console.error("Error extracting access token from URL:", error);
    return null;
  }
};

// Vérification de la validité du token
export const checkTokenValidity = async (accessToken: string): Promise<boolean> => {
  if (!accessToken || accessToken.trim() === "") {
    console.error("No token provided to validate");
    return false;
  }
  
  try {
    console.log("Checking token validity...");
    // Utilise l'API tokeninfo pour vérifier la validité du token
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
    );
    
    console.log("Token validation response status:", response.status);
    
    if (!response.ok) {
      console.error("Token invalid:", await response.text());
      return false;
    }
    
    const data = await response.json();
    console.log("Token info:", data);
    
    // Vérifier que le token a accès aux scopes nécessaires
    const hasRequiredScopes = GOOGLE_ANALYTICS_SCOPES.every(scope => 
      data.scope && data.scope.includes(scope)
    );
    
    if (!hasRequiredScopes) {
      console.error("Token does not have required scopes");
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Erreur de vérification du token:", error);
    return false;
  }
};

// Récupération des propriétés Google Analytics
export const fetchGoogleAnalyticsProperties = async (accessToken: string): Promise<GoogleAnalyticsProperty[]> => {
  if (!accessToken || accessToken.trim() === "") {
    console.error("No access token provided for fetching properties");
    throw new Error("Token d'accès non fourni ou invalide");
  }
  
  try {
    console.log("Fetching Google Analytics properties with token:", 
      accessToken.substring(0, 5) + "..." + accessToken.substring(accessToken.length - 5));
    
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

    console.log("Fetch properties response status:", response.status);
    
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

// Pour récupérer des rapports, nous avons besoin d'utiliser une autre API avec un paramètre filter
export const fetchGoogleAnalyticsReport = async (accessToken: string, propertyId: string) => {
  if (!accessToken || accessToken.trim() === "") {
    throw new Error("Token d'accès non fourni ou invalide");
  }
  
  try {
    console.log(`Fetching report data for property ${propertyId}`);
    
    // Mise à jour pour inclure un filtre valide pour résoudre l'erreur 400
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
          ],
          // Ajout d'un filtre pour résoudre l'erreur 400
          dimensionFilter: {
            filter: {
              fieldName: "date",
              stringFilter: {
                matchType: "CONTAINS",
                value: "20" // Filtre toutes les dates contenant "20" (comme 2023, 2024, etc.)
              }
            }
          }
        })
      }
    );

    console.log("Report API response status:", response.status);

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
