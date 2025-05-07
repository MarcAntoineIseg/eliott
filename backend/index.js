const express = require('express');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const fetch = require('node-fetch');
const app = express();

// === ENV ===
const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;
const redirect_uri = 'https://api.askeliott.com/auth/google/callback';
const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);

// Google Sheets
const sheetsRedirectUri = 'https://api.askeliott.com/auth/google-sheets/callback';
const sheetsClient = new google.auth.OAuth2(client_id, client_secret, sheetsRedirectUri);

// Meta Ads
const metaClientId = process.env.META_CLIENT_ID;
const metaClientSecret = process.env.META_CLIENT_SECRET;
const metaRedirectUri = 'https://app.askeliott.com/auth/meta/callback';

// Google Ads
const googleAdsClientId = process.env.GOOGLE_ADS_CLIENT_ID;
const googleAdsClientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
const googleAdsRedirectUri = 'https://api.askeliott.com/auth/google-ads/callback';
const googleAdsOAuth2Client = new OAuth2Client(googleAdsClientId, googleAdsClientSecret, googleAdsRedirectUri);

// === UTILS ===
const checkTokenValidity = async (token) => {
  try {
    const res = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`);
    const data = await res.json();
    return !data.error;
  } catch (err) {
    console.error("Token check error:", err.message);
    return false;
  }
};

// === ROUTES ===

// Google Analytics OAuth
app.get('/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: true,
    scope: [
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/analytics.edit',
      'https://www.googleapis.com/auth/analytics.manage.users.readonly',
      'https://www.googleapis.com/auth/analytics',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'openid'
    ]
  });
  res.redirect(url);
});

app.get('/auth/google/callback', async (req, res) => {
  try {
    const { tokens } = await oauth2Client.getToken(req.query.code);
    const { access_token, refresh_token, expires_in } = tokens;
    res.redirect(`https://app.askeliott.com/integration?access_token=${access_token}&refresh_token=${refresh_token || ''}&expires_in=${expires_in}`);
  } catch (err) {
    console.error('Google Analytics callback error:', err.message);
    res.status(500).send('OAuth error');
  }
});

// Google Sheets OAuth
app.get('/auth/google-sheets', (req, res) => {
  const url = sheetsClient.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: true,
    scope: [
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
      'openid'
    ]
  });
  res.redirect(url);
});

app.get('/auth/google-sheets/callback', async (req, res) => {
  try {
    const { tokens } = await sheetsClient.getToken(req.query.code);
    const { access_token, refresh_token, expires_in } = tokens;
    res.redirect(`https://app.askeliott.com/integration?googleSheetsAccessToken=${access_token}&sheetsRefreshToken=${refresh_token || ''}&sheetsExpiresIn=${expires_in}`);
  } catch (err) {
    console.error("Google Sheets callback error:", err.message);
    res.status(500).send("OAuth error");
  }
});

// Meta Ads
app.get('/auth/meta', (req, res) => {
  const scope = 'ads_read,business_management,pages_read_engagement';
  const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${metaClientId}&redirect_uri=${encodeURIComponent(metaRedirectUri)}&scope=${scope}&response_type=code`;
  res.redirect(url);
});

app.get('/auth/meta/callback', async (req, res) => {
  try {
    const code = req.query.code;
    const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${metaClientId}&redirect_uri=${encodeURIComponent(metaRedirectUri)}&client_secret=${metaClientSecret}&code=${code}`);
    const { access_token } = await tokenRes.json();

    const adAccountsRes = await fetch(`https://graph.facebook.com/v19.0/me/adaccounts?access_token=${access_token}`);
    const adAccounts = await adAccountsRes.json();
    const adAccountId = adAccounts.data?.[0]?.id || '';

    res.redirect(`https://app.askeliott.com/integration?metaAccessToken=${access_token}&metaAdAccount=${adAccountId}`);
  } catch (err) {
    console.error("Meta Ads callback error:", err.message);
    res.status(500).send("OAuth error");
  }
});

// Google Ads
app.get('/auth/google-ads', (req, res) => {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleAdsClientId}&redirect_uri=${encodeURIComponent(googleAdsRedirectUri)}&response_type=code&scope=https://www.googleapis.com/auth/adwords&access_type=offline&prompt=consent`;
  res.redirect(url);
});

app.get('/auth/google-ads/callback', async (req, res) => {
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: req.query.code,
        client_id: googleAdsClientId,
        client_secret: googleAdsClientSecret,
        redirect_uri: googleAdsRedirectUri,
        grant_type: 'authorization_code'
      })
    });

    const { access_token, refresh_token, expires_in } = await tokenRes.json();
    res.redirect(`https://app.askeliott.com/integration?googleAdsAccessToken=${access_token}&adsRefreshToken=${refresh_token || ''}&adsExpiresIn=${expires_in}`);
  } catch (err) {
    console.error("Google Ads callback error:", err.message);
    res.status(500).send("OAuth error");
  }
});

// Liste des comptes Google Analytics
app.get('/api/analytics/accounts', async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).json({ error: 'Access token manquant' });

  const authClient = new google.auth.OAuth2();
  authClient.setCredentials({ access_token: token });

  try {
    const analyticsAdmin = google.analyticsadmin({ version: 'v1beta', auth: authClient });
    const response = await analyticsAdmin.accounts.list();
    const accounts = response.data.accounts || [];
    res.json({ accounts });
  } catch (err) {
    console.error("❌ Erreur récupération comptes GA:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Liste des propriétés GA4
app.get('/api/analytics/properties', async (req, res) => {
  const token = req.query.token;
  let accountId = req.query.accountId;
  if (!token) return res.status(400).json({ error: 'Access token manquant' });

  const authClient = new google.auth.OAuth2();
  authClient.setCredentials({ access_token: token });

  try {
    if (!accountId) {
      const analyticsAdmin = google.analyticsadmin({ version: 'v1beta', auth: authClient });
      const accountsResp = await analyticsAdmin.accounts.list();
      const firstAccount = accountsResp.data.accounts?.[0];
      if (!firstAccount) return res.json({ properties: [] });
      accountId = firstAccount.name;
    } else {
      accountId = decodeURIComponent(accountId);
      if (!accountId.startsWith('accounts/')) {
        accountId = `accounts/${accountId}`;
      }
    }

    const analyticsAdmin = google.analyticsadmin({ version: 'v1beta', auth: authClient });
    const response = await analyticsAdmin.properties.list({ filter: `parent:${accountId}` });
    const properties = response.data.properties || [];
    res.json({ properties });
  } catch (err) {
    console.error("❌ Erreur API GA Admin:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// === START SERVER ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend listening on port ${PORT}`);
});
