import * as vscode from 'vscode';
import { TemplateLibrary } from '../services/TemplateLibrary';
import { LicenseManager } from '../services/LicenseManager';
import { Template } from '../types';

class TemplateNode extends vscode.TreeItem {
  contextValue = 'template';
  constructor(public readonly template: Template, isPro: boolean) {
    super(template.name, vscode.TreeItemCollapsibleState.None);
    this.description = template.stack.join(', ');
    this.tooltip = template.description;
    this.iconPath = new vscode.ThemeIcon(
      template.isPro && !isPro ? 'lock' : 'symbol-file'
    );
    this.command = {
      command: 'aiRulesManager.insertTemplate',
      title: 'Insert',
      arguments: [template.id]
    };
  }
}

export class TemplatesTreeProvider implements vscode.TreeDataProvider<TemplateNode> {
  private _onDidChange = new vscode.EventEmitter<TemplateNode | undefined>();
  readonly onDidChangeTreeData = this._onDidChange.event;

  constructor(private library: TemplateLibrary, private license: LicenseManager) {
    license.onDidChange(() => this._onDidChange.fire(undefined));
  }

  getTreeItem(element: TemplateNode): vscode.TreeItem {
    return element;
  }

  getChildren(): TemplateNode[] {
    const isPro = this.license.isPro();
    const templates = this.library.list(true);
    return templates.map(t => new TemplateNode(t, isPro));
  }
}
