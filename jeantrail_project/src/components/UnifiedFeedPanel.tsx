import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { FeedItem, FeedSource, GovernanceTag, FeedFilters, FeedOptIn } from '../types';
import { unifiedFeedService } from '../services';
import { Search, RefreshCw, Shield, Tag as TagIcon, CheckCircle, Eye, EyeOff } from 'lucide-react';

const ALL_SOURCES: FeedSource[] = ['social', 'dashboard', 'news', 'delivery', 'activity'];
const ALL_TAGS: GovernanceTag[] = ['local', 'network', 'third_party', 'opt_in', 'sensitive', 'advisory', 'no_background', 'review_only'];

export default function UnifiedFeedPanel() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<GovernanceTag[]>([]);
  const [selectedSources, setSelectedSources] = useState<FeedSource[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [optIn, setOptIn] = useState<FeedOptIn>(() => ({
    sources: {
      social: false,
      dashboard: true,
      news: false,
      delivery: false,
      activity: true,
    },
  }));

  const filters: FeedFilters = useMemo(
    () => ({
      sources: selectedSources.length > 0 ? selectedSources : undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      unreadOnly,
      search: search.length > 0 ? search : undefined,
      limit: 100,
    }),
    [selectedSources, selectedTags, unreadOnly, search]
  );

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    unifiedFeedService.setOptIn(optIn);
    const data = await unifiedFeedService.getItems(filters);
    setItems(data);
    setIsRefreshing(false);
  }, [filters, optIn]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleTag = useCallback((tag: GovernanceTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const toggleSource = useCallback((source: FeedSource) => {
    setSelectedSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
  }, []);

  const setSourceOptIn = useCallback((source: FeedSource, enabled: boolean) => {
    setOptIn((prev) => ({
      sources: { ...prev.sources, [source]: enabled },
    }));
  }, []);

  const markRead = useCallback(async (id: string) => {
    await unifiedFeedService.markRead(id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, read: true } : i)));
  }, []);

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Unified Feed</h3>
            <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
              {items.length} items
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={refresh}
              disabled={isRefreshing}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search feed..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center flex-wrap gap-2">
            {ALL_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-2 py-1 text-xs rounded-full border ${
                  selectedTags.includes(tag)
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-gray-300 text-gray-600 bg-gray-50'
                }`}
              >
                <span className="inline-flex items-center space-x-1">
                  <TagIcon className="w-3 h-3" />
                  <span>{tag.replace('_', ' ')}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={() => setUnreadOnly((v) => !v)}
              className={`px-3 py-2 text-sm rounded-lg border ${
                unreadOnly ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-gray-300 text-gray-600 bg-gray-50'
              }`}
            >
              {unreadOnly ? (
                <span className="inline-flex items-center space-x-1">
                  <EyeOff className="w-4 h-4" />
                  <span>Unread only</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>All items</span>
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="font-medium text-gray-900">Source opt-in</div>
        </div>
        <div className="mt-3 flex items-center flex-wrap gap-2">
          {ALL_SOURCES.map((source) => (
            <div key={source} className="flex items-center space-x-2 px-2 py-1 rounded-lg bg-white border border-gray-200">
              <button
                onClick={() => setSourceOptIn(source, !optIn.sources[source])}
                className={`p-1 rounded ${optIn.sources[source] ? 'text-green-600' : 'text-gray-500'}`}
                title={optIn.sources[source] ? 'Enabled' : 'Disabled'}
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleSource(source)}
                className={`text-xs px-2 py-1 rounded ${
                  selectedSources.includes(source) ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {source.toUpperCase()}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-600">No feed items</p>
              <p className="text-sm text-gray-500 mt-1">Adjust sources or tags</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {items.map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                        {item.source.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">{new Date(item.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="mt-1 text-gray-900 font-medium">{item.title}</div>
                    <div className="mt-1 text-gray-700 text-sm">{item.summary}</div>
                    <div className="mt-2 flex items-center flex-wrap gap-2">
                      {item.tags.map((t) => (
                        <span key={t} className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                          {t}
                        </span>
                      ))}
                      {item.governance.tags.map((t) => (
                        <span key={`g-${t}`} className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                          {t.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!item.read && (
                      <button
                        onClick={() => markRead(item.id)}
                        className="px-2 py-1 text-xs rounded bg-green-100 text-green-700"
                      >
                        Mark read
                      </button>
                    )}
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700"
                      >
                        Open
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

