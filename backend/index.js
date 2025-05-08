// index.js

const express = require('express');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const fetch = require('node-fetch');
const app = express();
const cors = require('cors');

app.use(cors({
  origin: 'https://app.askeliott.com',
  credentials: true
}));

// === ENV & SANITIZE ===
const rawClientId     = process.env.GOOGLE_CLIENT_ID     || '';
const rawClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

// Debug char codes to catch hidden chars
console.log(
  '🧩 Char codes rawClientId     :',
  rawClientId.split('').map(c => c.charCodeAt(0))
);
console.log(
  '🧩 Char codes rawClientSecret :',
  rawClientSecret.split('').map(c => c.charCodeAt(0))
);

// Keep only alphanumerics, underscore, dot, dash
const client_id     = rawClientId.replace(/[^\w\.-]/g, '');
const client_secret = rawClientSecret.replace(/[^\w\.-]/g, '');

console.log(`🧹 Client ID sanitized     : [${client_id}] (length: ${client_id.length})`);
console.log(`🧹 Client Secret sanitized : (length: ${client_secret.length})`);

// === OAuth2 Clients ===
const redirectUriGA    = 'https://api.askeliott.com/auth/google/callback';
const oauth2ClientGA   = new google.auth.OAuth2(client_id, client_secret, redirectUriGA);

const redirectUriSheets  = 'https://api.askeliott.com/auth/google-sheets/callback';
const oauth2ClientSheets = new google.auth.OAuth2(client_id, client_secret, redirectUriSheets);

const metaClientId     = process.env.META_CLIENT_ID;
const metaClientSecret = process.env.META_CLIENT_SECRET;
const redirectUriMeta  = 'https://app.askeliott.com/auth/meta/callback';

const adsClientId       = process.env.GOOGLE_ADS_CLIENT_ID;
const adsClientSecret   = process.env.GOOGLE_ADS_CLIENT_SECRET;
const redirectUriAds    = 'https://api.askeliott.com/auth/google-ads/callback';
const oauth2ClientAds   = new OAuth2Client(adsClientId, adsClientSecret, redirectUriAds);

// === UTILITIES ===
const checkTokenValidity = async token => {
  try {
    const res = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`);
    const data = await res.json();
    return !data.error;
  } catch (err) {
    console.error('Token check error:', err.message);
    return false;
  }
};

// === ROUTES ===

// -- Google Analytics ---
app.get('/auth/google', (req, res) => {
  const url = oauth2ClientGA.generateAuthUrl({
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
  console.log('🔗 GA auth URL:', url);
  res.redirect(url);
});

app.get('/auth/google/callback', async (req, res) => {
  try {
    console.log('🌍 GA Redirect URI:', redirectUriGA);
    console.log('🆔 GA Client ID      :', client_id);
    const { tokens } = await oauth2ClientGA.getToken(req.query.code);
    console.log('🔐 GA tokens:', tokens);
    if (tokens.refresh_token) {
      console.log('✅ GA refresh_token received');
    } else {
      console.log('❌ GA no refresh_token');
    }
    const { access_token, refresh_token, expires_in } = tokens;
    res.redirect(
      `https://app.askeliott.com/auth/callback?access_token=${access_token}` +
      `&refresh_token=${refresh_token || ''}&expires_in=${expires_in}`
    );
  } catch (err) {
    console.error('GA callback error:', err.message);
    res.status(500).send('OAuth error');
  }
});

// -- Google Sheets ---
app.get('/auth/google-sheets', (req, res) => {
  const url = oauth2ClientSheets.generateAuthUrl({
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
  console.log('🔗 Sheets auth URL:', url);
  res.redirect(url);
});

app.get('/auth/google-sheets/callback', async (req, res) => {
  try {
    const { tokens } = await oauth2ClientSheets.getToken(req.query.code);
    console.log('🔐 Sheets tokens:', tokens);
    const { access_token, refresh_token, expires_in } = tokens;
    res.redirect(
      `https://app.askeliott.com/auth/callback?googleSheetsAccessToken=${access_token}` +
      `&sheetsRefreshToken=${refresh_token || ''}&sheetsExpiresIn=${expires_in}`
    );
  } catch (err) {
    console.error('Sheets callback error:', err.message);
    res.status(500).send('OAuth error');
  }
});

// -- Meta Ads ---
app.get('/auth/meta', (req, res) => {
  const scope = 'ads_read,business_management,pages_read_engagement';
  const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${metaClientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUriMeta)}` +
    `&scope=${scope}&response_type=code`;
  res.redirect(url);
});

app.get('/auth/meta/callback', async (req, res) => {
  try {
    const code = req.query.code;
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token` +
      `?client_id=${metaClientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUriMeta)}` +
      `&client_secret=${metaClientSecret}` +
      `&code=${code}`
    );
    const { access_token } = await tokenRes.json();
    const adAccRes = await fetch(`https://graph.facebook.com/v19.0/me/adaccounts?access_token=${access_token}`);
    const adAcc = await adAccRes.json();
    const adAccountId = adAcc.data?.[0]?.id || '';
    res.redirect(`https://app.askeliott.com/authcallback?metaAccessToken=${access_token}&metaAdAccount=${adAccountId}`);
  } catch (err) {
    console.error('Meta callback error:', err.message);
    res.status(500).send('OAuth error');
  }
});

// -- Google Ads ---
app.get('/auth/google-ads', (req, res) => {
  const url =
    `https://accounts.google.com/o/oauth2/v2/auth?client_id=${adsClientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUriAds)}` +
    `&response_type=code&scope=https://www.googleapis.com/auth/adwords` +
    `&access_type=offline&prompt=consent`;
  res.redirect(url);
});

app.get('/auth/google-ads/callback', async (req, res) => {
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: req.query.code,
        client_id: adsClientId,
        client_secret: adsClientSecret,
        redirect_uri: redirectUriAds,
        grant_type: 'authorization_code'
      })
    });
    const { access_token, refresh_token, expires_in } = await tokenRes.json();
    res.redirect(
      `https://app.askeliott.com/authcallback?googleAdsAccessToken=${access_token}` +
      `&adsRefreshToken=${refresh_token || ''}&adsExpiresIn=${expires_in}`
    );
  } catch (err) {
    console.error('Ads callback error:', err.message);
    res.status(500).send('OAuth error');
  }
});

// === GA ACCOUNT & PROPERTIES API ===
app.get('/api/analytics/accounts', async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).json({ error: 'Access token manquant' });
  const client = new google.auth.OAuth2();
  client.setCredentials({ access_token: token });
  try {
    const admin = google.analyticsadmin({ version: 'v1beta', auth: client });
    const { data } = await admin.accounts.list();
    res.json({ accounts: data.accounts || [] });
  } catch (err) {
    console.error('❌ GA accounts error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics/properties', async (req, res) => {
  const token = req.query.token;
  let accountId = req.query.accountId;
  if (!token) return res.status(400).json({ error: 'Access token manquant' });
  const client = new google.auth.OAuth2();
  client.setCredentials({ access_token: token });
  try {
    const admin = google.analyticsadmin({ version: 'v1beta', auth: client });
    if (!accountId) {
      const { data } = await admin.accounts.list();
      accountId = data.accounts?.[0]?.name || '';
    } else {
      accountId = decodeURIComponent(accountId);
      if (!accountId.startsWith('accounts/')) accountId = `accounts/${accountId}`;
    }
    const { data } = await admin.properties.list({ filter: `parent:${accountId}` });
    res.json({ properties: data.properties || [] });
  } catch (err) {
    console.error('❌ GA properties error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// === START SERVER ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend listening on port ${PORT}`);
});
