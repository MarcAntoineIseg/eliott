export const API_BASE_URL = "https://api.askeliott.com"; 
export const CLIENT_ID = "42921046273-93pb94sobo09o0jakrreq2vdeqkgjsdk.apps.googleusercontent.com";
export const REDIRECT_URI = "https://app.askeliott.com/integration";

export const GOOGLE_ANALYTICS_SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/analytics",
  "https://www.googleapis.com/auth/analytics.edit"
];

// Type
export interface GoogleAnalyticsProperty {
  id: string;
  name: string;
  url?: string;
  createdAt?: string;
}

// 🧠 Simple cache local en mémoire
const CACHE_DURATION = 5 * 60 * 1000; // 5 min
interface CacheItem<T> {
  data: T;
  timestamp: number;
}
const cache: Record<string, CacheItem<any>> = {};

const getCachedData = <T>(key: string): T | null => {
  const item = cache[key];
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_DURATION) {
    delete cache[key];
    return null;
  }
  return item.data as T;
};

const setCachedData = <T>(key: string, data: T): void => {
  cache[key] = { data, timestamp: Date.now() };
};

// ✅ Récupérer propriétés GA pour un compte donné
export const fetchGoogleAnalyticsAccountProperties = async (accountId: string, idToken: string): Promise<GoogleAnalyticsProperty[]> => {
  const cacheKey = `properties_${accountId}`;
  const cached = getCachedData<GoogleAnalyticsProperty[]>(cacheKey);
  if (cached) return cached;

  const url = `${API_BASE_URL}/api/analytics/properties?accountId=${encodeURIComponent(accountId)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json"
    }
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Erreur API GA4 properties: ${msg}`);
  }

  const data = await res.json();
  const properties = (data.properties || []).map((prop: any) => ({
    id: prop.name ? prop.name.split("/").pop() : prop.id,
    name: prop.displayName,
    url: prop.webLink,
    createdAt: prop.createTime
  }));

  setCachedData(cacheKey, properties);
  return properties;
};

// ✅ Récupérer tous les comptes GA pour un utilisateur
export const fetchGoogleAnalyticsAccounts = async (idToken: string): Promise<any[]> => {
  const cacheKey = 'accounts';
  const cached = getCachedData<any[]>(cacheKey);
  if (cached) return cached;

  const res = await fetch(`${API_BASE_URL}/api/analytics/accounts`, {
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json"
    }
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Erreur API comptes GA: ${msg}`);
  }

  const data = await res.json();
  const accounts = (data.accounts || []).filter((acc: any) =>
    !acc.deleted && (acc.state === 'ACTIVE' || acc.state === undefined)
  );

  setCachedData(cacheKey, accounts);
  return accounts;
};

// ✅ Récupérer toutes les propriétés disponibles (sans préciser de compte)
export const fetchGoogleAnalyticsProperties = async (idToken: string): Promise<GoogleAnalyticsProperty[]> => {
  const cacheKey = "all_properties";
  const cached = getCachedData<GoogleAnalyticsProperty[]>(cacheKey);
  if (cached) return cached;

  const res = await fetch(`${API_BASE_URL}/api/analytics/properties`, {
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json"
    }
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Erreur API propriétés GA: ${msg}`);
  }

  const data = await res.json();
  const properties = (data.properties || []).map((prop: any) => ({
    id: prop.name ? prop.name.split("/").pop() : prop.id,
    name: prop.displayName,
    url: prop.webLink,
    createdAt: prop.createTime
  }));

  setCachedData(cacheKey, properties);
  return properties;
};

// ✅ Récupérer un rapport GA pour une propriété
export const fetchGoogleAnalyticsReport = async (idToken: string, propertyId: string): Promise<any> => {
  if (!propertyId) throw new Error("Property ID requis");

  const cacheKey = `report_${propertyId}`;
  const cached = getCachedData<any>(cacheKey);
  if (cached) return cached;

  const url = `${API_BASE_URL}/api/analytics/data?propertyId=${encodeURIComponent(propertyId)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json"
    }
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Erreur API rapport GA: ${msg}`);
  }

  const data = await res.json();
  setCachedData(cacheKey, data);
  return data;
};
