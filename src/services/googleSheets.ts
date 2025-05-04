
// Define the GoogleSheetsFile interface directly in this file
export interface GoogleSheetsFile {
  id: string;
  name: string;
  url?: string;
  createdTime?: string;
  modifiedTime?: string;
}

const GOOGLE_SHEETS_API_URL = "https://sheets.googleapis.com/v4/spreadsheets";

export const getSheetsAccessTokenFromUrl = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('googleSheetsAccessToken');
};

export const getSheetsRefreshTokenFromUrl = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('refreshToken');
};

export const getStoredSheetsAccessToken = (): string | null => {
  return localStorage.getItem('googleSheetsAccessToken');
};

export const getStoredSheetsRefreshToken = (): string | null => {
  return localStorage.getItem('googleSheetsRefreshToken');
};

export const fetchGoogleSheetsFiles = async (accessToken: string): Promise<GoogleSheetsFile[]> => {
  try {
    const response = await fetch("https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet'&fields=files(id,name)", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error("Erreur lors de la récupération des fichiers Google Sheets:", response);
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data.files.map((file: any) => ({
      id: file.id,
      name: file.name,
    }));
  } catch (error: any) {
    console.error("Erreur lors de la récupération des fichiers Google Sheets:", error);
    throw new Error(error.message || "Impossible de récupérer les fichiers Google Sheets.");
  }
};

export const checkSheetsTokenValidity = async (accessToken: string): Promise<boolean> => {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=' + accessToken);
    return response.status === 200;
  } catch (error) {
    console.error("Erreur lors de la vérification du token Sheets:", error);
    return false;
  }
};
