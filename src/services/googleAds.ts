
export const fetchGoogleAdsCustomerInfo = async (accessToken: string) => {
  const response = await fetch(`https://googleads.googleapis.com/v13/customers:listAccessibleCustomers`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'developer-token': 'HjT2MptRQbjnrUsgckrz1A' // remplace avec ton dev token
    }
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des comptes Google Ads');
  }

  const data = await response.json();
  return data.resourceNames?.[0]; // ex: "customers/1234567890"
};
