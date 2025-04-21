
import { 
  checkTokenValidity, 
  fetchGoogleAnalyticsProperties, 
  fetchGoogleAnalyticsReport,
  getStoredAccessToken
} from "./googleAnalytics";

// Définition des points d'entrée de l'API
const API_ENDPOINTS = {
  AUTH_GOOGLE: "/api/auth/google",
  ANALYTICS_ACCOUNTS: "/api/analytics/accounts",
  ANALYTICS_PROPERTIES: "/api/analytics/properties",
  ANALYTICS_DATA: "/api/analytics/data"
};

// Fonction pour obtenir les propriétés Analytics
export const getGoogleAnalyticsProperties = async (accessToken: string) => {
  if (!accessToken) {
    throw new Error("Token d'accès non fourni");
  }
  
  // Vérification de la validité du token
  const isValid = await checkTokenValidity(accessToken);
  if (!isValid) {
    throw new Error("Token d'accès invalide ou expiré");
  }
  
  return fetchGoogleAnalyticsProperties(accessToken);
};

// Fonction pour obtenir les données analytiques d'une propriété
export const getGoogleAnalyticsData = async (accessToken: string, propertyId: string) => {
  if (!accessToken) {
    throw new Error("Token d'accès non fourni");
  }
  
  // Vérification de la validité du token
  const isValid = await checkTokenValidity(accessToken);
  if (!isValid) {
    throw new Error("Token d'accès invalide ou expiré");
  }
  
  return fetchGoogleAnalyticsReport(accessToken, propertyId);
};

// Fournit les URLs des différents endpoints API
export const getApiUrl = (endpoint: string, queryParams?: Record<string, string>) => {
  let url = endpoint;
  
  if (queryParams) {
    const params = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      params.append(key, value);
    });
    url += `?${params.toString()}`;
  }
  
  return url;
};

import { fetchGoogleAnalyticsAccounts } from "./googleAnalytics";

// Fonction pour obtenir les comptes Analytics (via ton backend)
export const getGoogleAnalyticsAccounts = async () => {
  // On utilise maintenant le token stocké dans localStorage
  return await fetchGoogleAnalyticsAccounts();
};

import { fetchGoogleAnalyticsAccountProperties } from "./googleAnalytics";

export const getGoogleAnalyticsAccountProperties = async (accountId: string) => {
  if (!accountId) throw new Error("accountId requis");
  return await fetchGoogleAnalyticsAccountProperties(accountId);
};

export { API_ENDPOINTS };
