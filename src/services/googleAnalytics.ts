
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
    
    // Si un token est trouvé, le stocker dans localStorage
    if (accessToken) {
      localStorage.setItem("googleAccessToken", accessToken);
      console.log("Access token saved to localStorage");
      
      // Nettoyer l'URL après avoir stocké le token
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    return accessToken;
  } catch (error) {
    console.error("Error extracting access token from URL:", error);
    return null;
  }
};

// Récupération du token depuis localStorage
export const getStoredAccessToken = (): string | null => {
  const token = localStorage.getItem("googleAccessToken");
  console.log("Retrieved token from localStorage:", token ? "Found" : "Not found");
  return token;
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
      // Si le token est invalide, le supprimer du localStorage
      localStorage.removeItem("googleAccessToken");
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
      localStorage.removeItem("googleAccessToken");
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
    
    // Appel à notre API backend qui utilisera googleapis comme suggéré
    const response = await fetch(
      "/api/analytics/properties",
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include' // Pour envoyer les cookies de session
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

// Utiliser l'endpoint backend au lieu de l'appel direct à l'API Google
export const fetchGoogleAnalyticsReport = async (accessToken: string, propertyId: string) => {
  if (!accessToken || accessToken.trim() === "") {
    throw new Error("Token d'accès non fourni ou invalide");
  }
  
  try {
    console.log(`Fetching report data for property ${propertyId}`);
    
    // Appel à l'API backend avec credentials pour envoyer les cookies de session
    // ET l'accessToken dans l'en-tête Authorization
    const response = await fetch(
      `/api/analytics/data?propertyId=${encodeURIComponent(propertyId)}`,
      {
        method: 'GET',
        credentials: 'include', // Important: envoie les cookies de session
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
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

// Nouvelle fonction pour récupérer les comptes Google Analytics via le backend
export const fetchGoogleAnalyticsAccounts = async (): Promise<any[]> => {
  try {
    // Récupérer le token depuis localStorage
    const accessToken = getStoredAccessToken();
    if (!accessToken) {
      throw new Error("Aucun token d'accès trouvé. Veuillez vous reconnecter.");
    }
    
    const response = await fetch("/api/analytics/accounts", {
      method: "GET",
      credentials: "include", // Assure que la session (cookie) est envoyée
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${accessToken}` // Ajouter le token dans l'en-tête
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur API Comptes: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    // Selon le format de retour, tu veux probablement retourner data.accounts ou data
    return data.accounts || [];
  } catch (error) {
    console.error("Erreur lors de la récupération des comptes Analytics:", error);
    throw error;
  }
};

// Les scopes corrects pour Google Analytics Admin API et Data API
export const GOOGLE_ANALYTICS_SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "openid"
];

export { CLIENT_ID };

export const fetchGoogleAnalyticsAccountProperties = async (accountId: string): Promise<any[]> => {
  if (!accountId) {
    throw new Error("L'identifiant du compte (accountId) est requis.");
  }
  try {
    // Récupérer le token depuis localStorage
    const accessToken = getStoredAccessToken();
    if (!accessToken) {
      throw new Error("Aucun token d'accès trouvé. Veuillez vous reconnecter.");
    }
    
    const response = await fetch(`/api/analytics/properties?accountId=${encodeURIComponent(accountId)}`, {
      method: "GET",
      credentials: "include", // Session avec cookie
      headers: { 
        "Accept": "application/json",
        "Authorization": `Bearer ${accessToken}` // Ajouter le token dans l'en-tête
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur API propriétés: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    // La réponse aura probablement la forme { properties: [...] }, sinon retourner data directement
    return data.properties || [];
  } catch (error) {
    console.error("Erreur lors de la récupération des propriétés GA4 par compte:", error);
    throw error;
  }
};
