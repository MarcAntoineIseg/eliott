interface UserContext {
  accountId: string;
  propertyId: string;
  accessToken: string;
  refreshToken: string; // 👈 On ajoute le refreshToken
}

interface WebhookPayload {
  query: string;
  googleAnalytics: {
    accountId: string;
    propertyId: string;
    accessToken: string;
    refreshToken: string; // 👈 On ajoute le refreshToken dans la requête
  };
}

export const sendToWebhook = async (
  query: string,
  userContext: UserContext
): Promise<any> => {
  const payload: WebhookPayload = {
    query,
    googleAnalytics: {
      accountId: userContext.accountId,
      propertyId: userContext.propertyId,
      accessToken: userContext.accessToken,
      refreshToken: userContext.refreshToken, // 👈 On ajoute ici aussi
    },
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