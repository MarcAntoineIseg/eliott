import { 
  checkTokenValidity, 
  fetchGoogleAnalyticsProperties, 
  fetchGoogleAnalyticsReport,
  getStoredAccessToken,
  fetchGoogleAnalyticsAccounts,
  fetchGoogleAnalyticsAccountProperties,
  API_BASE_URL
} from "./googleAnalytics";

// Mise à jour des points d'entrée de l'API pour utiliser le backend
const API_ENDPOINTS = {
  AUTH_GOOGLE: `${API_BASE_URL}/auth/google`,
  ANALYTICS_ACCOUNTS: `${API_BASE_URL}/api/analytics/accounts`,
  ANALYTICS_PROPERTIES: `${API_BASE_URL}/api/analytics/properties`,
  ANALYTICS_DATA: `${API_BASE_URL}/api/analytics/data`
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

// Fonction pour obtenir les comptes Analytics (via ton backend)
export const getGoogleAnalyticsAccounts = async () => {
  return await fetchGoogleAnalyticsAccounts();
};

// Fonction pour obtenir les propriétés d'un compte Analytics
export const getGoogleAnalyticsAccountProperties = async (accountId: string) => {
  if (!accountId) throw new Error("accountId requis");

  // Nous ne modifions plus l'ID pour extraire uniquement la partie numérique
  // Nous conservons le format complet attendu par l'API
  console.log(`Getting properties for account ID: ${accountId}`);
  return await fetchGoogleAnalyticsAccountProperties(accountId);
};

export { API_ENDPOINTS };
