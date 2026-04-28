import * as vscode from 'vscode';
import * as path from 'path';
import { RuleFile, ToolDefinition } from '../types';
import { TOOLS, toolForFileName } from './Tools';

export class RulesDetector {
  private cache: Map<string, RuleFile[]> = new Map();
  private _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChange = this._onDidChange.event;

  private watcher?: vscode.FileSystemWatcher;

  constructor(private context: vscode.ExtensionContext) {
    this.startWatching();
  }

  private startWatching() {
    if (!vscode.workspace.workspaceFolders) {
      return;
    }
    // Watch a broad pattern for all known rule files.
    this.watcher = vscode.workspace.createFileSystemWatcher(
      '**/{CLAUDE.md,AGENTS.md,.cursorrules,.windsurfrules,.clinerules,CONVENTIONS.md,.aider.conf.yml,.github/copilot-instructions.md,.cursor/rules.md,.windsurf/rules.md,.claude/CLAUDE.md}'
    );
    this.watcher.onDidCreate(() => this.invalidate());
    this.watcher.onDidDelete(() => this.invalidate());
    this.watcher.onDidChange(() => this.invalidate());
    this.context.subscriptions.push(this.watcher);
  }

  private invalidate() {
    this.cache.clear();
    this._onDidChange.fire();
  }

  async detectAll(): Promise<RuleFile[]> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      return [];
    }
    const results: RuleFile[] = [];
    for (const folder of folders) {
      const inFolder = await this.detectInFolder(folder);
      results.push(...inFolder);
    }
    return results;
  }

  async detectInFolder(folder: vscode.WorkspaceFolder): Promise<RuleFile[]> {
    const key = folder.uri.toString();
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    const found: RuleFile[] = [];
    for (const tool of Object.values(TOOLS)) {
      for (let i = 0; i < tool.fileNames.length; i++) {
        const fileName = tool.fileNames[i];
        const fileUri = vscode.Uri.joinPath(folder.uri, fileName);
        try {
          const stat = await vscode.workspace.fs.stat(fileUri);
          if (stat.type === vscode.FileType.File) {
            found.push({
              uri: fileUri,
              tool,
              fileName,
              isCanonical: i === 0,
              size: stat.size,
              modified: stat.mtime
            });
          }
        } catch {
          // not present
        }
      }
    }
    this.cache.set(key, found);
    return found;
  }

  /**
   * Get all unique tools that have a rule file present.
   */
  async detectedTools(): Promise<ToolDefinition[]> {
    const files = await this.detectAll();
    const seen = new Set<string>();
    const tools: ToolDefinition[] = [];
    for (const f of files) {
      if (!seen.has(f.tool.id)) {
        seen.add(f.tool.id);
        tools.push(f.tool);
      }
    }
    return tools;
  }

  /**
   * Get tools that DON'T have a rule file yet (for "create" suggestions).
   */
  async missingTools(): Promise<ToolDefinition[]> {
    const present = new Set((await this.detectedTools()).map(t => t.id));
    return Object.values(TOOLS).filter(t => !present.has(t.id));
  }

  refresh() {
    this.invalidate();
  }
}
