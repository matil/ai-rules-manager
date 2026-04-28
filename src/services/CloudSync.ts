import * as vscode from 'vscode';

interface CloudFile {
  path: string;
  content: string;
  modified: number;
}

/**
 * Cloud sync of rule files across machines.
 * Uses a simple JSON API: POST /push, GET /pull, with the user's license key as bearer.
 * Pro feature.
 */
export class CloudSync {
  constructor(private getLicenseKey: () => string) {}

  private endpoint(): string {
    const config = vscode.workspace.getConfiguration('aiRulesManager');
    return config.get<string>(
      'cloudSync.endpoint',
      'https://api.devtools360.xyz/ai-rules/sync'
    );
  }

  async push(files: CloudFile[]): Promise<void> {
    const key = this.getLicenseKey();
    if (!key) {
      throw new Error('No license key set.');
    }
    const res = await fetch(`${this.endpoint()}/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({ files })
    });
    if (!res.ok) {
      throw new Error(`Push failed: ${res.status} ${await res.text()}`);
    }
  }

  async pull(): Promise<CloudFile[]> {
    const key = this.getLicenseKey();
    if (!key) {
      throw new Error('No license key set.');
    }
    const res = await fetch(`${this.endpoint()}/pull`, {
      headers: { Authorization: `Bearer ${key}` }
    });
    if (!res.ok) {
      throw new Error(`Pull failed: ${res.status} ${await res.text()}`);
    }
    const data: any = await res.json();
    return data.files || [];
  }
}
