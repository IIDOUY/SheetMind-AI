import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { SheetData } from '../types';

// Define Tools
const addRowTool: FunctionDeclaration = {
  name: 'addRow',
  description: 'Appends a new row of data to the spreadsheet. The values array should match the column order.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      values: {
        type: Type.ARRAY,
        description: 'Array of strings representing the cell values for the new row.',
        items: { type: Type.STRING },
      },
    },
    required: ['values'],
  },
};

const updateCellTool: FunctionDeclaration = {
  name: 'updateCell',
  description: 'Updates a specific cell with a new value. Uses A1 notation (e.g., "B2").',
  parameters: {
    type: Type.OBJECT,
    properties: {
      cell: {
        type: Type.STRING,
        description: 'The cell reference in A1 notation (e.g., "A5", "C10").',
      },
      value: {
        type: Type.STRING,
        description: 'The new value to write into the cell.',
      },
    },
    required: ['cell', 'value'],
  },
};

const deleteRowTool: FunctionDeclaration = {
  name: 'deleteRow',
  description: 'Deletes a specific row by its index (0-based, relative to the sheet data provided).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      rowIndex: {
        type: Type.INTEGER,
        description: 'The 0-based index of the row to delete.',
      },
    },
    required: ['rowIndex'],
  },
};

const createSheetTool: FunctionDeclaration = {
  name: 'createSheet',
  description: 'Creates a new Google Spreadsheet with the given title.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: 'The title of the new spreadsheet.',
      },
    },
    required: ['title'],
  },
};

const tools: Tool[] = [{
  functionDeclarations: [addRowTool, updateCellTool, deleteRowTool, createSheetTool]
}];

export const sendMessageToGemini = async (
  message: string,
  sheetData: SheetData | null,
  history: any[],
  apiKey: string
): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  // Construct context from sheet data
  let contextString = "Current Spreadsheet Context:\n";
  if (sheetData && sheetData.values) {
    // Optimization: Limit to 25 rows to speed up processing and reduce token usage
    const headers = sheetData.values[0] || [];
    const rows = sheetData.values.slice(0, 25); 
    
    contextString += `Headers: ${JSON.stringify(headers)}\n`;
    contextString += `Data (First ${rows.length} rows): ${JSON.stringify(rows)}\n`;
  } else {
    contextString += "No sheet data currently loaded.\n";
  }

  // Optimization: Limit history to last 10 turns
  const recentHistory = history.slice(-10);

  // Retry Strategy: 
  // 1. Try Flash (fastest)
  // 2. Wait 2s and Try Flash again (handle spikes)
  // 3. Fallback to Pro (more capacity/different quota)
  const attempts = [
    { model: 'gemini-3-flash-preview', delay: 0 },
    { model: 'gemini-3-flash-preview', delay: 2000 },
    { model: 'gemini-3-pro-preview', delay: 0 }
  ];

  let lastError = null;

  for (const attempt of attempts) {
    // Add delay for retries
    if (attempt.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, attempt.delay));
    }

    try {
      const chat = ai.chats.create({
        model: attempt.model,
        history: [
          ...recentHistory,
          {
            role: 'user',
            parts: [{ text: contextString }] 
          }
        ],
        config: {
          tools: tools,
          // Optimization: Concise system instructions
          systemInstruction: "You are a high-speed data assistant. Your goal is to execute user commands on Google Sheets immediately. \n1. If the user wants to edit data, CALL THE TOOL DIRECTLY. Do not ask for confirmation unless critical.\n2. Be extremely concise in text responses. \n3. Use Markdown.",
        },
      });

      const result = await chat.sendMessage({ message: message });
      return result;

    } catch (error: any) {
      // Check for Capacity (503) or Rate Limit (429) errors
      const errorMessage = error.toString();
      const isTransient = errorMessage.includes('503') || errorMessage.includes('429') || errorMessage.includes('High demand');

      if (isTransient) {
         console.warn(`Model ${attempt.model} failed with transient error. Retrying...`, error);
         lastError = error;
         continue; // Move to next attempt
      }
      
      // If it's a hard error (e.g. invalid key), throw immediately
      throw error;
    }
  }

  // If all attempts failed
  throw lastError || new Error("Unable to connect to AI service after multiple attempts.");
};
