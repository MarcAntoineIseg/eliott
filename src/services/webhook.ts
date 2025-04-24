// Type du payload envoyé à N8N via le webhook
interface WebhookPayload {
  uid: string;
  query: string;
  googleAnalytics: {
    accountId: string;
    propertyId: string;
    accessToken: string;
  };
}

// Type du contexte utilisateur, tel qu’il est reçu depuis le frontend
interface UserContext {
  accountId: string;
  propertyId: string;
  accessToken: string;
}

// Fonction qui envoie la requête de l'utilisateur à N8N
export const sendToWebhook = async (
  query: string,
  userContext: UserContext
): Promise<any> => {
  const payload: WebhookPayload = {
    uid: "anonymous", // Peut être remplacé plus tard par un vrai identifiant utilisateur
    query,
    googleAnalytics: {
      accountId: userContext.accountId,
      propertyId: userContext.propertyId,
      accessToken: userContext.accessToken,
    },
  };

  console.log("🚀 Envoi webhook avec payload :", payload); // Debug (à retirer en prod)

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
