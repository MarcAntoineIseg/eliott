import React from 'react';

// Mise à jour de l'URL de base de l'API et du CLIENT_ID
export const API_BASE_URL = "https://api.askeliott.com"; 
export const CLIENT_ID = "42921046273-93pb94sobo09o0jakrreq2vdeqkgjsdk.apps.googleusercontent.com";

// Add a new constant for the redirect URI
export const REDIRECT_URI = "https://app.askeliott.com/integration";

// Définition des scopes OAuth2 nécessaires pour Google Analytics
export const GOOGLE_ANALYTICS_SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/analytics",
  "https://www.googleapis.com/auth/analytics.edit"
];

// Type pour les propriétés Google Analytics
export interface GoogleAnalyticsProperty {
  id: string;
  name: string;
  url?: string;
  createdAt?: string;
}

// Cache mechanism
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
interface CacheItem<T> {
  data: T;
  timestamp: number;
}

const cache: Record<string, CacheItem<any>> = {};

const getCachedData = <T>(key: string): T | null => {
  const item = cache[key];
  if (!item) return null;
  
  const now = Date.now();
  if (now - item.timestamp > CACHE_DURATION) {
    // Cache expired
    delete cache[key];
    return null;
  }
  
  console.log(`Using cached data for ${key}`);
  return item.data as T;
};

const setCachedData = <T>(key: string, data: T): void => {
  cache[key] = {
    data,
    timestamp: Date.now()
  };
  console.log(`Cached data for ${key}`);
};

// Fonction pour récupérer le token d'accès stocké
export const getStoredAccessToken = (): string | null => {
  return localStorage.getItem("googleAccessToken");
};

// Fonction pour extraire le token d'accès de l'URL (après redirection OAuth)
export const getAccessTokenFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token");
  
  if (accessToken) {
    console.log("Token extrait de l'URL:", accessToken.substring(0, 10) + "...");
    return accessToken;
  }
  
  return null;
};

// Vérification de la validité du token
export const checkTokenValidity = async (accessToken: string): Promise<boolean> => {
  try {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=" + accessToken);
    return response.ok;
  } catch (error) {
    console.error("Erreur lors de la vérification du token:", error);
    return false;
  }
};

export const fetchGoogleAnalyticsAccountProperties = async (accountId: string): Promise<any[]> => {
  // Use cache if available
  const cacheKey = `properties_${accountId}`;
  const cachedData = getCachedData<any[]>(cacheKey);
  if (cachedData) return cachedData;

  // Validation robuste de l'accountId
  if (!accountId) {
    console.error("Erreur : L'identifiant du compte (accountId) est requis.");
    throw new Error("L'identifiant du compte (accountId) est requis.");
  }

  // Log détaillé pour le débogage
  console.log(`Type de accountId: ${typeof accountId}`);
  console.log(`Longueur de accountId: ${accountId.length}`);
  console.log(`Valeur brute de accountId: ${accountId}`);

  const accessToken = getStoredAccessToken();
  if (!accessToken) {
    console.error("Erreur : Aucun token d'accès trouvé.");
    throw new Error("Aucun token d'accès trouvé. Veuillez vous reconnecter.");
  }

  try {
    // Keep the existing formatting logic
    let parentParam = accountId;
    
    // If the accountId doesn't start with "accounts/", format it
    if (!accountId.startsWith('accounts/')) {
      parentParam = `accounts/${accountId}`;
      console.log(`AccountId reformaté en parent: ${parentParam}`);
    }
    
    // Remove encoding for the URL parameter
    const url = `${API_BASE_URL}/api/analytics/properties?accountId=${parentParam}&token=${encodeURIComponent(accessToken)}`;
    console.log(`URL de requête complète: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Log du statut de la réponse
    console.log(`Statut de la réponse : ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur API détaillée : ${response.status} - ${errorText}`);
      throw new Error(`Erreur API: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Données des propriétés reçues:", data);
    
    // Cache the results
    setCachedData(cacheKey, data.properties || []);
    
    return data.properties || [];
  } catch (error) {
    console.error("Erreur lors de la récupération des propriétés GA4 par compte:", error);
    throw error;
  }
};

export const fetchGoogleAnalyticsAccounts = async (): Promise<any[]> => {
  // Use cache if available
  const cacheKey = 'accounts';
  const cachedData = getCachedData<any[]>(cacheKey);
  if (cachedData) return cachedData;

  const accessToken = getStoredAccessToken();
  if (!accessToken) {
    throw new Error("Aucun token d'accès trouvé. Veuillez vous reconnecter.");
  }

  try {
    // Correction: Assurer que l'URL est complètement formée
    const url = `${API_BASE_URL}/api/analytics/accounts?token=${encodeURIComponent(accessToken)}`;
    console.log(`Fetching accounts from: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log(`Accounts response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error response: ${errorText}`);
      throw new Error(`Erreur API: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Accounts data:", data);
    
    // Filter active accounts only
    const activeAccounts = (data.accounts || []).filter((account: any) => 
      !account.deleted && (account.state === 'ACTIVE' || account.state === undefined)
    );
    
    console.log(`Filtered ${activeAccounts.length} active accounts out of ${(data.accounts || []).length} total`);
    
    // Cache the results
    setCachedData(cacheKey, activeAccounts);
    
    return activeAccounts;
  } catch (error) {
    console.error("Erreur lors de la récupération des comptes Google Analytics:", error);
    throw error;
  }
};

// Fonction pour récupérer les propriétés Google Analytics
export const fetchGoogleAnalyticsProperties = async (accessToken: string): Promise<GoogleAnalyticsProperty[]> => {
  // Use cache if available
  const cacheKey = 'all_properties';
  const cachedData = getCachedData<GoogleAnalyticsProperty[]>(cacheKey);
  if (cachedData) return cachedData;

  if (!accessToken) {
    throw new Error("Token d'accès requis pour récupérer les propriétés");
  }

  try {
    // Correction: URL complète avec le domaine
    const url = `${API_BASE_URL}/api/analytics/properties?token=${encodeURIComponent(accessToken)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    const properties = (data.properties || []).map((prop: any) => ({
      id: prop.name ? prop.name.split("/").pop() : prop.id,
      name: prop.displayName,
      url: prop.webLink,
      createdAt: prop.createTime,
    }));
    
    // Cache the results
    setCachedData(cacheKey, properties);
    
    return properties;
  } catch (error) {
    console.error("Erreur lors de la récupération des propriétés Google Analytics:", error);
    throw error;
  }
};

// Fonction pour récupérer les rapports Google Analytics
export const fetchGoogleAnalyticsReport = async (accessToken: string, propertyId: string): Promise<any> => {
  // Use cache if available
  const cacheKey = `report_${propertyId}`;
  const cachedData = getCachedData<any>(cacheKey);
  if (cachedData) return cachedData;

  if (!accessToken) {
    throw new Error("Token d'accès requis pour récupérer les données analytiques");
  }

  if (!propertyId) {
    throw new Error("L'identifiant de la propriété est requis");
  }

  try {
    // Correction: URL complète avec le domaine
    const url = `${API_BASE_URL}/api/analytics/data?propertyId=${encodeURIComponent(propertyId)}&token=${encodeURIComponent(accessToken)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    
    // Cache the results
    setCachedData(cacheKey, data);
    
    return data;
  } catch (error) {
    console.error("Erreur lors de la récupération du rapport Google Analytics:", error);
    throw error;
  }
};
