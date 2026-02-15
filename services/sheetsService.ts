import { SheetData, SheetFile } from '../types';
import { GOOGLE_CLIENT_ID } from '../constants';

// Declare types for window.gapi and window.google
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const SESSION_KEY = 'sheetmind_session';

let tokenClient: any;
let isGapiInitialized = false;

// Session Management
export const saveSession = (accessToken: string, expiresInSeconds: number) => {
  const expiryTime = Date.now() + (expiresInSeconds * 1000) - 60000; // Buffer 1 minute
  const session = { accessToken, expiryTime };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const restoreSession = (): string | null => {
  const json = localStorage.getItem(SESSION_KEY);
  if (!json) return null;
  
  try {
    const session = JSON.parse(json);
    if (Date.now() < session.expiryTime) {
      return session.accessToken;
    } else {
      clearSession(); // Expired
      return null;
    }
  } catch (e) {
    clearSession();
    return null;
  }
};

// 1. Initialize Token Client (Run this on App mount)
export const initializeGsi = () => {
  if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
    return;
  }
  
  try {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly',
      callback: '', // defined at request time
    });
  } catch (e) {
    console.error("Error initializing Token Client:", e);
  }
};

// 2. Login Trigger (Must be called directly from user click)
export const triggerGoogleLogin = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      initializeGsi();
      if (!tokenClient) {
        reject(new Error("Google Identity Services not initialized. Please refresh the page or check your ad blocker."));
        return;
      }
    }

    tokenClient.callback = (resp: any) => {
      if (resp.error) {
        reject(resp);
        return;
      }
      
      // Save session for persistence
      const expiresIn = resp.expires_in ? parseInt(resp.expires_in) : 3599;
      saveSession(resp.access_token, expiresIn);
      
      resolve(resp.access_token);
    };

    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
};

// Helper to wait for GAPI script
const waitForGapiScript = async (): Promise<void> => {
    if (window.gapi) return;
    
    let attempts = 0;
    while (!window.gapi && attempts < 20) { 
        await new Promise(r => setTimeout(r, 100));
        attempts++;
    }
    if (!window.gapi) {
        throw new Error("GAPI script failed to load. Please disable ad blockers and refresh.");
    }
};

// 3. Initialize GAPI Client for Data Access
export const ensureGapiClient = async (accessToken: string): Promise<void> => {
  // If libraries are already loaded, just update token
  if (window.gapi?.client?.sheets && window.gapi?.client?.drive) {
      window.gapi.client.setToken({ access_token: accessToken });
      return;
  }

  await waitForGapiScript();

  // Load the base client
  await new Promise<void>((resolve) => window.gapi.load('client', resolve));

  // Initialize the client structure (required before loading specific APIs)
  try {
    await window.gapi.client.init({});
  } catch (e) {
    console.warn("GAPI init warning:", e);
  }

  window.gapi.client.setToken({ access_token: accessToken });

  // Explicitly load the libraries we need
  await Promise.all([
    new Promise<void>((resolve, reject) => {
      window.gapi.client.load('sheets', 'v4', () => resolve(), (e: any) => reject(new Error(`Failed to load Sheets API: ${e?.error?.message || e}`)));
    }),
    new Promise<void>((resolve, reject) => {
      window.gapi.client.load('drive', 'v3', () => resolve(), (e: any) => reject(new Error(`Failed to load Drive API: ${e?.error?.message || e}`)));
    })
  ]);
  
  isGapiInitialized = true;
};

export const listSpreadsheets = async (): Promise<SheetFile[]> => {
  try {
    if (!window.gapi.client.drive) throw new Error("Google Drive API client not loaded.");

    const response = await window.gapi.client.drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
      fields: 'nextPageToken, files(id, name)',
      pageSize: 20,
    });
    return response.result.files || [];
  } catch (error: any) {
    console.error("Error listing files", error);
    const msg = error?.result?.error?.message || error?.message || JSON.stringify(error);
    throw new Error(msg);
  }
};

export const createSpreadsheet = async (title: string, headers?: string[], initialRows?: string[][]): Promise<SheetFile> => {
  try {
    // 1. Create the sheet
    const createResponse = await window.gapi.client.sheets.spreadsheets.create({
      properties: { title },
    });
    
    const spreadsheetId = createResponse.result.spreadsheetId;
    const newFile = {
      id: spreadsheetId,
      name: createResponse.result.properties.title,
    };

    // 2. If we have initial data (headers or rows), update the sheet immediately
    if (headers || (initialRows && initialRows.length > 0)) {
       const values = [];
       if (headers) values.push(headers);
       if (initialRows) values.push(...initialRows);
       
       if (values.length > 0) {
           await window.gapi.client.sheets.spreadsheets.values.update({
               spreadsheetId,
               range: 'Sheet1!A1',
               valueInputOption: 'USER_ENTERED',
               resource: { values }
           });
       }
    }

    return newFile;
  } catch (error) {
    console.error("Error creating spreadsheet", error);
    throw error;
  }
};

export const getSheetData = async (spreadsheetId: string, range: string = 'Sheet1!A1:Z100'): Promise<SheetData> => {
  try {
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    return response.result;
  } catch (error) {
    console.error("Error fetching sheet data", error);
    throw error;
  }
};

export const appendRow = async (spreadsheetId: string, values: any[], range: string = 'Sheet1!A1'): Promise<any> => {
  try {
    const sanitizedValues = values.map(v => 
      (typeof v === 'string' || typeof v === 'number') ? v : JSON.stringify(v)
    );

    const response = await window.gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId,
      range, 
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [sanitizedValues],
      },
    });
    return response.result;
  } catch (error) {
    console.error("Error appending row", error);
    throw error;
  }
};

// NEW: Batch append for multiple rows
export const appendMultipleRows = async (spreadsheetId: string, rows: any[][], range: string = 'Sheet1!A1'): Promise<any> => {
  try {
    const response = await window.gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId,
      range, 
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: rows,
      },
    });
    return response.result;
  } catch (error) {
    console.error("Error appending multiple rows", error);
    throw error;
  }
};

export const updateCell = async (spreadsheetId: string, range: string, value: string): Promise<any> => {
  try {
    const response = await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[value]],
      },
    });
    return response.result;
  } catch (error) {
    console.error("Error updating cell", error);
    throw error;
  }
};

export const deleteRow = async (spreadsheetId: string, sheetId: number, rowIndex: number): Promise<any> => {
  try {
    const batchUpdateRequest = {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        },
      ],
    };

    const response = await window.gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource: batchUpdateRequest,
    });
    return response.result;
  } catch (error) {
    console.error("Error deleting row", error);
    throw error;
  }
};

export const getSheetMetadata = async (spreadsheetId: string): Promise<any> => {
  try {
    const response = await window.gapi.client.sheets.spreadsheets.get({
      spreadsheetId,
    });
    return response.result;
  } catch (error) {
    console.error("Error fetching metadata", error);
    throw error;
  }
};
