import { LifecycleOutcome } from '../core/JeanRuntimeBoundary';

export interface PolicyRule {
    id: string;
    category: 'safety' | 'privacy' | 'monetization' | 'sovereignty';
    check: (action: any) => boolean; // Returns true if BLOCKED
    reason: string;
    alternative?: string;
}

export class SafetyPolicyLayer {
    private rules: PolicyRule[] = [];

    constructor() {
        this.initializeDefaultRules();
    }

    private initializeDefaultRules() {
        // Block: Pornography, Gambling, Scams
        this.addRule({
            id: 'block_unsafe_content',
            category: 'safety',
            check: (action) => {
                const unsafeKeywords = ['porn', 'gambling', 'casino', 'scam', 'phishing', 'xxx', 'betting'];
                const content = JSON.stringify(action).toLowerCase();
                return unsafeKeywords.some(kw => content.includes(kw));
            },
            reason: 'Content detected as potentially unsafe (Pornography/Gambling/Scam).',
            alternative: 'Navigate to safe, verified domains.'
        });

        // Block: Tracking / Profiling
        this.addRule({
            id: 'block_tracking',
            category: 'privacy',
            check: (action) => {
                if (action.type === 'network_call' || action.type === 'script_injection') {
                    const url = (action.payload?.url || '').toLowerCase();
                    const trackers = ['google-analytics', 'facebook.com/tr', 'hotjar', 'segment.io'];
                    return trackers.some(t => url.includes(t));
                }
                return false;
            },
            reason: 'Third-party tracking or profiling script detected.',
            alternative: 'Use privacy-preserving alternatives or local processing.'
        });

        // Block: Behavioral Ads
        this.addRule({
            id: 'block_ads',
            category: 'monetization',
            check: (action) => {
                return action.type === 'ad_insertion' || (action.payload?.type === 'advertisement');
            },
            reason: 'Behavioral advertising is prohibited.',
            alternative: 'Contextual, non-tracking suggestions only.'
        });
    }

    public addRule(rule: PolicyRule) {
        this.rules.push(rule);
    }

    /**
     * Validates an action against all active policies.
     */
    public evaluate(action: any): LifecycleOutcome {
        for (const rule of this.rules) {
            if (rule.check(action)) {
                return {
                    type: 'blocked',
                    action,
                    reason: `[Policy: ${rule.category}] ${rule.reason}`,
                    metadata: {
                        ruleId: rule.id,
                        alternative: rule.alternative
                    }
                };
            }
        }

        return { type: 'approved', action };
    }
}
