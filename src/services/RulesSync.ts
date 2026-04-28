import * as vscode from 'vscode';
import { ToolDefinition, ToolId, SyncResult } from '../types';
import { TOOLS } from './Tools';

/**
 * Converts content between AI rule file formats.
 * Most are markdown; some (cursorrules, windsurfrules) are plain text but
 * Cursor/Windsurf both accept markdown content gracefully.
 */
export class RulesSync {
  /**
   * Read a rule file's text content.
   */
  async readRuleFile(uri: vscode.Uri): Promise<string> {
    const data = await vscode.workspace.fs.readFile(uri);
    return new TextDecoder().decode(data);
  }

  /**
   * Convert rule content from one tool format to another.
   * Currently a near-passthrough since all major tools accept markdown.
   * Adds tool-specific headers/notes as appropriate.
   */
  convert(content: string, from: ToolDefinition, to: ToolDefinition): string {
    if (from.id === to.id) {
      return content;
    }
    let body = content;

    // Strip an existing source-tool header banner if present
    body = body.replace(/^<!--\s*ai-rules-manager: source=[^>]+-->\s*\n?/m, '');

    const header = `<!-- ai-rules-manager: source=${from.id} synced=${new Date().toISOString()} -->\n`;

    if (to.format === 'plain' && from.format === 'markdown') {
      // Convert markdown headings to ALL-CAPS plain text style for max compatibility
      const plain = body
        .replace(/^#{1,6}\s+(.+)$/gm, (_, title) => `\n## ${title}\n`)
        .trim();
      return header + plain + '\n';
    }
    return header + body.trim() + '\n';
  }

  /**
   * Sync a source rule file's content to one or more target tools.
   * Creates missing files using each tool's canonical filename.
   */
  async syncTo(
    sourceUri: vscode.Uri,
    sourceTool: ToolDefinition,
    targets: ToolId[],
    workspaceFolder: vscode.WorkspaceFolder,
    confirm: (target: ToolDefinition, willOverwrite: boolean) => Promise<boolean>
  ): Promise<SyncResult> {
    const content = await this.readRuleFile(sourceUri);
    const result: SyncResult = {
      source: sourceTool.id,
      targets: [],
      filesWritten: [],
      conflicts: []
    };

    for (const targetId of targets) {
      if (targetId === sourceTool.id) {
        continue;
      }
      const target = TOOLS[targetId];
      if (!target) {
        continue;
      }
      const canonicalName = target.fileNames[0];
      const targetUri = vscode.Uri.joinPath(workspaceFolder.uri, canonicalName);

      let exists = false;
      try {
        await vscode.workspace.fs.stat(targetUri);
        exists = true;
      } catch {
        exists = false;
      }

      const ok = await confirm(target, exists);
      if (!ok) {
        result.conflicts.push({ tool: target.id, reason: 'User cancelled.' });
        continue;
      }

      const converted = this.convert(content, sourceTool, target);

      // Ensure parent directory exists for nested paths like .github/copilot-instructions.md
      const parentUri = vscode.Uri.joinPath(targetUri, '..');
      try {
        await vscode.workspace.fs.createDirectory(parentUri);
      } catch {
        // ok
      }

      await vscode.workspace.fs.writeFile(targetUri, new TextEncoder().encode(converted));
      result.filesWritten.push(targetUri);
      result.targets.push(target.id);
    }

    return result;
  }
}
