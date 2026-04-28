import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { HistoryEntry, RuleFile } from '../types';

/**
 * Tracks local change history of rule files in the workspace.
 * Stored in VS Code workspace state as a ring buffer.
 * Pro feature.
 */
export class HistoryTracker {
  private static readonly STORAGE_KEY = 'aiRulesManager.history';
  private static readonly MAX_ENTRIES = 200;

  constructor(private context: vscode.ExtensionContext) {}

  async record(file: RuleFile, content: string): Promise<HistoryEntry> {
    const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
    const entry: HistoryEntry = {
      id: `${Date.now()}-${hash.slice(0, 8)}`,
      timestamp: Date.now(),
      fileName: file.fileName,
      tool: file.tool.id,
      contentHash: hash,
      contentSnippet: content.slice(0, 500),
      bytes: content.length
    };
    const entries = this.list();
    // De-dupe consecutive identical content
    if (entries.length > 0 && entries[0].contentHash === hash) {
      return entries[0];
    }
    entries.unshift(entry);
    while (entries.length > HistoryTracker.MAX_ENTRIES) {
      entries.pop();
    }
    await this.context.workspaceState.update(HistoryTracker.STORAGE_KEY, entries);
    return entry;
  }

  list(): HistoryEntry[] {
    return this.context.workspaceState.get<HistoryEntry[]>(HistoryTracker.STORAGE_KEY, []);
  }

  filterByFile(fileName: string): HistoryEntry[] {
    return this.list().filter(e => e.fileName === fileName);
  }

  async clear() {
    await this.context.workspaceState.update(HistoryTracker.STORAGE_KEY, []);
  }
}
