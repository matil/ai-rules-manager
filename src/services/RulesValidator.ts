import { ToolDefinition } from '../types';

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
}

/**
 * Validates AI rule file content for common mistakes.
 */
export class RulesValidator {
  validate(content: string, tool: ToolDefinition): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (content.trim().length === 0) {
      issues.push({ severity: 'error', message: 'File is empty.' });
      return issues;
    }

    if (content.length > 50_000) {
      issues.push({
        severity: 'warning',
        message: `File is ${(content.length / 1000).toFixed(1)}k chars. Most AI tools truncate above ~10–20k. Consider trimming.`
      });
    }

    // Look for embedded API keys / secrets
    const secretPatterns = [
      { re: /sk-[A-Za-z0-9]{20,}/, label: 'OpenAI API key' },
      { re: /sk-ant-[A-Za-z0-9-_]{20,}/, label: 'Anthropic API key' },
      { re: /AKIA[0-9A-Z]{16}/, label: 'AWS access key' },
      { re: /ghp_[A-Za-z0-9]{30,}/, label: 'GitHub PAT' },
      { re: /xox[baprs]-[A-Za-z0-9-]{10,}/, label: 'Slack token' }
    ];
    for (const { re, label } of secretPatterns) {
      if (re.test(content)) {
        issues.push({
          severity: 'error',
          message: `Possible ${label} in rule file. Remove before committing.`
        });
      }
    }

    // Encourage at least one structural section
    const hasHeading = /^#{1,6}\s+\S/m.test(content);
    if (tool.format === 'markdown' && !hasHeading && content.length > 200) {
      issues.push({
        severity: 'info',
        message: 'No markdown headings found. Consider adding section headings for readability.'
      });
    }

    // Cursor / Windsurf often work better with bullet-point style
    if ((tool.id === 'cursor' || tool.id === 'windsurf') && !/^[-*]\s/m.test(content)) {
      issues.push({
        severity: 'info',
        message: `${tool.label} works best with concise bullet-point rules.`
      });
    }

    // Detect TODO/placeholder markers
    if (/\bTODO\b|\bFIXME\b|\b<<<\b/.test(content)) {
      issues.push({
        severity: 'warning',
        message: 'TODO/FIXME/placeholder markers found in rules.'
      });
    }

    return issues;
  }
}
