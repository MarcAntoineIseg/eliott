
// API Base URL
export const API_BASE_URL = "https://api.askeliott.com";

// Interface pour les comptes Google Ads
export interface GoogleAdsAccount {
  id: string;
  name?: string;
  customerId?: string;
}

// Vérifier la validité du token
export const checkAdsTokenValidity = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/google-ads/validate-token?token=${token}`);
    const data = await response.json();
    return data.valid === true;
  } catch (error) {
    console.error("Erreur lors de la vérification du token Google Ads:", error);
    return false;
  }
};

// Récupérer les comptes Google Ads
export const fetchGoogleAdsAccounts = async (token: string): Promise<GoogleAdsAccount[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/google-ads/accounts?token=${token}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Erreur lors de la récupération des comptes Google Ads");
    }
    
    // Transformer les customerIds en objets plus détaillés
    if (data.customerIds && Array.isArray(data.customerIds)) {
      return data.customerIds.map((customerId: string) => ({
        id: customerId,
        name: `Compte ${customerId.split('/')[1] || customerId}`,
        customerId: customerId
      }));
    }
    
    return [];
  } catch (error: any) {
    console.error("Erreur lors du chargement des comptes Google Ads:", error);
    throw new Error(error.message || "Erreur lors de la récupération des comptes Google Ads");
  }
};

// Extraire le token d'accès depuis l'URL
export const getAdsAccessTokenFromUrl = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  return params.get("googleAdsAccessToken");
};

// Récupérer le token stocké
export const getStoredAdsAccessToken = (): string | null => {
  return localStorage.getItem("googleAdsAccessToken");
};

// Récupérer les informations d'un compte Google Ads spécifique
export const fetchGoogleAdsCustomerInfo = async (accessToken: string) => {
  const response = await fetch(`https://googleads.googleapis.com/v13/customers:listAccessibleCustomers`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'developer-token': 'HjT2MptRQbjnrUsgckrz1A'
    }
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des comptes Google Ads');
  }

  const data = await response.json();
  return data.resourceNames?.[0]; // ex: "customers/1234567890"
};
