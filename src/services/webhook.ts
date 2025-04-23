
export const sendToWebhook = async (userQuery: string) => {
  try {
    const response = await fetch("https://n8n.askeliott.com/webhook/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: userQuery,
        timestamp: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      throw new Error("Erreur lors de l'envoi au webhook");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Erreur Webhook:", error);
    throw error;
  }
};
