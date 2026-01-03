
/**
 * Servicio para manejar la sincronización con Google Drive
 * Nota: En un entorno real, CLIENT_ID debe ser configurado en Google Cloud Console.
 */

const CLIENT_ID = 'TU_CLIENT_ID_DE_GOOGLE.apps.googleusercontent.com'; // Placeholder
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';

let tokenClient: any = null;
let accessToken: string | null = null;

export const initGoogleAuth = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !(window as any).google) return resolve(false);
    
    tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (tokenResponse: any) => {
        if (tokenResponse.error !== undefined) {
          console.error(tokenResponse);
          return resolve(false);
        }
        accessToken = tokenResponse.access_token;
        resolve(true);
      },
    });
    resolve(true);
  });
};

export const signInToGoogle = () => {
  if (tokenClient) {
    tokenClient.requestAccessToken({ prompt: 'consent' });
  }
};

export const uploadToDrive = async (data: any) => {
  if (!accessToken) return null;

  try {
    const filename = 'frutasmart_backup.json';
    const metadata = {
      name: filename,
      mimeType: 'application/json',
      parents: ['appDataFolder'],
    };

    // Primero buscamos si ya existe para actualizarlo
    const listResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${filename}'&spaces=appDataFolder`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const listData = await listResponse.json();
    const existingFile = listData.files && listData.files.length > 0 ? listData.files[0] : null;

    const boundary = 'foo_bar_baz';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const body =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(data) +
      closeDelimiter;

    const url = existingFile 
      ? `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`
      : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

    const response = await fetch(url, {
      method: existingFile ? 'PATCH' : 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: body,
    });

    return await response.json();
  } catch (error) {
    console.error('Error subiendo a Drive:', error);
    return null;
  }
};

export const downloadFromDrive = async () => {
  if (!accessToken) return null;

  try {
    const filename = 'frutasmart_backup.json';
    const listResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${filename}'&spaces=appDataFolder`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const listData = await listResponse.json();
    if (!listData.files || listData.files.length === 0) return null;

    const fileId = listData.files[0].id;
    const contentResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return await contentResponse.json();
  } catch (error) {
    console.error('Error descargando de Drive:', error);
    return null;
  }
};

export const sendBackupByEmail = (data: any) => {
  const jsonStr = JSON.stringify(data, null, 2);
  const subject = encodeURIComponent("Respaldo de FrutaSmart - " + new Date().toLocaleDateString());
  const body = encodeURIComponent(
    "Hola,\n\nEste es un respaldo manual de los datos de tu frutería.\n\nPuedes copiar el código de abajo y pegarlo en la sección de 'Importar' en la app para recuperar tus datos.\n\nCÓDIGO DE RESPALDO:\n\n" + 
    btoa(jsonStr) + 
    "\n\nAtentamente,\nFrutaSmart AI"
  );
  window.open(`mailto:?subject=${subject}&body=${body}`);
};
