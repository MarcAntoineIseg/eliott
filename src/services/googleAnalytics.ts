import { google } from '@google/client-api';

// Service pour interagir avec l'API Google Analytics

const CLIENT_ID = "42921046273-93pb94sobo09o0jakrreq2vdeqkgjsdk.apps.googleusercontent.com";

export interface GoogleAnalyticsProperty {
  id: string;
  name: string;
  url?: string;
  createdAt?: string;
}

export const getAccessTokenFromUrl = (): string | null => {
  const hash = window.location.hash;
  if (!hash || hash.length < 2) return null;

  try {
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");
    console.log("Access token extracted from URL:", accessToken ? "Found (length: " + accessToken.length + ")" : "Not found");

    if (accessToken) {
      localStorage.setItem("googleAccessToken", accessToken);
      console.log("Access token saved to localStorage");
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return accessToken;
  } catch (error) {
    console.error("Error extracting access token from URL:", error);
    return null;
  }
};

export const getStoredAccessToken = (): string | null => {
  const token = localStorage.getItem("googleAccessToken");
  console.log("Retrieved token from localStorage:", token ? "Found" : "Not found");
  return token;
};

export const checkTokenValidity = async (accessToken: string): Promise<boolean> => {
  if (!accessToken || accessToken.trim() === "") {
    console.error("No token provided to validate");
    return false;
  }

  try {
    console.log("Checking token validity...");
    const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${encodeURIComponent(accessToken)}`);
    console.log("Token validation response status:", response.status);

    if (!response.ok) {
      console.error("Token invalid:", await response.text());
      localStorage.removeItem("googleAccessToken");
      return false;
    }

    const data = await response.json();
    console.log("Token info:", data);

    const hasRequiredScopes = GOOGLE_ANALYTICS_SCOPES.every(scope => data.scope && data.scope.includes(scope));
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

// Modification de l'URL de base pour correspondre à l'emplacement de votre API backend
export const API_BASE_URL = "https://api.askeliott.com";  // Supposant que votre backend est en local sur le port 3000

export const fetchGoogleAnalyticsAccountProperties = async (accountId: string): Promise<any[]> => {
  if (!accountId) {
    throw new Error("L'identifiant du compte (accountId) est requis.");
  }

  const accessToken = getStoredAccessToken();
  if (!accessToken) {
    throw new Error("Aucun token d'accès trouvé. Veuillez vous reconnecter.");
  }

  try {
    console.log(`Fetching properties for account ID: ${accountId}`);
    
    const url = `${API_BASE_URL}/api/analytics/properties?accountId=${encodeURIComponent(accountId)}&token=${encodeURIComponent(accessToken)}`;
    console.log(`Request URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log("Properties API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API properties error:", response.status, errorText);
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

// Les autres fonctions seront mises à jour de la même manière
export const fetchGoogleAnalyticsProperties = async (accessToken: string): Promise<GoogleAnalyticsProperty[]> => {
  if (!accessToken) {
    throw new Error("Token d'accès non fourni");
  }

  try {
    console.log("Fetching Google Analytics properties...");
    
    const url = `${API_BASE_URL}/api/analytics/properties?token=${encodeURIComponent(accessToken)}`;
    console.log(`Request URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur API: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.properties || [];
  } catch (error) {
    console.error("Erreur lors de la récupération des propriétés:", error);
    throw error;
  }
};

export const fetchGoogleAnalyticsReport = async (accessToken: string, propertyId: string) => {
  if (!accessToken) {
    throw new Error("Token d'accès non fourni");
  }

  try {
    console.log(`Fetching report data for property ${propertyId}`);
    
    const url = `${API_BASE_URL}/api/analytics/data?propertyId=${encodeURIComponent(propertyId)}&token=${encodeURIComponent(accessToken)}`;
    console.log(`Report request URL: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur API: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur lors de la récupération du rapport:", error);
    throw error;
  }
};

export const fetchGoogleAnalyticsAccounts = async (): Promise<any[]> => {
  try {
    const accessToken = getStoredAccessToken();
    if (!accessToken) {
      throw new Error("Aucun token d'accès trouvé. Veuillez vous reconnecter.");
    }

    const url = `${API_BASE_URL}/api/analytics/accounts?token=${encodeURIComponent(accessToken)}`;
    console.log(`Accounts request URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur API Comptes: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.accounts || [];
  } catch (error) {
    console.error("Erreur lors de la récupération des comptes Analytics:", error);
    throw error;
  }
};

export const GOOGLE_ANALYTICS_SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "openid"
];

export { CLIENT_ID };
