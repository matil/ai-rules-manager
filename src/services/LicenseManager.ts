import * as vscode from 'vscode';
import { LicenseStatus } from '../types';

/**
 * Lightweight offline license check.
 * In v1: license keys are signed JWT-style tokens with format:
 *   AIRM-<TIER>-<EMAIL_HASH>-<EXP_UNIX>-<SIG>
 *
 * For v0.1 (this scaffold), we accept any non-empty key starting with AIRM-PRO-
 * as Pro for testing. Real signature validation will be added when the
 * Lemon Squeezy product is configured.
 */
export class LicenseManager {
  private static readonly STORAGE_KEY = 'aiRulesManager.license';

  private _onDidChange = new vscode.EventEmitter<LicenseStatus>();
  readonly onDidChange = this._onDidChange.event;

  private current: LicenseStatus = { valid: false, tier: 'free', features: [] };

  constructor(private context: vscode.ExtensionContext) {
    this.load();
  }

  private async load() {
    const stored = this.context.globalState.get<LicenseStatus>(LicenseManager.STORAGE_KEY);
    if (stored) {
      this.current = stored;
    } else {
      const config = vscode.workspace.getConfiguration('aiRulesManager');
      const key = config.get<string>('licenseKey', '');
      if (key) {
        await this.activate(key);
      }
    }
  }

  status(): LicenseStatus {
    return this.current;
  }

  isPro(): boolean {
    return this.current.valid && (this.current.tier === 'pro' || this.current.tier === 'team');
  }

  async activate(key: string): Promise<LicenseStatus> {
    const status = this.validateKey(key);
    this.current = status;
    await this.context.globalState.update(LicenseManager.STORAGE_KEY, status);
    this._onDidChange.fire(status);
    return status;
  }

  async deactivate() {
    this.current = { valid: false, tier: 'free', features: [] };
    await this.context.globalState.update(LicenseManager.STORAGE_KEY, this.current);
    this._onDidChange.fire(this.current);
  }

  /**
   * Local-only validation. Server-side verification can be layered on later.
   */
  private validateKey(key: string): LicenseStatus {
    if (!key || !key.trim()) {
      return { valid: false, tier: 'free', features: [] };
    }
    const trimmed = key.trim().toUpperCase();
    if (trimmed.startsWith('AIRM-PRO-')) {
      return {
        valid: true,
        tier: 'pro',
        features: ['cloud-sync', 'ai-generate', 'history', 'pro-templates'],
        expiresAt: undefined
      };
    }
    if (trimmed.startsWith('AIRM-TEAM-')) {
      return {
        valid: true,
        tier: 'team',
        features: ['cloud-sync', 'ai-generate', 'history', 'pro-templates', 'team-share']
      };
    }
    return { valid: false, tier: 'free', features: [] };
  }

  /**
   * Show an upgrade prompt and link to checkout.
   */
  async promptUpgrade(feature: string) {
    const result = await vscode.window.showInformationMessage(
      `${feature} is a Pro feature. Upgrade to unlock cloud sync, AI generation, history, and premium templates.`,
      'Get Pro ($9 one-time)',
      'Already have a key',
      'Maybe later'
    );
    if (result === 'Get Pro ($9 one-time)') {
      vscode.env.openExternal(vscode.Uri.parse('https://devtools360.xyz/ai-rules-pro'));
    } else if (result === 'Already have a key') {
      vscode.commands.executeCommand('aiRulesManager.activateLicense');
    }
  }
}
