
// API Base URL
export const API_BASE_URL = "https://api.askeliott.com";

// Interface pour les fichiers Google Sheets
export interface GoogleSheetsFile {
  id: string;
  name: string;
  url?: string;
  createdTime?: string;
  modifiedTime?: string;
}

// Vérifier la validité du token
export const checkSheetsTokenValidity = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/google-sheets/validate-token?token=${token}`);
    const data = await response.json();
    return data.valid === true;
  } catch (error) {
    console.error("Erreur lors de la vérification du token Sheets:", error);
    return false;
  }
};

// Récupérer les fichiers Google Sheets
export const fetchGoogleSheetsFiles = async (token: string): Promise<GoogleSheetsFile[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/google-sheets/files?token=${token}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Erreur lors de la récupération des fichiers Google Sheets");
    }
    
    return data.files || [];
  } catch (error: any) {
    console.error("Erreur lors du chargement des fichiers Google Sheets:", error);
    throw new Error(error.message || "Erreur lors de la récupération des fichiers Google Sheets");
  }
};

// Récupérer les données d'une feuille spécifique
export const fetchSheetData = async (token: string, fileId: string, sheetName?: string): Promise<any> => {
  try {
    const url = new URL(`${API_BASE_URL}/api/google-sheets/data`);
    url.searchParams.append("token", token);
    url.searchParams.append("fileId", fileId);
    if (sheetName) url.searchParams.append("sheetName", sheetName);
    
    const response = await fetch(url.toString());
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Erreur lors de la récupération des données de la feuille");
    }
    
    return data;
  } catch (error: any) {
    console.error("Erreur lors du chargement des données de la feuille:", error);
    throw new Error(error.message || "Erreur lors de la récupération des données de la feuille");
  }
};

// Extraire le token d'accès depuis l'URL
export const getSheetsAccessTokenFromUrl = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  return params.get("googleSheetsAccessToken");
};

// Récupérer le token stocké
export const getStoredSheetsAccessToken = (): string | null => {
  return localStorage.getItem("googleSheetsAccessToken");
};
