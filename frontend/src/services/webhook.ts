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
  fileId?: string;
  fileName?: string;
  files?: GoogleSheetsFile[];
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
    googleAnalytics: context.googleAnalytics
      ? {
          accessToken: context.googleAnalytics.accessToken,
          refreshToken: context.googleAnalytics.refreshToken,
          accountId: context.googleAnalytics.accountId,
          propertyId: context.googleAnalytics.propertyId,
        }
      : null,
    googleSheets: context.googleSheets
      ? {
          accessToken: context.googleSheets.accessToken,
          refreshToken: context.googleSheets.refreshToken,
          fileId: context.googleSheets.fileId,
          fileName: context.googleSheets.fileName,
          files: context.googleSheets.files || [],
          fileIds: (context.googleSheets.files || []).map((f) => f.id),
        }
      : null,
    googleAds: context.googleAds
      ? {
          accessToken: context.googleAds.accessToken,
          refreshToken: context.googleAds.refreshToken,
          customerId: context.googleAds.customerId,
        }
      : null,
  };

  console.log("\u{1F680} Envoi webhook avec payload :", payload);

  const response = await fetch("https://n8n.askeliott.com/webhook-test/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("\u274C Erreur webhook :", errorText);
    throw new Error("Erreur lors de l'envoi au webhook");
  }

  const data = await response.json();
  console.log("\u2705 Réponse complète du webhook :", data);

  const rawMessage =
    data?.message ??
    data?.output?.message ??
    data?.[0]?.output?.message ??
    null;

  if (typeof rawMessage !== "string" || rawMessage.trim() === "") {
    throw new Error("Réponse du webhook invalide : aucun message trouvé.");
  }

  console.log("\u{1F4AC} Message final :", rawMessage);
  return rawMessage;
};
