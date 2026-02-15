import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { SheetData } from '../types';

// Define Tools
const addRowTool: FunctionDeclaration = {
  name: 'addRow',
  description: 'Appends a single row of data to the spreadsheet. Good for adding one entry.',
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

const addMultipleRowsTool: FunctionDeclaration = {
  name: 'addMultipleRows',
  description: 'Appends multiple rows of data at once. Use this for populating tables, creating lists, or bulk updates.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      rows: {
        type: Type.ARRAY,
        description: 'A list of rows, where each row is an array of strings.',
        items: { 
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
      },
    },
    required: ['rows'],
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
  description: 'Creates a new Google Spreadsheet. Can optionally populate it with headers and initial data immediately.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: 'The title of the new spreadsheet.',
      },
      headers: {
        type: Type.ARRAY,
        description: 'Optional: Array of strings for the first row (headers).',
        items: { type: Type.STRING }
      },
      initialRows: {
        type: Type.ARRAY,
        description: 'Optional: Initial data rows to populate the sheet with immediately after creation.',
        items: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
      }
    },
    required: ['title'],
  },
};

const tools: Tool[] = [{
  functionDeclarations: [addRowTool, addMultipleRowsTool, updateCellTool, deleteRowTool, createSheetTool]
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

  // Retry Strategy
  const attempts = [
    { model: 'gemini-3-flash-preview', delay: 0 },
    { model: 'gemini-3-flash-preview', delay: 2000 },
    { model: 'gemini-3-pro-preview', delay: 0 }
  ];

  let lastError = null;

  for (const attempt of attempts) {
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
          // Updated Instructions: Explicitly guide the AI to use bulk tools for generation tasks
          systemInstruction: `You are a high-performance Google Sheets assistant.
Rules:
1. When asked to "generate", "create a tracker", or "build a schedule", ALWAYS use 'createSheet' with the 'headers' and 'initialRows' parameters populated. Do NOT just create a blank sheet.
2. If adding multiple rows of data to an existing sheet, use 'addMultipleRows' instead of calling 'addRow' many times.
3. Be concise.
4. Use Markdown.
5. If the user mentions specific dates (e.g., Ramadan), calculate them or estimate them to the best of your ability and fill the rows.`,
        },
      });

      const result = await chat.sendMessage({ message: message });
      return result;

    } catch (error: any) {
      const errorMessage = error.toString();
      const isTransient = errorMessage.includes('503') || errorMessage.includes('429') || errorMessage.includes('High demand');

      if (isTransient) {
         console.warn(`Model ${attempt.model} failed with transient error. Retrying...`, error);
         lastError = error;
         continue; 
      }
      throw error;
    }
  }

  throw lastError || new Error("Unable to connect to AI service after multiple attempts.");
};
