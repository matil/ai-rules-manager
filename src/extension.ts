import * as vscode from 'vscode';
import { RulesDetector } from './services/RulesDetector';
import { RulesSync } from './services/RulesSync';
import { TemplateLibrary } from './services/TemplateLibrary';
import { LicenseManager } from './services/LicenseManager';
import { AIGenerator } from './services/AIGenerator';
import { StackDetector } from './services/StackDetector';
import { HistoryTracker } from './services/HistoryTracker';
import { CloudSync } from './services/CloudSync';
import { RulesValidator } from './services/RulesValidator';
import { RulesTreeProvider } from './providers/RulesTreeProvider';
import { TemplatesTreeProvider } from './providers/TemplatesTreeProvider';
import { registerCommands } from './commands';

export function activate(context: vscode.ExtensionContext): void {
  const detector = new RulesDetector(context);
  const sync = new RulesSync();
  const templates = new TemplateLibrary();
  const license = new LicenseManager(context);
  const ai = new AIGenerator();
  const stack = new StackDetector();
  const history = new HistoryTracker(context);
  const cloud = new CloudSync(() => {
    const config = vscode.workspace.getConfiguration('aiRulesManager');
    return config.get<string>('licenseKey', '');
  });
  const validator = new RulesValidator();

  const rulesTree = new RulesTreeProvider(detector, license);
  const templatesTree = new TemplatesTreeProvider(templates, license);

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('aiRulesManager.filesView', rulesTree),
    vscode.window.registerTreeDataProvider('aiRulesManager.templatesView', templatesTree)
  );

  registerCommands(context, {
    detector,
    sync,
    templates,
    license,
    ai,
    stack,
    history,
    cloud,
    validator
  });

  // Status bar item showing license tier + quick action
  const statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 90);
  const updateStatus = () => {
    const isPro = license.isPro();
    statusItem.text = isPro ? '$(star-full) AI Rules Pro' : '$(symbol-file) AI Rules';
    statusItem.tooltip = isPro
      ? 'AI Rules Manager — Pro active'
      : 'AI Rules Manager — click to manage';
    statusItem.command = 'aiRulesManager.openSettings';
  };
  updateStatus();
  license.onDidChange(updateStatus);
  statusItem.show();
  context.subscriptions.push(statusItem);
}

export function deactivate(): void {
  // nothing
}
