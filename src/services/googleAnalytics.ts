
// Constants for Google Auth
export const CLIENT_ID = "438281144970-cdhaatv85oas6j6lgt21i881aj3fb51q.apps.googleusercontent.com";
export const REDIRECT_URI = window.location.origin + "/integration";
export const GOOGLE_ANALYTICS_SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/analytics"
];

export const API_BASE_URL = "https://askeliott-api.com"; // Adjust this if your API is hosted elsewhere

// Google Analytics Property Interface
export interface GoogleAnalyticsProperty {
  id: string;
  name: string;
  url?: string;
  createdAt?: string;
  accountId?: string;
}

// Function to extract access token from URL after OAuth redirect
export const getAccessTokenFromUrl = (): string | null => {
  const hash = window.location.hash;
  if (!hash) return null;
  
  const params = new URLSearchParams(hash.substring(1));
  return params.get("access_token");
};

// Function to store access token
export const setStoredAccessToken = (token: string): void => {
  localStorage.setItem("googleAccessToken", token);
};

// Function to retrieve stored access token
export const getStoredAccessToken = (): string => {
  return localStorage.getItem("googleAccessToken") || "";
};

// Check if token is valid
export const checkTokenValidity = async (accessToken: string): Promise<boolean> => {
  if (!accessToken) return false;
  
  try {
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`);
    return response.status === 200;
  } catch (error) {
    console.error("Error checking token validity:", error);
    return false;
  }
};

// Fetch Google Analytics accounts
export const fetchGoogleAnalyticsAccounts = async (): Promise<any[]> => {
  try {
    const accessToken = getStoredAccessToken();
    
    if (!accessToken) {
      throw new Error("Access token not found");
    }
    
    const url = `${API_BASE_URL}/api/analytics/accounts`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch accounts: ${response.status}`);
    }
    
    const data = await response.json();
    return data.accounts || [];
  } catch (error) {
    console.error("Error fetching Google Analytics accounts:", error);
    throw error;
  }
};

// Fetch Google Analytics properties for an account
export const fetchGoogleAnalyticsAccountProperties = async (accountId: string): Promise<GoogleAnalyticsProperty[]> => {
  try {
    const accessToken = getStoredAccessToken();
    
    if (!accessToken) {
      throw new Error("Access token not found");
    }
    
    const url = `${API_BASE_URL}/api/analytics/properties?accountId=${encodeURIComponent(accountId)}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch properties: ${response.status}`);
    }
    
    const data = await response.json();
    return (data.properties || []).map((prop: any) => ({
      id: prop.name ? prop.name.split("/").pop() : prop.id,
      name: prop.displayName || prop.name,
      url: prop.webLink,
      createdAt: prop.createTime,
      accountId: accountId
    }));
  } catch (error) {
    console.error("Error fetching Google Analytics properties:", error);
    throw error;
  }
};

// Fetch all properties across accounts
export const fetchGoogleAnalyticsProperties = async (accessToken: string): Promise<GoogleAnalyticsProperty[]> => {
  try {
    const accounts = await fetchGoogleAnalyticsAccounts();
    let allProperties: GoogleAnalyticsProperty[] = [];
    
    for (const account of accounts) {
      const accountId = account.name;
      const properties = await fetchGoogleAnalyticsAccountProperties(accountId);
      allProperties = [...allProperties, ...properties];
    }
    
    return allProperties;
  } catch (error) {
    console.error("Error fetching all Google Analytics properties:", error);
    throw error;
  }
};

// Fetch Analytics report data
export const fetchGoogleAnalyticsReport = async (accessToken: string, propertyId: string): Promise<any> => {
  try {
    if (!accessToken) {
      throw new Error("Access token not found");
    }
    
    const url = `${API_BASE_URL}/api/analytics/data?propertyId=${encodeURIComponent(propertyId)}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch analytics data: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching Google Analytics report:", error);
    throw error;
  }
};
