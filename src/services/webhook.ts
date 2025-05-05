
interface GoogleAnalyticsContext {
  accountId: string;
  propertyId: string;
  accessToken: string;
  refreshToken: string;
}

interface GoogleSheetsFile {
  id: string;
  name: string;
  url?: string;
  createdTime?: string;
  modifiedTime?: string;
}

interface GoogleSheetsContext {
  accessToken: string;
  refreshToken: string;
  files: GoogleSheetsFile[];
  fileIds?: string[]; // New field to store individual file IDs
}

interface WebhookPayload {
  query: string;
  googleAnalytics?: GoogleAnalyticsContext | null;
  googleSheets?: GoogleSheetsContext | null;
}

export const sendToWebhook = async (
  query: string,
  context: {
    googleAnalytics: GoogleAnalyticsContext | null;
    googleSheets: {
      accessToken: string;
      refreshToken: string;
      files: GoogleSheetsFile[];
      fileIds?: string[]; // New field
    } | null;
  }
): Promise<any> => {
  const payload: WebhookPayload = {
    query,
    googleAnalytics: context.googleAnalytics,
    googleSheets: context.googleSheets,
  };

  console.log("🚀 Envoi webhook avec payload :", payload);

  const response = await fetch("https://n8n.askeliott.com/webhook/ask", {
    method: "POST",
    mode: "cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Erreur webhook :", errorText);
    throw new Error("Erreur lors de l'envoi au webhook");
  }

  return await response.json();
};
