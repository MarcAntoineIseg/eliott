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
  fileIds?: string[];
}

interface GoogleAdsContext {
  accessToken: string;
  refreshToken: string;
  customerId: string;
}

interface WebhookPayload {
  query: string;
  googleAnalytics?: GoogleAnalyticsContext | null;
  googleSheets?: GoogleSheetsContext | null;
  googleAds?: GoogleAdsContext | null;
}

export const sendToWebhook = async (
  query: string,
  context: {
    googleAnalytics: GoogleAnalyticsContext | null;
    googleSheets: GoogleSheetsContext | null;
    googleAds?: GoogleAdsContext | null;
  }
): Promise<string> => {
  const payload: WebhookPayload = {
    query,
    googleAnalytics: context.googleAnalytics,
    googleSheets: context.googleSheets,
    googleAds: context.googleAds,
  };

  console.log("🚀 Envoi webhook avec payload :", payload);

  const response = await fetch("https://n8n.askeliott.com/webhook/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Erreur webhook :", errorText);
    throw new Error("Erreur lors de l'envoi au webhook");
  }

  const data = await response.json();
  console.log("✅ Réponse complète du webhook :", data);

  // ✅ Extraction robuste du message
  const rawMessage =
    data?.message ??
    data?.output?.message ??
    data?.[0]?.output?.message ??
    null;

  if (typeof rawMessage !== "string") {
    throw new Error("Réponse du webhook invalide : aucun message trouvé.");
  }

  console.log("💬 Message final :", rawMessage);
  return rawMessage;
};
