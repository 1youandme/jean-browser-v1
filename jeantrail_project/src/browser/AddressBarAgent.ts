/**
 * AddressBarAgent.ts
 * 
 * The intelligence layer behind the address bar.
 * - Parses URL semantics.
 * - Detects page intent (Reading, Watching, Shopping, Coding).
 * - Enforces PRIVACY: Never reads credentials or sensitive forms.
 */

export interface AddressBarState {
  url: string;
  isSecure: boolean;
  privacyLevel: 'public' | 'private' | 'sensitive';
  detectedIntent: PageIntent;
  suggestions: string[]; // Contextual actions (e.g., "Summarize Article", "Find Coupon")
  blockedReason?: string; // If access is restricted or features disabled for privacy
}

export type PageIntent = 
  | 'search' 
  | 'reading' 
  | 'watching' 
  | 'shopping' 
  | 'coding' 
  | 'banking' 
  | 'social' 
  | 'system' 
  | 'unknown';

export class AddressBarAgent {
  
  // Regex for sensitive domains/patterns where Jean should blind herself
  private static SENSITIVE_PATTERNS = [
    /login/i,
    /signin/i,
    /bank/i,
    /wallet/i,
    /account\/security/i,
    /password/i,
    /reset-password/i
  ];

  /**
   * Analyzes the current URL and page context to determine intent and safety.
   */
  public async analyze(url: string, pageTitle: string = ''): Promise<AddressBarState> {
    const isSecure = url.startsWith('https://') || url.startsWith('file://') || url.startsWith('chrome://');
    
    // 1. Privacy Check
    if (this.isSensitive(url)) {
      return {
        url,
        isSecure,
        privacyLevel: 'sensitive',
        detectedIntent: 'banking', // Generalize sensitive intents
        suggestions: [],
        blockedReason: 'Jean disabled on sensitive page to protect credentials.'
      };
    }

    // 2. Intent Detection
    const intent = this.detectIntent(url, pageTitle);

    // 3. Generate Suggestions based on Intent
    const suggestions = this.generateSuggestions(intent);

    return {
      url,
      isSecure,
      privacyLevel: 'public', // Default for non-sensitive
      detectedIntent: intent,
      suggestions
    };
  }

  private isSensitive(url: string): boolean {
    return AddressBarAgent.SENSITIVE_PATTERNS.some(pattern => pattern.test(url));
  }

  private detectIntent(url: string, title: string): PageIntent {
    const lowerUrl = url.toLowerCase();
    const lowerTitle = title.toLowerCase();

    if (lowerUrl.includes('youtube.com/watch') || lowerUrl.includes('netflix.com') || lowerUrl.includes('twitch.tv')) {
      return 'watching';
    }
    if (lowerUrl.includes('amazon.com') || lowerUrl.includes('/shop') || lowerUrl.includes('/product/')) {
      return 'shopping';
    }
    if (lowerUrl.includes('github.com') || lowerUrl.includes('gitlab.com') || lowerUrl.includes('stackoverflow.com')) {
      return 'coding';
    }
    if (lowerUrl.includes('medium.com') || lowerUrl.includes('wikipedia.org') || lowerTitle.includes('blog') || lowerTitle.includes('news')) {
      return 'reading';
    }
    if (lowerUrl.includes('twitter.com') || lowerUrl.includes('facebook.com') || lowerUrl.includes('linkedin.com')) {
      return 'social';
    }
    if (lowerUrl.startsWith('file://') || lowerUrl.startsWith('about:')) {
      return 'system';
    }
    if (lowerUrl.includes('google.com/search') || lowerUrl.includes('bing.com/search')) {
      return 'search';
    }

    return 'unknown';
  }

  private generateSuggestions(intent: PageIntent): string[] {
    switch (intent) {
      case 'reading':
        return ['Summarize this article', 'Read aloud', 'Save to knowledge base'];
      case 'watching':
        return ['Summarize video', 'Extract transcript', 'Picture-in-Picture'];
      case 'shopping':
        return ['Compare prices', 'Find reviews', 'Track price'];
      case 'coding':
        return ['Clone repository', 'Find references', 'Explain code'];
      case 'search':
        return ['Deep search', 'Synthesize results'];
      default:
        return ['Capture page', 'Analyze content'];
    }
  }
}
