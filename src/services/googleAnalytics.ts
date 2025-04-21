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

export const API_BASE_URL = "https://api.askeliott.com";

export const fetchGoogleAnalyticsProperties = async (accessToken: string): Promise<GoogleAnalyticsProperty[]> => {
  if (!accessToken || accessToken.trim() === "") {
    console.error("No access token provided for fetching properties");
    throw new Error("Token d'accès non fourni ou invalide");
  }

  try {
    console.log("Fetching Google Analytics properties with token:", accessToken.substring(0, 5) + "..." + accessToken.substring(accessToken.length - 5));

    const response = await fetch(
      `${API_BASE_URL}/api/analytics/properties?token=${accessToken}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
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

export const fetchGoogleAnalyticsReport = async (accessToken: string, propertyId: string) => {
  if (!accessToken || accessToken.trim() === "") {
    throw new Error("Token d'accès non fourni ou invalide");
  }

  try {
    console.log(`Fetching report data for property ${propertyId}`);

    const response = await fetch(
      `${API_BASE_URL}/api/analytics/data?propertyId=${encodeURIComponent(propertyId)}&token=${accessToken}`,
      {
        method: 'GET',
        headers: {
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

export const fetchGoogleAnalyticsAccounts = async (): Promise<any[]> => {
  try {
    const accessToken = getStoredAccessToken();
    if (!accessToken) {
      throw new Error("Aucun token d'accès trouvé. Veuillez vous reconnecter.");
    }

    const response = await fetch(`${API_BASE_URL}/api/analytics/accounts?token=${accessToken}`);
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

export const fetchGoogleAnalyticsAccountProperties = async (accountId: string): Promise<any[]> => {
  if (!accountId) {
    throw new Error("L'identifiant du compte (accountId) est requis.");
  }

  const accessToken = getStoredAccessToken();
  if (!accessToken) {
    throw new Error("Aucun token d'accès trouvé. Veuillez vous reconnecter.");
  }

  // ✅ Forcer le bon format de l'identifiant de compte
  const formattedAccountId = accountId.startsWith("accounts/")
    ? accountId
    : `accounts/${accountId}`;

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/analytics/properties?accountId=${encodeURIComponent(formattedAccountId)}&token=${accessToken}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur API propriétés: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.properties || [];
  } catch (error) {
    console.error("Erreur lors de la récupération des propriétés GA4 par compte:", error);
    throw error;
  }
};
