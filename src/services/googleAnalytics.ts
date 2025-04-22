import React from 'react';

// Mise à jour de l'URL de base de l'API et du CLIENT_ID
export const API_BASE_URL = "https://api.askeliott.com"; 
export const CLIENT_ID = "42921046273-93pb94sobo09o0jakrreq2vdeqkgjsdk.apps.googleusercontent.com";

// Constants pour les API URLs et scopes
//export const API_BASE_URL = "https://your-backend-api-url"; // Ajustez selon votre URL backend
//export const CLIENT_ID = "your-google-client-id"; // Remplacez par votre ID client Google

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
  if (!accountId) {
    throw new Error("L'identifiant du compte (accountId) est requis.");
  }

  const accessToken = getStoredAccessToken();
  if (!accessToken) {
    throw new Error("Aucun token d'accès trouvé. Veuillez vous reconnecter.");
  }

  try {
    // Log détaillé de l'identifiant de compte
    console.log(`Fetching properties for account ID: ${accountId}`);
    console.log(`Account ID type: ${typeof accountId}`);
    console.log(`Account ID length: ${accountId.length}`);

    // Afficher l'URL complète avec l'accountId et le token
    const url = `${API_BASE_URL}/api/analytics/properties?accountId=${encodeURIComponent(accountId)}&token=${encodeURIComponent(accessToken)}`;
    console.log(`Request URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error response: ${errorText}`);
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

// Fonction pour récupérer les comptes Google Analytics
export const fetchGoogleAnalyticsAccounts = async (): Promise<any[]> => {
  const accessToken = getStoredAccessToken();
  if (!accessToken) {
    throw new Error("Aucun token d'accès trouvé. Veuillez vous reconnecter.");
  }

  try {
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
    return data.accounts || [];
  } catch (error) {
    console.error("Erreur lors de la récupération des comptes Google Analytics:", error);
    throw error;
  }
};

// Fonction pour récupérer les propriétés Google Analytics
export const fetchGoogleAnalyticsProperties = async (accessToken: string): Promise<GoogleAnalyticsProperty[]> => {
  if (!accessToken) {
    throw new Error("Token d'accès requis pour récupérer les propriétés");
  }

  try {
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
    return (data.properties || []).map((prop: any) => ({
      id: prop.name ? prop.name.split("/").pop() : prop.id,
      name: prop.displayName,
      url: prop.webLink,
      createdAt: prop.createTime,
    }));
  } catch (error) {
    console.error("Erreur lors de la récupération des propriétés Google Analytics:", error);
    throw error;
  }
};

// Fonction pour récupérer les rapports Google Analytics
export const fetchGoogleAnalyticsReport = async (accessToken: string, propertyId: string): Promise<any> => {
  if (!accessToken) {
    throw new Error("Token d'accès requis pour récupérer les données analytiques");
  }

  if (!propertyId) {
    throw new Error("L'identifiant de la propriété est requis");
  }

  try {
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

    return await response.json();
  } catch (error) {
    console.error("Erreur lors de la récupération du rapport Google Analytics:", error);
    throw error;
  }
};
