const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const { exec } = require('child_process');

// Configure these three variables with your credentials
const CLIENT_ID = 'xxxxx';
const CLIENT_SECRET = 'xxxxx';
const PORT = 8080;
const REDIRECT_URI = `http://localhost:${PORT}`;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.log('\n❌ ERRO: Abra o arquivo scripts/generate-token.js e preencha as variáveis CLIENT_ID e CLIENT_SECRET com os valores obtidos do Google Cloud Console.\n');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// We need full drive access or drive.file access
const scopes = [
  'https://www.googleapis.com/auth/drive.file'
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // Request refresh token
  scope: scopes,
  prompt: 'consent' // Force to get refresh token every time during testing
});

const server = http.createServer(async (req, res) => {
  try {
    const parsedUrl = url.parse(req.url, true);
    if (parsedUrl.query.code) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>Autorização concluída!</h1><p>Você pode fechar esta aba e voltar ao terminal para ver seu Refresh Token.</p>');

      const { tokens } = await oauth2Client.getToken(parsedUrl.query.code);
      console.log('\n======================================================');
      console.log('✅ LOGIN EFETUADO COM SUCESSO!\n');
      console.log('Copie e adicione as seguintes variáveis no seu arquivo .env:\n');
      console.log(`GOOGLE_CLIENT_ID="${CLIENT_ID}"`);
      console.log(`GOOGLE_CLIENT_SECRET="${CLIENT_SECRET}"`);
      console.log(`GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"`);
      console.log('======================================================\n');

      server.close(() => {
        process.exit(0);
      });
    }
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Erro ao processar o token.');
    console.error('Erro ao obter token:', e.message);
    process.exit(1);
  }
}).listen(PORT, () => {
  const fs = require('fs');
  const path = require('path');
  const filePath = path.join(__dirname, 'auth-url.txt');

  fs.writeFileSync(filePath, authUrl, 'utf8');

  console.log(`\n🌐 Servidor local rodando em http://localhost:${PORT}`);
  console.log('\n======================================================');
  console.log('✅ LINK DE AUTENTICAÇÃO SALVO COM SUCESSO!');
  console.log('======================================================');
  console.log(`\nAbra o arquivo abaixo para copiar o link sem quebras:`);
  console.log(`scripts/auth-url.txt`);
  console.log('\n======================================================\n');
});
