// !!! IMPORTANT FOR THE DEVELOPER !!!
// You MUST replace 'YOUR_CLIENT_ID_HERE' with a valid Client ID from the Google Cloud Console.
// 1. Go to https://console.cloud.google.com/
// 2. Create a project > APIs & Services > Credentials > Create Credentials > OAuth client ID
// 3. Application type: Web application
// 4. Add 'http://localhost:5173' (or your domain) to "Authorized JavaScript origins"
// 5. Copy the Client ID and paste it below.

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '795425147688-ml891no2k96u43jbbujhrrnmvr7plo88.apps.googleusercontent.com'; 
export const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly';
export const DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4'];

export const INITIAL_SYSTEM_INSTRUCTION = `
You are SheetMind, an expert data assistant capable of reading and manipulating Google Sheets.
You have direct access to tools that can modify the spreadsheet.

Rules:
1. Always analyze the provided sheet context before answering.
2. If the user asks to add data, look for existing headers to map values correctly.
3. If the user asks to calculate something, try to use a formula in a cell if appropriate, or calculate it yourself and answer.
4. When you perform an action (add/remove/update), briefly confirm what you did.
5. If the request is ambiguous (e.g., "delete the bad row"), ask for clarification.
6. Format your text responses nicely using Markdown.
`;