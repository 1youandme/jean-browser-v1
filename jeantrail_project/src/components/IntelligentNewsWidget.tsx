import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Globe,
  TrendingUp,
  Clock,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Share2,
  Filter,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Zap,
  Eye,
  MessageSquare,
  Heart,
  Calendar,
  User,
  Tag,
  Settings,
  Bell,
  BellOff,
  X,
  Check,
  AlertCircle,
  Newspaper
} from 'lucide-react';

// Types
interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  url: string;
  source: {
    name: string;
    logo: string;
    url: string;
    country: string;
  };
  author: string;
  publishedAt: string;
  category: string;
  tags: string[];
  imageUrl?: string;
  readTime: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  importance: number; // 1-10
  isBookmarked: boolean;
  isRead: boolean;
  engagement: {
    views: number;
    shares: number;
    comments: number;
    likes: number;
  };
}

interface UserInterests {
  categories: string[];
  topics: string[];
  sources: string[];
  languages: string[];
  sentimentPreference: 'all' | 'positive' | 'negative' | 'neutral';
  updateFrequency: number; // minutes
  maxArticles: number;
}

interface NewsSource {
  id: string;
  name: string;
  url: string;
  country: string;
  category: string;
  reliability: number; // 1-10
  isActive: boolean;
}

// Mock data - replace with real API calls
const MOCK_NEWS_SOURCES: NewsSource[] = [
  { id: 'bbc', name: 'BBC News', url: 'https://www.bbc.com/news', country: 'UK', category: 'general', reliability: 9, isActive: true },
  { id: 'cnn', name: 'CNN', url: 'https://www.cnn.com', country: 'USA', category: 'general', reliability: 8, isActive: true },
  { id: 'reuters', name: 'Reuters', url: 'https://www.reuters.com', country: 'UK', category: 'general', reliability: 9, isActive: true },
  { id: 'aljazeera', name: 'Al Jazeera', url: 'https://www.aljazeera.com', country: 'Qatar', category: 'general', reliability: 8, isActive: true },
  { id: 'techcrunch', name: 'TechCrunch', url: 'https://techcrunch.com', country: 'USA', category: 'technology', reliability: 8, isActive: true },
  { id: 'wired', name: 'WIRED', url: 'https://www.wired.com', country: 'USA', category: 'technology', reliability: 8, isActive: true }
];

const MOCK_CATEGORIES = [
  'general', 'business', 'entertainment', 'health', 'science', 'sports', 
  'technology', 'politics', 'world', 'local', 'education', 'environment'
];

const MOCK_INTERESTS: UserInterests = {
  categories: ['technology', 'business', 'science'],
  topics: ['AI', 'startups', 'climate change', 'space'],
  sources: ['bbc', 'reuters', 'techcrunch'],
  languages: ['en', 'ar'],
  sentimentPreference: 'all',
  updateFrequency: 60,
  maxArticles: 50
};

const MOCK_ARTICLES: NewsArticle[] = [
  {
    id: '1',
    title: 'Breakthrough in Quantum Computing Achieved by Research Team',
    summary: 'Scientists have successfully demonstrated a new quantum computing method that could revolutionize data processing.',
    content: 'Full article content would go here...',
    url: 'https://example.com/quantum-breakthrough',
    source: { name: 'BBC News', logo: '/logos/bbc.png', url: 'https://www.bbc.com', country: 'UK' },
    author: 'John Smith',
    publishedAt: '2024-01-15T10:30:00Z',
    category: 'technology',
    tags: ['quantum', 'computing', 'research', 'breakthrough'],
    imageUrl: '/images/quantum.jpg',
    readTime: 5,
    sentiment: 'positive',
    importance: 9,
    isBookmarked: false,
    isRead: false,
    engagement: { views: 1234, shares: 89, comments: 23, likes: 156 }
  },
  {
    id: '2',
    title: 'Global Climate Summit Reaches Historic Agreement',
    summary: 'World leaders have committed to unprecedented measures to combat climate change in a landmark summit.',
    content: 'Full article content would go here...',
    url: 'https://example.com/climate-summit',
    source: { name: 'Reuters', logo: '/logos/reuters.png', url: 'https://www.reuters.com', country: 'UK' },
    author: 'Sarah Johnson',
    publishedAt: '2024-01-15T09:15:00Z',
    category: 'environment',
    tags: ['climate', 'summit', 'agreement', 'environment'],
    imageUrl: '/images/climate.jpg',
    readTime: 7,
    sentiment: 'positive',
    importance: 8,
    isBookmarked: true,
    isRead: false,
    engagement: { views: 2341, shares: 234, comments: 67, likes: 289 }
  },
  {
    id: '3',
    title: 'Tech Startup Raises $100M in Series B Funding',
    summary: 'A promising AI startup has secured significant funding to expand its innovative platform globally.',
    content: 'Full article content would go here...',
    url: 'https://example.com/startup-funding',
    source: { name: 'TechCrunch', logo: '/logos/techcrunch.png', url: 'https://techcrunch.com', country: 'USA' },
    author: 'Mike Chen',
    publishedAt: '2024-01-15T08:45:00Z',
    category: 'business',
    tags: ['startup', 'funding', 'AI', 'investment'],
    imageUrl: '/images/startup.jpg',
    readTime: 4,
    sentiment: 'positive',
    importance: 7,
    isBookmarked: false,
    isRead: true,
    engagement: { views: 892, shares: 45, comments: 12, likes: 78 }
  }
];

