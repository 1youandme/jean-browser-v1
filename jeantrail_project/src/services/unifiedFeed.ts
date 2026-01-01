import type { FeedItem, FeedSource, FeedOptIn, FeedFilters } from '../types';

type Adapter = () => Promise<FeedItem[]>;

export interface UnifiedFeedService {
  getSources: () => FeedSource[];
  getOptIn: () => FeedOptIn;
  setOptIn: (opt: FeedOptIn) => void;
  registerAdapter: (source: FeedSource, adapter: Adapter) => void;
  getItems: (filters?: FeedFilters) => Promise<FeedItem[]>;
  markRead: (id: string) => Promise<void>;
  clear: () => Promise<void>;
}

class UnifiedFeedServiceImpl implements UnifiedFeedService {
  private adapters: Map<FeedSource, Adapter> = new Map();
  private optIn: FeedOptIn = {
    sources: {
      social: false,
      dashboard: false,
      news: false,
      delivery: false,
      activity: false,
    },
  };
  private items: Map<string, FeedItem> = new Map();

  getSources(): FeedSource[] {
    return ['social', 'dashboard', 'news', 'delivery', 'activity'];
  }

  getOptIn(): FeedOptIn {
    return this.optIn;
  }

  setOptIn(opt: FeedOptIn): void {
    this.optIn = opt;
  }

  registerAdapter(source: FeedSource, adapter: Adapter): void {
    this.adapters.set(source, adapter);
  }

  async getItems(filters?: FeedFilters): Promise<FeedItem[]> {
    const sources = (filters?.sources ?? this.getSources()).filter(
      (s) => this.optIn.sources[s]
    );
    const results: FeedItem[] = [];

    for (const source of sources) {
      const adapter = this.adapters.get(source) ?? this.mockAdapterFor(source);
      const items = await adapter();
      for (const item of items) {
        this.items.set(item.id, item);
      }
      results.push(...items);
    }

    let filtered = results;

    if (filters?.tags && filters.tags.length > 0) {
      filtered = filtered.filter((item) =>
        item.governance.tags.some((t) => filters.tags!.includes(t))
      );
    }

    if (filters?.unreadOnly) {
      filtered = filtered.filter((item) => !item.read);
    }

    if (filters?.search && filters.search.length > 0) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    filtered.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (filters?.limit && filtered.length > filters.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  async markRead(id: string): Promise<void> {
    const item = this.items.get(id);
    if (item) {
      item.read = true;
      this.items.set(id, item);
    }
  }

  async clear(): Promise<void> {
    this.items.clear();
  }

  private mockAdapterFor(source: FeedSource): Adapter {
    if (source === 'social') {
      return async () => [
        {
          id: `social-${Date.now()}`,
          source: 'social',
          title: 'New mention from @alex',
          summary: 'You were mentioned in a discussion about governance best practices.',
          url: 'https://example.social/post/123',
          author: 'alex',
          importance: 5,
          tags: ['mention', 'governance'],
          timestamp: new Date().toISOString(),
          governance: {
            tags: ['third_party', 'network', 'opt_in', 'advisory', 'no_background'],
            risk: 'medium',
            requiresApproval: false,
          },
          read: false,
        },
      ];
    }

    if (source === 'dashboard') {
      return async () => [
        {
          id: `dashboard-${Date.now()}`,
          source: 'dashboard',
          title: 'System health OK',
          summary: 'All monitored services are online and within thresholds.',
          tags: ['system', 'health'],
          timestamp: new Date().toISOString(),
          governance: {
            tags: ['local', 'no_background', 'advisory'],
            risk: 'low',
            requiresApproval: false,
          },
          read: false,
        },
      ];
    }

    if (source === 'news') {
      return async () => [
        {
          id: `news-${Date.now()}`,
          source: 'news',
          title: 'Policy updates in AI governance',
          summary: 'New public guidelines released for review. No enforcement changes.',
          url: 'https://news.example.com/article/456',
          author: 'editorial',
          importance: 7,
          tags: ['policy', 'ai', 'governance'],
          timestamp: new Date().toISOString(),
          governance: {
            tags: ['third_party', 'network', 'opt_in', 'advisory'],
            risk: 'low',
            requiresApproval: false,
          },
          read: false,
        },
      ];
    }

    if (source === 'delivery') {
      return async () => [
        {
          id: `delivery-${Date.now()}`,
          source: 'delivery',
          title: 'Delivery status update',
          summary: 'Package ETA updated based on latest route information.',
          tags: ['delivery', 'route'],
          timestamp: new Date().toISOString(),
          governance: {
            tags: ['third_party', 'network', 'opt_in'],
            risk: 'medium',
            requiresApproval: false,
          },
          read: false,
        },
      ];
    }

    return async () => [
      {
        id: `activity-${Date.now()}`,
        source: 'activity',
        title: 'User activity recorded',
        summary: 'Local UI interaction captured for audit trail.',
        tags: ['activity', 'audit'],
        timestamp: new Date().toISOString(),
        governance: {
          tags: ['local', 'no_background', 'review_only'],
          risk: 'low',
          requiresApproval: false,
        },
        read: false,
      },
    ];
  }
}

export const unifiedFeedService: UnifiedFeedService = new UnifiedFeedServiceImpl();

