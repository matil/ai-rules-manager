import * as vscode from 'vscode';

export type ToolId =
  | 'claude'
  | 'cursor'
  | 'windsurf'
  | 'copilot'
  | 'agents'
  | 'aider'
  | 'cline'
  | 'continue';

export interface ToolDefinition {
  id: ToolId;
  label: string;
  fileNames: string[]; // Possible filenames; first is canonical
  description: string;
  url: string;
  format: 'markdown' | 'plain';
  scope: 'project' | 'global' | 'both';
}

export interface RuleFile {
  uri: vscode.Uri;
  tool: ToolDefinition;
  fileName: string;
  isCanonical: boolean;
  size: number;
  modified: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  stack: string[];
  tools: ToolId[];
  isPro: boolean;
  content: string;
  tags: string[];
}

export interface LicenseStatus {
  valid: boolean;
  tier: 'free' | 'pro' | 'team';
  email?: string;
  expiresAt?: number;
  features: string[];
}

export interface SyncResult {
  source: ToolId;
  targets: ToolId[];
  filesWritten: vscode.Uri[];
  conflicts: { tool: ToolId; reason: string }[];
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  fileName: string;
  tool: ToolId;
  contentHash: string;
  contentSnippet: string;
  bytes: number;
}
