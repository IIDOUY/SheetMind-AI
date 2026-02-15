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
  // Initialize Gemini Client with the provided API Key
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

  // Use the flash preview model for speed
  const modelName = 'gemini-3-flash-preview';

  try {
    // Optimization: Limit history to last 10 turns to maintain context without bloating input
    const recentHistory = history.slice(-10);

    const chat = ai.chats.create({
      model: modelName,
      history: [
        ...recentHistory,
        {
          role: 'user',
          parts: [{ text: contextString }] // Inject context fresh
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
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};