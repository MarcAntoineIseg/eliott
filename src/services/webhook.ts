interface WebhookPayload {
  uid: string;
  query: string;
  googleAnalytics: {
    accountId: string;
    propertyId: string;
    accessToken: string;
  };
}

export const sendToWebhook = async (
  query: string,
  userContext: {
    uid: string;
    accountId: string;
    propertyId: string;
    accessToken: string;
  }
) => {
  const payload: WebhookPayload = {
    uid: userContext.uid,
    query,
    googleAnalytics: {
      accountId: userContext.accountId,
      propertyId: userContext.propertyId,
      accessToken: userContext.accessToken
    }
  };

  const response = await fetch("https://n8n.askeliott.com/webhook/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Erreur lors de l'envoi au webhook");
  }

  return await response.json();
};
