import React, { useState } from 'react';
import { Sparkles, Loader2, RefreshCw, ChevronDown, ChevronUp, X, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ─── Cache helpers ───────────────────────────────────────────
const CACHE_PREFIX = 'ai_insight_';
const DEFAULT_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CachedInsight {
  data: any;
  timestamp: number;
}

function loadCachedInsight(key: string, ttl: number): any | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const cached: CachedInsight = JSON.parse(raw);
    if (Date.now() - cached.timestamp > ttl) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return cached.data;
  } catch {
    return null;
  }
}

function saveCachedInsight(key: string, data: any) {
  try {
    const payload: CachedInsight = { data, timestamp: Date.now() };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(payload));
  } catch { /* quota exceeded — ignore */ }
}

// ─── Component ───────────────────────────────────────────────
interface AIInsightPanelProps {
  title?: string;
  onAnalyze: () => Promise<string | any>;
  className?: string;
  autoLoad?: boolean;
  compact?: boolean;
  type?: 'text' | 'json' | 'custom';
  renderContent?: (data: any) => React.ReactNode;
  /** Unique key used to persist analysis in localStorage. When set, results survive page navigation. */
  cacheKey?: string;
  /** How long to keep the cache in ms (default: 7 days) */
  cacheTTL?: number;
}

export default function AIInsightPanel({ 
  title = 'AI Insight', 
  onAnalyze, 
  className = '',
  autoLoad = false,
  compact = false,
  type = 'text',
  renderContent,
  cacheKey,
  cacheTTL = DEFAULT_CACHE_TTL,
}: AIInsightPanelProps) {
  // Try to restore from cache on first render
  const cached = cacheKey ? loadCachedInsight(cacheKey, cacheTTL) : null;
  const [insight, setInsight] = useState<any>(cached);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(!!cached);

  React.useEffect(() => {
    if (autoLoad && !hasLoaded) {
      handleAnalyze();
    }
  }, [autoLoad]);

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await onAnalyze();
      setInsight(result);
      setHasLoaded(true);
      // Persist to cache
      if (cacheKey) {
        saveCachedInsight(cacheKey, result);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Lỗi kết nối AI');
    } finally {
      setLoading(false);
    }
  };

  if (!hasLoaded && !loading && !autoLoad) {
    return (
      <button
        onClick={handleAnalyze}
        className={`flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl text-sm font-medium transition-all shadow-md hover:shadow-lg ${className}`}
      >
        <Sparkles className="w-4 h-4" />
        {title}
      </button>
    );
  }

  return (
    <div className={`relative bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30 rounded-2xl border border-indigo-200/50 dark:border-indigo-800/50 overflow-hidden ${className}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/30 dark:hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">{title}</span>
          {loading && <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleAnalyze(); }}
            className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
            title="Phân tích lại"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-indigo-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-indigo-400" />
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className={`px-4 pb-4 ${compact ? '' : 'pt-1'}`}>
          {loading && !insight && (
            <div className="flex items-center gap-3 py-4">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              <span className="text-sm text-indigo-600 dark:text-indigo-300">AI đang phân tích dữ liệu...</span>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-500 dark:text-red-400 py-2">
              ⚠️ {error}
            </div>
          )}

          {insight && !loading && (
            <div className="text-sm text-secondary-700 dark:text-secondary-300 leading-relaxed">
              {renderContent ? (
                renderContent(insight)
              ) : typeof insight === 'string' ? (
                <div className="prose dark:prose-invert prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{insight}</ReactMarkdown>
                </div>
              ) : (
                <pre className="text-xs bg-white/50 dark:bg-black/20 p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(insight, null, 2)}
                </pre>
              )}
            </div>
          )}

          {insight && loading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-black/20 flex items-center justify-center rounded-2xl">
              <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
