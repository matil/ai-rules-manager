import * as vscode from 'vscode';
import { RulesDetector } from '../services/RulesDetector';
import { RulesSync } from '../services/RulesSync';
import { TemplateLibrary } from '../services/TemplateLibrary';
import { LicenseManager } from '../services/LicenseManager';
import { AIGenerator } from '../services/AIGenerator';
import { StackDetector } from '../services/StackDetector';
import { HistoryTracker } from '../services/HistoryTracker';
import { CloudSync } from '../services/CloudSync';
import { RulesValidator } from '../services/RulesValidator';
import { TOOLS } from '../services/Tools';
import { ToolDefinition, ToolId } from '../types';

interface Services {
  detector: RulesDetector;
  sync: RulesSync;
  templates: TemplateLibrary;
  license: LicenseManager;
  ai: AIGenerator;
  stack: StackDetector;
  history: HistoryTracker;
  cloud: CloudSync;
  validator: RulesValidator;
}

export function registerCommands(
  context: vscode.ExtensionContext,
  s: Services
): void {
  const reg = (id: string, handler: (...args: any[]) => any) =>
    context.subscriptions.push(vscode.commands.registerCommand(id, handler));

  reg('aiRulesManager.refresh', () => s.detector.refresh());

  reg('aiRulesManager.openFile', async (uri: vscode.Uri) => {
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc);
  });

  reg('aiRulesManager.openSettings', () =>
    vscode.commands.executeCommand('workbench.action.openSettings', 'aiRulesManager')
  );

  reg('aiRulesManager.createRuleFile', async (toolId?: ToolId) => {
    const folder = await pickFolder();
    if (!folder) {
      return;
    }

    let tool: ToolDefinition | undefined = toolId ? TOOLS[toolId] : undefined;
    if (!tool) {
      const pick = await vscode.window.showQuickPick(
        Object.values(TOOLS).map(t => ({
          label: t.label,
          description: t.fileNames[0],
          detail: t.description,
          tool: t
        })),
        { placeHolder: 'Which AI tool?' }
      );
      if (!pick) {
        return;
      }
      tool = pick.tool;
    }

    const stack = await s.stack.detect(folder);
    const matching = s.templates
      .list(s.license.isPro())
      .filter(t => stack.length === 0 || t.stack.some(st => stack.includes(st) || st === 'any'));
    const items = [
      { label: '$(edit) Empty file', detail: 'Start from a blank rule file', template: null as any },
      ...matching.map(t => ({
        label: `${t.isPro && !s.license.isPro() ? '$(lock) ' : '$(symbol-file) '}${t.name}`,
        detail: t.description,
        template: t
      }))
    ];
    const pick = await vscode.window.showQuickPick(items, {
      placeHolder: 'Choose a starting point'
    });
    if (!pick) {
      return;
    }

    if (pick.template?.isPro && !s.license.isPro()) {
      await s.license.promptUpgrade('Premium templates');
      return;
    }

    const targetUri = vscode.Uri.joinPath(folder.uri, tool.fileNames[0]);
    const parentUri = vscode.Uri.joinPath(targetUri, '..');
    try {
      await vscode.workspace.fs.createDirectory(parentUri);
    } catch {
      // ok
    }

    let exists = false;
    try {
      await vscode.workspace.fs.stat(targetUri);
      exists = true;
    } catch {
      exists = false;
    }
    if (exists) {
      const overwrite = await vscode.window.showWarningMessage(
        `${tool.fileNames[0]} already exists. Overwrite?`,
        { modal: true },
        'Overwrite',
        'Open existing'
      );
      if (overwrite === 'Open existing') {
        const doc = await vscode.workspace.openTextDocument(targetUri);
        await vscode.window.showTextDocument(doc);
        return;
      }
      if (overwrite !== 'Overwrite') {
        return;
      }
    }

    const content = pick.template ? pick.template.content : `# ${tool.label} Rules\n\n`;
    await vscode.workspace.fs.writeFile(targetUri, new TextEncoder().encode(content));
    s.detector.refresh();
    const doc = await vscode.workspace.openTextDocument(targetUri);
    await vscode.window.showTextDocument(doc);
  });

  reg('aiRulesManager.syncRules', async () => {
    const files = await s.detector.detectAll();
    if (files.length === 0) {
      vscode.window.showInformationMessage('No rule files to sync. Create one first.');
      return;
    }

    const sourcePick = await vscode.window.showQuickPick(
      files.map(f => ({
        label: f.fileName,
        description: f.tool.label,
        file: f
      })),
      { placeHolder: 'Source file (the one to copy FROM)' }
    );
    if (!sourcePick) {
      return;
    }

    const targets = await vscode.window.showQuickPick(
      Object.values(TOOLS)
        .filter(t => t.id !== sourcePick.file.tool.id)
        .map(t => ({
          label: t.label,
          description: t.fileNames[0],
          tool: t
        })),
      { placeHolder: 'Target tools (TO)', canPickMany: true }
    );
    if (!targets || targets.length === 0) {
      return;
    }

    const folder = vscode.workspace.getWorkspaceFolder(sourcePick.file.uri);
    if (!folder) {
      return;
    }

    const result = await s.sync.syncTo(
      sourcePick.file.uri,
      sourcePick.file.tool,
      targets.map(t => t.tool.id),
      folder,
      async (target, willOverwrite) => {
        if (!willOverwrite) {
          return true;
        }
        const ok = await vscode.window.showWarningMessage(
          `${target.fileNames[0]} already exists. Overwrite?`,
          { modal: false },
          'Overwrite',
          'Skip'
        );
        return ok === 'Overwrite';
      }
    );

    s.detector.refresh();
    vscode.window.showInformationMessage(
      `Synced to ${result.targets.length} tool(s). ${
        result.conflicts.length ? `${result.conflicts.length} skipped.` : ''
      }`
    );
  });

  reg('aiRulesManager.insertTemplate', async (templateId?: string) => {
    let id = templateId;
    if (!id) {
      const pick = await vscode.window.showQuickPick(
        s.templates.list(true).map(t => ({
          label: `${t.isPro && !s.license.isPro() ? '$(lock) ' : ''}${t.name}`,
          description: t.stack.join(', '),
          detail: t.description,
          id: t.id
        })),
        { placeHolder: 'Pick a template' }
      );
      if (!pick) {
        return;
      }
      id = pick.id;
    }
    const tpl = s.templates.byId(id);
    if (!tpl) {
      return;
    }
    if (tpl.isPro && !s.license.isPro()) {
      await s.license.promptUpgrade('Premium templates');
      return;
    }
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      await editor.edit(eb => {
        eb.insert(editor.selection.active, tpl.content);
      });
    } else {
      // No active editor — create a CLAUDE.md with the template
      const folder = await pickFolder();
      if (!folder) {
        return;
      }
      const targetUri = vscode.Uri.joinPath(folder.uri, 'CLAUDE.md');
      await vscode.workspace.fs.writeFile(targetUri, new TextEncoder().encode(tpl.content));
      const doc = await vscode.workspace.openTextDocument(targetUri);
      await vscode.window.showTextDocument(doc);
      s.detector.refresh();
    }
  });

  reg('aiRulesManager.browseTemplates', async () => {
    await vscode.commands.executeCommand('aiRulesManager.insertTemplate');
  });

  reg('aiRulesManager.generateWithAI', async () => {
    if (!s.license.isPro()) {
      await s.license.promptUpgrade('AI rule generation');
      return;
    }
    const description = await vscode.window.showInputBox({
      prompt: 'Describe your project and what the AI should know',
      placeHolder: 'e.g. SaaS app for invoicing freelancers, Next.js + Postgres + Stripe'
    });
    if (!description) {
      return;
    }
    const folder = await pickFolder();
    if (!folder) {
      return;
    }
    const stack = await s.stack.detect(folder);
    const toolPick = await vscode.window.showQuickPick(
      Object.values(TOOLS).map(t => ({ label: t.label, id: t.id })),
      { placeHolder: 'Generate for which tool?' }
    );
    if (!toolPick) {
      return;
    }

    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: 'Generating rule file…' },
      async () => {
        try {
          const content = await s.ai.generate({
            description,
            detectedStack: stack,
            tool: TOOLS[toolPick.id as ToolId].label
          });
          const tool = TOOLS[toolPick.id as ToolId];
          const targetUri = vscode.Uri.joinPath(folder.uri, tool.fileNames[0]);
          await vscode.workspace.fs.writeFile(targetUri, new TextEncoder().encode(content));
          s.detector.refresh();
          const doc = await vscode.workspace.openTextDocument(targetUri);
          await vscode.window.showTextDocument(doc);
        } catch (err: any) {
          vscode.window.showErrorMessage(`Generation failed: ${err.message}`);
        }
      }
    );
  });

  reg('aiRulesManager.validate', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('Open a rule file to validate.');
      return;
    }
    const fileName = editor.document.uri.path.split('/').pop() || '';
    const tool = Object.values(TOOLS).find(t =>
      t.fileNames.some(f => f.split('/').pop() === fileName)
    );
    if (!tool) {
      vscode.window.showInformationMessage('Not a recognized AI rule file.');
      return;
    }
    const issues = s.validator.validate(editor.document.getText(), tool);
    if (issues.length === 0) {
      vscode.window.showInformationMessage('✓ No issues found.');
      return;
    }
    const items = issues.map(i => ({
      label: `${i.severity === 'error' ? '$(error)' : i.severity === 'warning' ? '$(warning)' : '$(info)'} ${i.message}`
    }));
    await vscode.window.showQuickPick(items, { placeHolder: `${issues.length} issue(s) found` });
  });

  reg('aiRulesManager.showHistory', async () => {
    if (!s.license.isPro()) {
      await s.license.promptUpgrade('Change history');
      return;
    }
    const entries = s.history.list();
    if (entries.length === 0) {
      vscode.window.showInformationMessage('No history yet. Edit a rule file to start tracking.');
      return;
    }
    const pick = await vscode.window.showQuickPick(
      entries.map(e => ({
        label: `$(history) ${new Date(e.timestamp).toLocaleString()}`,
        description: `${e.fileName} (${e.bytes} bytes)`,
        detail: e.contentSnippet.slice(0, 120),
        entry: e
      })),
      { placeHolder: 'Pick a snapshot to view' }
    );
    if (!pick) {
      return;
    }
    const doc = await vscode.workspace.openTextDocument({
      content: pick.entry.contentSnippet,
      language: 'markdown'
    });
    await vscode.window.showTextDocument(doc);
  });

  reg('aiRulesManager.cloudSync.push', async () => {
    if (!s.license.isPro()) {
      await s.license.promptUpgrade('Cloud sync');
      return;
    }
    try {
      const files = await s.detector.detectAll();
      const payload = await Promise.all(
        files.map(async f => ({
          path: f.fileName,
          content: await s.sync.readRuleFile(f.uri),
          modified: f.modified
        }))
      );
      await s.cloud.push(payload);
      vscode.window.showInformationMessage(`Pushed ${payload.length} file(s) to cloud.`);
    } catch (err: any) {
      vscode.window.showErrorMessage(`Push failed: ${err.message}`);
    }
  });

  reg('aiRulesManager.cloudSync.pull', async () => {
    if (!s.license.isPro()) {
      await s.license.promptUpgrade('Cloud sync');
      return;
    }
    try {
      const remote = await s.cloud.pull();
      const folder = await pickFolder();
      if (!folder) {
        return;
      }
      for (const file of remote) {
        const uri = vscode.Uri.joinPath(folder.uri, file.path);
        const parent = vscode.Uri.joinPath(uri, '..');
        try {
          await vscode.workspace.fs.createDirectory(parent);
        } catch {
          // ok
        }
        await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(file.content));
      }
      s.detector.refresh();
      vscode.window.showInformationMessage(`Pulled ${remote.length} file(s) from cloud.`);
    } catch (err: any) {
      vscode.window.showErrorMessage(`Pull failed: ${err.message}`);
    }
  });

  reg('aiRulesManager.activateLicense', async () => {
    const key = await vscode.window.showInputBox({
      prompt: 'Paste your Pro license key',
      placeHolder: 'AIRM-PRO-XXXXXXXXXXXXXXXX',
      ignoreFocusOut: true,
      password: false
    });
    if (!key) {
      return;
    }
    const status = await s.license.activate(key);
    if (status.valid) {
      vscode.window.showInformationMessage(`✓ Pro activated. Welcome to ${status.tier}.`);
    } else {
      vscode.window.showErrorMessage('Invalid license key.');
    }
  });

  // Track edits → history
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async doc => {
      if (!s.license.isPro()) {
        return;
      }
      const config = vscode.workspace.getConfiguration('aiRulesManager');
      if (!config.get<boolean>('history.enabled', true)) {
        return;
      }
      const fileName = doc.uri.path.split('/').pop() || '';
      const tool = Object.values(TOOLS).find(t =>
        t.fileNames.some(f => f.split('/').pop() === fileName)
      );
      if (!tool) {
        return;
      }
      const ruleFile = (await s.detector.detectAll()).find(
        rf => rf.uri.toString() === doc.uri.toString()
      );
      if (ruleFile) {
        await s.history.record(ruleFile, doc.getText());
      }
    })
  );
}

async function pickFolder(): Promise<vscode.WorkspaceFolder | undefined> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showErrorMessage('Open a folder/workspace first.');
    return undefined;
  }
  if (folders.length === 1) {
    return folders[0];
  }
  return vscode.window.showWorkspaceFolderPick({
    placeHolder: 'Select target workspace folder'
  });
}
