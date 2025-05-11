import {
  fetchGoogleAnalyticsProperties,
  fetchGoogleAnalyticsReport,
  API_BASE_URL
} from "./googleAnalytics";

// ✅ Endpoints backend
export const API_ENDPOINTS = {
  AUTH_GOOGLE: `${API_BASE_URL}/auth/google`,
  ANALYTICS_ACCOUNTS: `${API_BASE_URL}/api/analytics/accounts`,
  ANALYTICS_PROPERTIES: `${API_BASE_URL}/api/analytics/properties`,
  ANALYTICS_DATA: `${API_BASE_URL}/api/analytics/data`
};

// 🔁 Obtenir les comptes GA sécurisés via Firebase Auth
export const getGoogleAnalyticsAccounts = async (idToken: string) => {
  const response = await fetch(API_ENDPOINTS.ANALYTICS_ACCOUNTS, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur API Comptes GA: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.accounts || [];
};

// 🔁 Obtenir les propriétés GA d’un compte spécifique
export const getGoogleAnalyticsAccountProperties = async (
  accountId: string,
  idToken: string
) => {
  if (!accountId) throw new Error("accountId requis");

  const url = `${API_ENDPOINTS.ANALYTICS_PROPERTIES}?accountId=${encodeURIComponent(accountId)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur API Propriétés GA: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.properties || [];
};

// 🔁 Obtenir toutes les propriétés GA disponibles pour l'utilisateur (si aucun accountId n’est précisé)
export const getGoogleAnalyticsProperties = async (idToken: string) => {
  const response = await fetch(API_ENDPOINTS.ANALYTICS_PROPERTIES, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur API Propriétés GA: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.properties || [];
};

// 🔁 Obtenir un rapport GA d’une propriété
export const getGoogleAnalyticsData = async (
  propertyId: string,
  idToken: string
) => {
  const url = `${API_ENDPOINTS.ANALYTICS_DATA}?propertyId=${encodeURIComponent(propertyId)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur API Données GA: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data;
};

// ➕ Utilitaire pour construire dynamiquement des URLs d’API avec query params
export const getApiUrl = (
  endpoint: string,
  queryParams?: Record<string, string>
): string => {
  let url = endpoint;
  if (queryParams) {
    const params = new URLSearchParams(queryParams);
    url += `?${params.toString()}`;
  }
  return url;
};
