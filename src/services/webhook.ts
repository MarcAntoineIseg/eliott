
interface UserContext {
  accountId: string;
  propertyId: string;
  accessToken: string;
  refreshToken: string;
}

interface WebhookPayload {
  query: string;
  googleAnalytics: UserContext;
}

export const sendToWebhook = async (
  query: string,
  userContext: UserContext
): Promise<any> => {
  const payload: WebhookPayload = {
    query,
    googleAnalytics: userContext,
  };

  console.log("🚀 Envoi webhook avec payload :", payload);

  const response = await fetch("https://n8n.askeliott.com/webhook/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Erreur webhook :", errorText);
    throw new Error("Erreur lors de l'envoi au webhook");
  }

  return await response.json();
};
