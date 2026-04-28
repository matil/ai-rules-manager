import * as vscode from 'vscode';

interface GenerateOptions {
  description: string;
  detectedStack: string[];
  tool: string;
}

/**
 * AI-powered rule file generator.
 * Calls the user-configured provider (Anthropic, OpenAI, or local Ollama).
 * Pro feature.
 */
export class AIGenerator {
  async generate(opts: GenerateOptions): Promise<string> {
    const config = vscode.workspace.getConfiguration('aiRulesManager');
    const provider = config.get<string>('ai.provider', 'anthropic');
    const apiKey = config.get<string>('ai.apiKey', '');
    const model = config.get<string>('ai.model', 'claude-sonnet-4-20250514');

    if (!apiKey && provider !== 'ollama') {
      throw new Error(
        `No API key configured for ${provider}. Set 'aiRulesManager.ai.apiKey' in settings.`
      );
    }

    const systemPrompt = this.buildSystemPrompt(opts.tool);
    const userPrompt = this.buildUserPrompt(opts);

    switch (provider) {
      case 'anthropic':
        return this.callAnthropic(apiKey, model, systemPrompt, userPrompt);
      case 'openai':
        return this.callOpenAI(apiKey, model, systemPrompt, userPrompt);
      case 'ollama':
        return this.callOllama(model, systemPrompt, userPrompt);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private buildSystemPrompt(tool: string): string {
    return `You write AI assistant rule files for codebases. Output a single, well-organized markdown rule file for ${tool}.
Style: terse, scannable, action-oriented. Use H2 headings for top-level sections (## Stack, ## Conventions, ## Forbidden, ## Output style).
Output ONLY the markdown content. No preamble, no explanation, no code fences around the whole thing.`;
  }

  private buildUserPrompt(opts: GenerateOptions): string {
    const stack = opts.detectedStack.length > 0 ? opts.detectedStack.join(', ') : 'unspecified';
    return `Project description: ${opts.description}

Detected stack: ${stack}
Target tool: ${opts.tool}

Generate the rule file now.`;
  }

  private async callAnthropic(
    apiKey: string,
    model: string,
    system: string,
    user: string
  ): Promise<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 2000,
        system,
        messages: [{ role: 'user', content: user }]
      })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Anthropic API ${res.status}: ${text}`);
    }
    const data: any = await res.json();
    const text = (data.content || [])
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('\n');
    return text.trim();
  }

  private async callOpenAI(
    apiKey: string,
    model: string,
    system: string,
    user: string
  ): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ]
      })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenAI API ${res.status}: ${text}`);
    }
    const data: any = await res.json();
    return (data.choices?.[0]?.message?.content || '').trim();
  }

  private async callOllama(model: string, system: string, user: string): Promise<string> {
    const res = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ]
      })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Ollama ${res.status}: ${text}`);
    }
    const data: any = await res.json();
    return (data.message?.content || '').trim();
  }
}
