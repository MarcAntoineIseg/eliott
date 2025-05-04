interface UserContext {
  accountId: string;
  propertyId: string;
  accessToken: string;
  refreshToken?: string; // optionnel
}

interface WebhookPayload {
  query: string;
  googleAnalytics?: UserContext;
  googleSheets?: UserContext;
  // D’autres sources peuvent être ajoutées ici
}

/**
 * Envoie une requête utilisateur à un webhook N8N.
 *
 * @param query - Question posée par l'utilisateur.
 * @param userContext - Contexte utilisateur contenant tokens + IDs.
 * @param webhookUrl - URL du webhook N8N (optionnelle, fallback sur GA).
 */
export const sendToWebhook = async (
  query: string,
  userContext: UserContext,
  webhookUrl: string = "https://n8n.askeliott.com/webhook/ask"
): Promise<any> => {
  const sourceKey =
    userContext.accountId === "sheets" ? "googleSheets" : "googleAnalytics";

  const payload: WebhookPayload = {
    query,
    [sourceKey]: userContext,
  };

  if (process.env.NODE_ENV !== "production") {
    console.log("🚀 Envoi webhook avec payload :", payload);
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erreur webhook :", errorText);
      throw new Error(`Erreur webhook : ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Exception lors de l'envoi au webhook :", error);
    throw new Error("Échec de la requête vers le webhook");
  }
};
