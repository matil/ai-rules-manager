import * as vscode from 'vscode';

/**
 * Best-effort detection of the project's tech stack by inspecting common manifest files.
 * Used to suggest templates and seed AI generation.
 */
export class StackDetector {
  async detect(folder?: vscode.WorkspaceFolder): Promise<string[]> {
    const f = folder ?? vscode.workspace.workspaceFolders?.[0];
    if (!f) {
      return [];
    }
    const stack = new Set<string>();

    const checks: { file: string; markers: { needle: RegExp; tag: string }[] }[] = [
      {
        file: 'package.json',
        markers: [
          { needle: /"next"\s*:/, tag: 'nextjs' },
          { needle: /"react"\s*:/, tag: 'react' },
          { needle: /"react-native"\s*:/, tag: 'react-native' },
          { needle: /"expo"\s*:/, tag: 'expo' },
          { needle: /"vue"\s*:/, tag: 'vue' },
          { needle: /"svelte"\s*:/, tag: 'svelte' },
          { needle: /"typescript"\s*:/, tag: 'typescript' },
          { needle: /"tailwindcss"\s*:/, tag: 'tailwind' },
          { needle: /"@nestjs\//, tag: 'nestjs' },
          { needle: /"turbo"\s*:/, tag: 'monorepo' }
        ]
      },
      {
        file: 'pyproject.toml',
        markers: [
          { needle: /django/i, tag: 'django' },
          { needle: /fastapi/i, tag: 'fastapi' },
          { needle: /flask/i, tag: 'flask' },
          { needle: /pandas/i, tag: 'data' },
          { needle: /scikit-learn/i, tag: 'ml' }
        ]
      },
      {
        file: 'requirements.txt',
        markers: [
          { needle: /^django/im, tag: 'django' },
          { needle: /^fastapi/im, tag: 'fastapi' },
          { needle: /^flask/im, tag: 'flask' },
          { needle: /^pandas/im, tag: 'data' }
        ]
      },
      { file: 'Cargo.toml', markers: [{ needle: /./, tag: 'rust' }] },
      { file: 'go.mod', markers: [{ needle: /./, tag: 'go' }] },
      { file: 'Gemfile', markers: [{ needle: /rails/i, tag: 'rails' }] },
      { file: 'composer.json', markers: [{ needle: /laravel/i, tag: 'laravel' }] },
      { file: 'pom.xml', markers: [{ needle: /spring/i, tag: 'spring' }] }
    ];

    for (const check of checks) {
      const uri = vscode.Uri.joinPath(f.uri, check.file);
      try {
        const content = await vscode.workspace.fs.readFile(uri);
        const text = new TextDecoder().decode(content);
        for (const m of check.markers) {
          if (m.needle.test(text)) {
            stack.add(m.tag);
          }
        }
      } catch {
        // not present
      }
    }

    // Python detection by file presence
    try {
      const pyfiles = await vscode.workspace.findFiles('**/*.py', '**/node_modules/**', 1);
      if (pyfiles.length > 0) {
        stack.add('python');
      }
    } catch {
      /* */
    }

    return Array.from(stack);
  }
}
