const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const envPath = path.join(__dirname, '..', '.env.google-drive');
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf('=');
      return [
        line.slice(0, separator),
        line.slice(separator + 1).replace(/^['"]|['"]$/g, ''),
      ];
    })
);

const auth = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);
auth.setCredentials({ refresh_token: env.GOOGLE_REFRESH_TOKEN });

const drive = google.drive({ version: 'v3', auth });
const fileId = process.argv[2];
const request = fileId
  ? drive.files.get({ fileId, fields: 'id,name,owners(emailAddress),trashed', supportsAllDrives: true })
  : drive.about.get({ fields: 'user(emailAddress),storageQuota(limit,usage)' });

request
  .then((response) => {
    console.log(JSON.stringify({
      authenticated: true,
      account: response.data.user?.emailAddress,
      quotaReadable: Boolean(response.data.storageQuota),
      file: fileId ? response.data : undefined,
    }));
  })
  .catch((error) => {
    console.error(JSON.stringify({
      authenticated: false,
      status: error.code || null,
      error: error.response?.data?.error || error.message,
    }));
    process.exit(1);
  });
