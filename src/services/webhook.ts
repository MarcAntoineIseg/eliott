
export const sendToWebhook = async (query: string) => {
  const response = await fetch("https://n8n.askeliott.com/webhook/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    throw new Error("Erreur lors de l'envoi au webhook");
  }

  return await response.json();
};
