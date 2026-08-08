const { google } = require('googleapis');
const fs = require('fs');
const http = require('http');
const path = require('path');

const ENV_PATH = path.join(__dirname, '..', '.env.google-drive');
const PORT = 8080;
const REDIRECT_URI = `http://localhost:${PORT}`;

function readLocalCredentials() {
  if (!fs.existsSync(ENV_PATH)) return {};

  return Object.fromEntries(
    fs.readFileSync(ENV_PATH, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const separator = line.indexOf('=');
        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
        return [key, value];
      })
  );
}

const localCredentials = readLocalCredentials();
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || localCredentials.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || localCredentials.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET em .env.google-drive.');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/drive.file'],
  prompt: 'consent',
});

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url, REDIRECT_URI);

    if (requestUrl.pathname === '/favicon.ico') {
      res.writeHead(204);
      res.end();
      return;
    }

    const code = requestUrl.searchParams.get('code');
    if (!code) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Callback OAuth nao encontrado.');
      return;
    }

    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.refresh_token) {
      throw new Error('O Google nao retornou um refresh token.');
    }

    fs.writeFileSync(
      ENV_PATH,
      [
        `GOOGLE_CLIENT_ID="${CLIENT_ID}"`,
        `GOOGLE_CLIENT_SECRET="${CLIENT_SECRET}"`,
        `GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"`,
        '',
      ].join('\n'),
      { encoding: 'utf8', mode: 0o600 }
    );

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>Autorizacao concluida!</h1><p>O token foi salvo em .env.google-drive. Pode fechar esta aba.</p>');
    console.log('Refresh token salvo em .env.google-drive.');
    server.close(() => process.exit(0));
  } catch (error) {
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Erro ao processar o token: ${error.message}`);
    }
    console.error('Erro ao obter token:', error.message);
    server.close(() => process.exit(1));
  }
});

server.listen(PORT, () => {
  fs.writeFileSync(path.join(__dirname, 'auth-url.txt'), authUrl, 'utf8');
  console.log(`Servidor OAuth local: http://localhost:${PORT}`);
  console.log('Link salvo em scripts/auth-url.txt.');
});
