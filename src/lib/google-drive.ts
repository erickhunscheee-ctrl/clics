import { google } from "googleapis";
import { Readable } from "stream";

function getAuth() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (clientId && clientSecret && refreshToken) {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    return oauth2Client;
  }

  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || "")
    .replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "\n");

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL!,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });
}

function getDriveClient() {
  const auth = getAuth();
  return google.drive({ version: "v3", auth });
}

/**
 * Create (or find) a folder for the album inside the main Drive folder
 */
export async function createAlbumFolder(
  albumId: string,
  albumTitle: string
): Promise<string> {
  const drive = getDriveClient();
  const folderName = `album-${albumId}`;
  const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID!;

  // Check if folder already exists
  const existing = await drive.files.list({
    q: `name='${folderName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id, name)",
    spaces: "drive",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (existing.data.files && existing.data.files.length > 0) {
    return existing.data.files[0].id!;
  }

  // Create new folder
  const folder = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
      description: `Fotos originais do álbum: ${albumTitle}`,
    },
    fields: "id",
  });

  return folder.data.id!;
}

/**
 * Upload an original photo file to Google Drive
 * Returns the Google Drive file ID
 */
export async function uploadOriginalToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  albumId: string,
  albumTitle: string
): Promise<string> {
  const drive = getDriveClient();
  const folderId = await createAlbumFolder(albumId, albumTitle);

  const stream = new Readable();
  stream.push(fileBuffer);
  stream.push(null);

  const file = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: "id",
  });

  return file.data.id!;
}

/**
 * Get a readable stream of a file from Google Drive
 */
export async function getDriveFileStream(
  fileId: string
): Promise<NodeJS.ReadableStream> {
  const drive = getDriveClient();

  const response = await drive.files.get(
    {
      fileId,
      alt: "media",
      supportsAllDrives: true,
    },
    {
      responseType: "stream",
    }
  );

  return response.data as NodeJS.ReadableStream;
}

/**
 * Get metadata of a file from Google Drive
 */
export async function getDriveFileMetadata(
  fileId: string
): Promise<{ name: string; mimeType: string; size: number }> {
  const drive = getDriveClient();

  const response = await drive.files.get({
    fileId,
    fields: "name, mimeType, size",
    supportsAllDrives: true,
  });

  return {
    name: response.data.name || "photo",
    mimeType: response.data.mimeType || "image/jpeg",
    size: parseInt(response.data.size || "0", 10),
  };
}

/**
 * Delete a file from Google Drive
 */
export async function deleteFromDrive(fileId: string): Promise<void> {
  const drive = getDriveClient();
  await drive.files.delete({
    fileId,
    supportsAllDrives: true,
  });
}
