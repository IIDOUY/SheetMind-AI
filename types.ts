
export interface SheetFile {
  id: string;
  name: string;
}

export interface SheetData {
  range: string;
  majorDimension: string;
  values: string[][];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
  isThinking?: boolean;
  action?: 'view_sheet';
}

export interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

// Tool definitions for Gemini
export enum ToolName {
  ADD_ROW = 'addRow',
  DELETE_ROW = 'deleteRow',
  UPDATE_CELL = 'updateCell',
  CREATE_SHEET = 'createSheet',
}

export interface ToolCall {
  name: string;
  args: any;
}

export enum ConnectionStatus {
  DISCONNECTED,
  INITIALIZING,
  CONNECTED,
  ERROR
}
