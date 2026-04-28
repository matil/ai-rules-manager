import * as vscode from 'vscode';
import { RulesDetector } from '../services/RulesDetector';
import { RuleFile } from '../types';
import { LicenseManager } from '../services/LicenseManager';

type TreeNode = SectionNode | RuleFileNode | ActionNode;

class SectionNode extends vscode.TreeItem {
  contextValue = 'section';
  constructor(label: string, public readonly kind: 'present' | 'missing' | 'pro') {
    super(label, vscode.TreeItemCollapsibleState.Expanded);
    this.iconPath = new vscode.ThemeIcon(
      kind === 'present' ? 'check' : kind === 'missing' ? 'add' : 'star-full'
    );
  }
}

class RuleFileNode extends vscode.TreeItem {
  contextValue = 'ruleFile';
  constructor(public readonly file: RuleFile) {
    super(file.fileName, vscode.TreeItemCollapsibleState.None);
    this.description = file.tool.label;
    this.tooltip = `${file.fileName} — ${file.tool.label}\n${(file.size / 1024).toFixed(1)} KB`;
    this.iconPath = new vscode.ThemeIcon('file');
    this.command = {
      command: 'aiRulesManager.openFile',
      title: 'Open',
      arguments: [file.uri]
    };
    this.resourceUri = file.uri;
  }
}

class ActionNode extends vscode.TreeItem {
  contextValue = 'action';
  constructor(label: string, command: string, args: any[] = [], icon: string = 'add') {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.command = { command, title: label, arguments: args };
    this.iconPath = new vscode.ThemeIcon(icon);
  }
}

export class RulesTreeProvider implements vscode.TreeDataProvider<TreeNode> {
  private _onDidChange = new vscode.EventEmitter<TreeNode | undefined>();
  readonly onDidChangeTreeData = this._onDidChange.event;

  constructor(private detector: RulesDetector, private license: LicenseManager) {
    detector.onDidChange(() => this._onDidChange.fire(undefined));
    license.onDidChange(() => this._onDidChange.fire(undefined));
  }

  refresh() {
    this._onDidChange.fire(undefined);
  }

  getTreeItem(element: TreeNode): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TreeNode): Promise<TreeNode[]> {
    if (!element) {
      const present = await this.detector.detectAll();
      const missing = await this.detector.missingTools();
      const nodes: TreeNode[] = [];

      const presentSection = new SectionNode(
        `Active rule files (${present.length})`,
        'present'
      );
      const missingSection = new SectionNode(
        `Available to add (${missing.length})`,
        'missing'
      );
      nodes.push(presentSection, missingSection);
      return nodes;
    }

    if (element instanceof SectionNode) {
      if (element.kind === 'present') {
        const files = await this.detector.detectAll();
        if (files.length === 0) {
          return [
            new ActionNode(
              'No rule files yet — create one',
              'aiRulesManager.createRuleFile',
              [],
              'add'
            )
          ];
        }
        return files.map(f => new RuleFileNode(f));
      }
      if (element.kind === 'missing') {
        const tools = await this.detector.missingTools();
        return tools.map(
          t =>
            new ActionNode(
              `Add ${t.label}`,
              'aiRulesManager.createRuleFile',
              [t.id],
              'plus'
            )
        );
      }
    }

    return [];
  }
}