// Main Component
export const IntelligentNewsWidget: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>(MOCK_ARTICLES);
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>(MOCK_ARTICLES);
  const [interests, setInterests] = useState<UserInterests>(MOCK_INTERESTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());
  
  const refreshIntervalRef = useRef<NodeJS.Timeout>();
  const autoUpdateIntervalRef = useRef<NodeJS.Timeout>();

  // Filter articles based on selected criteria
  const filterArticles = useCallback(() => {
    let filtered = [...articles];

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchLower) ||
        article.summary.toLowerCase().includes(searchLower) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // User interests filter
    if (interests.categories.length > 0) {
      filtered = filtered.filter(article =>
        interests.categories.includes(article.category) ||
        article.tags.some(tag => interests.topics.some(topic => 
          tag.toLowerCase().includes(topic.toLowerCase())
        ))
      );
    }

    // Sentiment filter
    if (interests.sentimentPreference !== 'all') {
      filtered = filtered.filter(article => article.sentiment === interests.sentimentPreference);
    }

    // Sort by importance and date
    filtered.sort((a, b) => {
      if (a.importance !== b.importance) {
        return b.importance - a.importance;
      }
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    // Limit to max articles
    filtered = filtered.slice(0, interests.maxArticles);

    setFilteredArticles(filtered);
  }, [articles, selectedCategory, searchTerm, interests]);

  // Fetch news from API
  const fetchNews = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate API call - replace with real NewsAPI or similar
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock new articles
      const newArticles: NewsArticle[] = MOCK_ARTICLES.map((article, index) => ({
        ...article,
        id: `${Date.now()}-${index}`,
        publishedAt: new Date().toISOString(),
        isRead: false,
        isBookmarked: false
      }));
      
      setArticles(prev => [...newArticles, ...prev]);
      setLastUpdated(new Date());
      
      if (notificationsEnabled) {
        // Show notification for important news
        const importantNews = newArticles.filter(a => a.importance >= 8);
        if (importantNews.length > 0) {
          // Trigger notification system
          console.log('New important news:', importantNews);
        }
      }
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [notificationsEnabled]);

  // Refresh news manually
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchNews();
  }, [fetchNews]);

  // Toggle bookmark
  const toggleBookmark = useCallback((articleId: string) => {
    setArticles(prev => prev.map(article =>
      article.id === articleId 
        ? { ...article, isBookmarked: !article.isBookmarked }
        : article
    ));
  }, []);

  // Mark as read
  const markAsRead = useCallback((articleId: string) => {
    setArticles(prev => prev.map(article =>
      article.id === articleId 
        ? { ...article, isRead: true }
        : article
    ));
  }, []);

  // Toggle article expansion
  const toggleArticleExpansion = useCallback((articleId: string) => {
    setExpandedArticles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) {
        newSet.delete(articleId);
      } else {
        newSet.add(articleId);
      }
      return newSet;
    });
  }, []);

  // Share article
  const shareArticle = useCallback((article: NewsArticle) => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.summary,
        url: article.url
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${article.title} - ${article.url}`);
    }
  }, []);

  // Update interests
  const updateInterests = useCallback((newInterests: Partial<UserInterests>) => {
    setInterests(prev => ({ ...prev, ...newInterests }));
  }, []);

  // Setup auto-refresh
  useEffect(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    const interval = setInterval(() => {
      fetchNews();
    }, interests.updateFrequency * 60 * 1000);

    refreshIntervalRef.current = interval;

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchNews, interests.updateFrequency]);

  // Filter articles when dependencies change
  useEffect(() => {
    filterArticles();
  }, [filterArticles]);

  // Get sentiment color
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'negative': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get importance indicator
  const getImportanceIndicator = (importance: number) => {
    if (importance >= 8) return { color: 'text-red-500', label: 'High' };
    if (importance >= 6) return { color: 'text-yellow-500', label: 'Medium' };
    return { color: 'text-blue-500', label: 'Low' };
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Newspaper className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">Intelligent News</h3>
            <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full">
              {filteredArticles.length} articles
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`p-2 rounded-lg ${notificationsEnabled ? 'text-blue-600 bg-blue-100' : 'text-gray-500 bg-gray-100'}`}
              title="Toggle notifications"
            >
              {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search news..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {MOCK_CATEGORIES.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-b border-gray-200 p-4 bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-3">News Preferences</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Update Frequency (minutes)
              </label>
              <input
                type="number"
                value={interests.updateFrequency}
                onChange={(e) => updateInterests({ updateFrequency: parseInt(e.target.value) })}
                min="5"
                max="1440"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Articles
              </label>
              <input
                type="number"
                value={interests.maxArticles}
                onChange={(e) => updateInterests({ maxArticles: parseInt(e.target.value) })}
                min="10"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sentiment Filter
              </label>
              <select
                value={interests.sentimentPreference}
                onChange={(e) => updateInterests({ sentimentPreference: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All</option>
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* News List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && filteredArticles.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading news...</p>
            </div>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No articles found</p>
              <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredArticles.map((article) => {
              const isExpanded = expandedArticles.has(article.id);
              const importance = getImportanceIndicator(article.importance);
              
              return (
                <div
                  key={article.id}
                  className={`border-b border-gray-100 p-4 hover:bg-gray-50 transition-colors ${
                    article.isRead ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Article Header */}
                      <div className="flex items-center space-x-2 mb-2">
                        <img
                          src={article.source.logo}
                          alt={article.source.name}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-xs font-medium text-gray-600">
                          {article.source.name}
                        </span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(article.publishedAt)}
                        </span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">
                          {article.readTime} min read
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getSentimentColor(article.sentiment)}`}>
                          {article.sentiment}
                        </span>
                        <span className={`text-xs ${importance.color}`}>
                          {importance.label} priority
                        </span>
                      </div>

                      {/* Article Title */}
                      <h4 className="font-medium text-gray-900 mb-2">
                        {article.title}
                      </h4>

                      {/* Article Summary */}
                      <p className="text-sm text-gray-600 mb-3">
                        {article.summary}
                      </p>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700 mb-3">
                            {article.content}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {article.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Article Footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Eye className="w-3 h-3" />
                            <span>{article.engagement.views}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <MessageSquare className="w-3 h-3" />
                            <span>{article.engagement.comments}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Share2 className="w-3 h-3" />
                            <span>{article.engagement.shares}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Heart className="w-3 h-3" />
                            <span>{article.engagement.likes}</span>
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleArticleExpansion(article.id)}
                            className="p-1 text-gray-500 hover:text-gray-700"
                            title={isExpanded ? 'Show less' : 'Show more'}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => {
                              toggleBookmark(article.id);
                              markAsRead(article.id);
                            }}
                            className="p-1 text-gray-500 hover:text-blue-500"
                            title={article.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                          >
                            {article.isBookmarked ? <BookmarkCheck className="w-4 h-4 text-blue-500" /> : <Bookmark className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => shareArticle(article)}
                            className="p-1 text-gray-500 hover:text-blue-500"
                            title="Share"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => markAsRead(article.id)}
                            className="p-1 text-gray-500 hover:text-blue-500"
                            title="Read full article"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {article.imageUrl && (
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-20 h-20 object-cover rounded-lg ml-4"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Last updated: {formatTimeAgo(lastUpdated.toISOString())}</span>
            <span>Auto-refresh: {interests.updateFrequency}min</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="w-3 h-3 text-green-500" />
            <span>Live updates</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntelligentNewsWidget;