import { ToolDefinition, ToolId } from '../types';

export const TOOLS: Record<ToolId, ToolDefinition> = {
  claude: {
    id: 'claude',
    label: 'Claude Code',
    fileNames: ['CLAUDE.md', '.claude/CLAUDE.md'],
    description: "Anthropic's Claude Code instructions file.",
    url: 'https://docs.claude.com/en/docs/claude-code',
    format: 'markdown',
    scope: 'both'
  },
  agents: {
    id: 'agents',
    label: 'AGENTS.md (open standard)',
    fileNames: ['AGENTS.md'],
    description: 'Cross-tool agent instruction file used by Cursor, Aider, Codex, and others.',
    url: 'https://agents.md',
    format: 'markdown',
    scope: 'project'
  },
  cursor: {
    id: 'cursor',
    label: 'Cursor',
    fileNames: ['.cursorrules', '.cursor/rules.md', '.cursor/rules'],
    description: 'Cursor AI editor rules file.',
    url: 'https://docs.cursor.com',
    format: 'plain',
    scope: 'project'
  },
  windsurf: {
    id: 'windsurf',
    label: 'Windsurf',
    fileNames: ['.windsurfrules', '.windsurf/rules.md'],
    description: 'Codeium Windsurf rules file.',
    url: 'https://codeium.com/windsurf',
    format: 'plain',
    scope: 'project'
  },
  copilot: {
    id: 'copilot',
    label: 'GitHub Copilot',
    fileNames: ['.github/copilot-instructions.md'],
    description: 'GitHub Copilot custom instructions for repository.',
    url: 'https://docs.github.com/en/copilot',
    format: 'markdown',
    scope: 'project'
  },
  aider: {
    id: 'aider',
    label: 'Aider',
    fileNames: ['.aider.conf.yml', 'CONVENTIONS.md'],
    description: 'Aider AI pair programmer conventions.',
    url: 'https://aider.chat',
    format: 'markdown',
    scope: 'project'
  },
  cline: {
    id: 'cline',
    label: 'Cline',
    fileNames: ['.clinerules', '.clinerules.md'],
    description: 'Cline (formerly Claude Dev) rules file.',
    url: 'https://github.com/cline/cline',
    format: 'markdown',
    scope: 'project'
  },
  continue: {
    id: 'continue',
    label: 'Continue',
    fileNames: ['.continue/config.json', '.continuerc.json'],
    description: 'Continue.dev configuration.',
    url: 'https://continue.dev',
    format: 'plain',
    scope: 'project'
  }
};

export function allFilePatterns(): string[] {
  const patterns: string[] = [];
  for (const tool of Object.values(TOOLS)) {
    for (const fname of tool.fileNames) {
      patterns.push(`**/${fname}`);
    }
  }
  return patterns;
}

export function toolForFileName(name: string): ToolDefinition | undefined {
  const lower = name.toLowerCase();
  for (const tool of Object.values(TOOLS)) {
    if (tool.fileNames.some(f => f.toLowerCase() === lower || lower.endsWith('/' + f.toLowerCase()))) {
      return tool;
    }
  }
  return undefined;
}
