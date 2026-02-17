import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Sparkles, RefreshCw, ChevronDown, ChevronUp, AlertCircle,
  Brain, Target, TrendingUp, Shield, Clock, Copy, Check,
  BookOpen, Zap, Compass, Quote,
  BarChart3, MessageSquareQuote, Lightbulb, Eye,
} from 'lucide-react';
import { adminAPI } from '../../services/api';

/* ═══════════ TYPES ═══════════ */
type PromptStyle = 'concise' | 'story' | 'strategic';

interface AIInsightPanelProps {
  /** Mô tả ngắn gọn yêu cầu phân tích */
  prompt: string;
  /** Dữ liệu thực từ trang (sẽ được serialize vào prompt) */
  dataContext?: string;
  /** Title hiển thị trên header */
  title?: string;
  /** Extra CSS classes */
  className?: string;
  /** Phong cách phân tích (default: strategic) */
  style?: PromptStyle;
}

/* ═══════════ INLINE RENDERER ═══════════ */

/** Highlight standalone numbers / percentages with accent pill styling */
function renderNumbers(text: string) {
  return text.split(/(\d[\d.,]*%?)/).map((seg, j) =>
    /^\d[\d.,]*%?$/.test(seg)
      ? <span key={j} className="inline-block px-1 mx-px bg-indigo-100/70 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded font-semibold tabular-nums text-[13px]">{seg}</span>
      : seg
  );
}

/** Render **bold**, `code`, numbers, and normal text  */
function renderInline(text: string, boldClass: string) {
  const parts = text.split(/(\*\*.*?\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <span key={i} className={`font-bold ${boldClass}`}>
          {renderNumbers(part.slice(2, -2))}
        </span>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="px-1.5 py-0.5 text-[12px] bg-gray-100 dark:bg-gray-700/50 text-indigo-600 dark:text-indigo-300 rounded font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{renderNumbers(part)}</span>;
  });
}

/* ═══════════ KEYFRAMES ═══════════ */
const shimmerStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
  backgroundSize: '200% 100%',
  animation: 'ai-shimmer 2s ease-in-out infinite',
};
const pulseGlow: React.CSSProperties = { animation: 'ai-pulse-glow 3s ease-in-out infinite' };
const floatStyle = (d: number): React.CSSProperties => ({ animation: `ai-float 4s ease-in-out ${d}s infinite` });

/* ═══════════ LRU CACHE ═══════════ */
const CACHE_MAX = 30;
const CACHE_INDEX_KEY = 'ai_insight_lru';

function lruGet(key: string): string | null {
  try {
    const val = sessionStorage.getItem(key);
    if (val !== null) {
      // bump to front
      const idx: string[] = JSON.parse(sessionStorage.getItem(CACHE_INDEX_KEY) || '[]');
      const pos = idx.indexOf(key);
      if (pos > -1) idx.splice(pos, 1);
      idx.push(key);
      sessionStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(idx));
    }
    return val;
  } catch { return null; }
}

function lruSet(key: string, value: string) {
  try {
    const idx: string[] = JSON.parse(sessionStorage.getItem(CACHE_INDEX_KEY) || '[]');
    // evict oldest if over limit
    while (idx.length >= CACHE_MAX) {
      const oldest = idx.shift()!;
      sessionStorage.removeItem(oldest);
      sessionStorage.removeItem(oldest + '_ts');
    }
    // remove if exists then push
    const pos = idx.indexOf(key);
    if (pos > -1) idx.splice(pos, 1);
    idx.push(key);
    sessionStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(idx));
    sessionStorage.setItem(key, value);
  } catch { /* quota */ }
}

function getCacheKey(prompt: string, data?: string, style?: string) {
  const src = prompt + (data || '') + (style || '');
  let h = 0;
  for (let i = 0; i < src.length; i++) h = ((h << 5) - h + src.charCodeAt(i)) | 0;
  return `ai_insight_${h}`;
}

/* ══════════════════════════════════════════════════════ */
/*                  SYSTEM PROMPTS                       */
/* ══════════════════════════════════════════════════════ */
const SYSTEM_PROMPTS: Record<PromptStyle, string> = {
  concise: `Bạn là trợ lý AI của cửa hàng thời trang ShopFeshen, ghi chú nhanh cho quản lý.

PHONG CÁCH: Tối giản, trực tiếp, không lan man, không emoji.

CÁCH VIẾT:
- Trả lời 4-6 dòng, mỗi dòng 1 ý ngắn.
- Bắt buộc có đúng 1 dòng blockquote bắt đầu bằng ký tự > để nhấn mạnh ý quan trọng nhất.
- Dòng cuối là hành động cụ thể cần làm tiếp theo, bắt đầu bằng [ACTION].
- In đậm **số liệu** và **từ khóa quan trọng**.
- Luôn trả lời bằng tiếng Việt có dấu chuẩn, tự nhiên.
- Không dùng heading ###, không dùng bullet *, không dùng markdown list.
- Phân tích DỰA TRÊN DỮ LIỆU THỰC, không bịa số liệu.`,

  story: `Bạn là chuyên gia kể chuyện dữ liệu của cửa hàng thời trang ShopFeshen. Bạn biến số liệu khô khan thành câu chuyện dễ hiểu và thú vị.

PHONG CÁCH: Kể chuyện tự nhiên, dẫn dắt logic, dễ hiểu. Không emoji.

CÁCH VIẾT:
- Viết 3-4 đoạn văn xuôi ngắn (mỗi đoạn 2-3 câu), kể câu chuyện từ dữ liệu.
- Đoạn 1: Mở đầu bằng bối cảnh/tình hình.
- Đoạn 2: Diễn biến chính và điểm nổi bật.
- Đoạn 3: Ý nghĩa và góc nhìn.
- Bắt buộc có đúng 1 dòng blockquote bắt đầu bằng ký tự > để nhấn mạnh insight quan trọng nhất.
- Dòng cuối là hành động cụ thể, bắt đầu bằng [ACTION].
- In đậm **số liệu** và **từ khóa quan trọng**.
- Luôn trả lời bằng tiếng Việt có dấu chuẩn, tự nhiên.
- Không dùng heading ###, không dùng bullet *, không dùng markdown list.
- Phân tích DỰA TRÊN DỮ LIỆU THỰC, không bịa số liệu.`,

  strategic: `Bạn là cố vấn chiến lược cao cấp của cửa hàng thời trang ShopFeshen. Bạn có tầm nhìn xa, phân tích sâu và tư duy như một chiến lược gia ngành bán lẻ thời trang.

PHONG CÁCH: Điềm tĩnh, sâu sắc, có tầm nhìn dài hạn. Văn xuôi mạch lạc. Không emoji.

CẤU TRÚC (4 đoạn, mỗi đoạn 2-3 câu, bắt đầu bằng tag đánh dấu):
[CONTEXT] Bối cảnh ngành thời trang và xu hướng thị trường liên quan đến dữ liệu hiện tại.
[CURRENT] Vị trí hiện tại của shop so với mục tiêu, đánh giá hiệu suất cốt lõi.
[SIGNAL] Cảnh báo rủi ro hoặc nhận diện cơ hội đang mở ra.
[ACTION] Đề xuất điều chỉnh chiến lược ngắn hạn và dài hạn.

QUY TẮC:
- In đậm **chỉ số quan trọng** và **yếu tố chiến lược** then chốt.
- Bắt buộc có đúng 1 blockquote (dòng bắt đầu bằng ký tự >) để nhấn mạnh một tín hiệu thị trường hoặc thay đổi cần theo dõi sát.
- Hạn chế tối đa bullet, ưu tiên văn xuôi liền mạch.
- Tổng tối đa 10-14 dòng.
- Luôn trả lời bằng tiếng Việt có dấu chuẩn, tự nhiên.
- Không dùng heading ###, không dùng bullet *, không dùng markdown list.
- Phân tích DỰA TRÊN DỮ LIỆU THỰC, không bịa số liệu.`,
};

const STYLE_META: Record<PromptStyle, { label: string; icon: 'Zap' | 'BookOpen' | 'Compass'; color: string }> = {
  concise: { label: 'Ghi chú nhanh', icon: 'Zap', color: 'amber' },
  story: { label: 'Kể chuyện dữ liệu', icon: 'BookOpen', color: 'violet' },
  strategic: { label: 'Chiến lược', icon: 'Compass', color: 'teal' },
};

const STYLE_ICONS = { Zap, BookOpen, Compass };

/* ═══════════ LINE TYPE ═══════════ */
type LineType = 'prose' | 'quote' | 'context' | 'current' | 'signal' | 'action';

/* ══════════════════════════════════════════════════════ */
/*                  MAIN COMPONENT                       */
/* ══════════════════════════════════════════════════════ */
export default function AIInsightPanel({
  prompt,
  dataContext,
  title = 'Phân tích AI',
  className = '',
  style: defaultStyle = 'strategic',
}: AIInsightPanelProps) {
  const [activeStyle, setActiveStyle] = useState<PromptStyle>(defaultStyle);
  const cacheKey = useRef(getCacheKey(prompt, dataContext, activeStyle));

  const [insight, setInsight] = useState<string | null>(() => lruGet(cacheKey.current));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timestamp, setTimestamp] = useState<string | null>(() => {
    try { return sessionStorage.getItem(cacheKey.current + '_ts'); } catch { return null; }
  });
  const styleInjected = useRef(false);

  useEffect(() => {
    const newKey = getCacheKey(prompt, dataContext, activeStyle);
    cacheKey.current = newKey;
    // load cached result for new style if exists
    const cached = lruGet(newKey);
    if (cached) {
      setInsight(cached);
      try { setTimestamp(sessionStorage.getItem(newKey + '_ts')); } catch { /* */ }
    } else {
      setInsight(null);
      setTimestamp(null);
    }
  }, [prompt, dataContext, activeStyle]);

  /* inject keyframes once */
  useEffect(() => {
    if (styleInjected.current) return;
    styleInjected.current = true;
    const s = document.createElement('style');
    s.textContent = `
      @keyframes ai-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
      @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
      @keyframes ai-pulse-glow{0%,100%{box-shadow:0 0 12px rgba(99,102,241,.12)}50%{box-shadow:0 0 24px rgba(139,92,246,.28)}}
      @keyframes ai-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
      @keyframes ai-wave{0%,100%{transform:scaleY(.4)}50%{transform:scaleY(1)}}
      @keyframes ai-gradient-move{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
      @keyframes ai-section-in{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:translateY(0)}}
      @keyframes ai-line-in{0%{opacity:0;transform:translateX(-12px)}100%{opacity:1;transform:translateX(0)}}
      @keyframes ai-quote-in{0%{opacity:0;transform:scale(.96)}100%{opacity:1;transform:scale(1)}}
      @keyframes ai-fade-expand{0%{opacity:0;max-height:0}100%{opacity:1;max-height:600px}}
      @keyframes ai-dot-pulse{0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1.1)}}
      @keyframes ai-timeline-grow{0%{height:0}100%{height:100%}}
    `;
    document.head.appendChild(s);
  }, []);

  /* ═══════ COPY ═══════ */
  const handleCopy = useCallback(() => {
    if (!insight) return;
    navigator.clipboard.writeText(insight).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [insight]);

  /* ═══════ FETCH ═══════ */
  const fetchInsight = async () => {
    setLoading(true);
    setError(null);
    try {
      const userContent = dataContext
        ? `${prompt}\n\n--- DỮ LIỆU THỰC TẾ ---\n${dataContext}`
        : prompt;

      const res = await adminAPI.chat([
        { role: 'system', content: SYSTEM_PROMPTS[activeStyle] },
        { role: 'user', content: userContent },
      ]);
      const message = res.data?.data?.message;
      if (message) {
        setInsight(message);
        const now = new Date().toLocaleString('vi-VN');
        setTimestamp(now);
        lruSet(cacheKey.current, message);
        try { sessionStorage.setItem(cacheKey.current + '_ts', now); } catch { /* */ }
      } else {
        setError('Không nhận được phản hồi từ AI');
      }
    } catch (err: any) {
      console.error('AI Insight error:', err);
      setError(err?.response?.data?.message || 'Không thể kết nối đến AI. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  /* ═══════ PARSE LINES ═══════ */
  const parsedLines = useMemo(() => {
    if (!insight) return [] as { text: string; type: LineType }[];

    const maxLines = activeStyle === 'concise' ? 8 : 14;
    const lines = insight
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, maxLines);

    // Tag-based parsing first
    const TAG_MAP: Record<string, LineType> = {
      '[CONTEXT]': 'context',
      '[CURRENT]': 'current',
      '[SIGNAL]': 'signal',
      '[ACTION]': 'action',
    };

    const result = lines.map((line) => {
      // Blockquote
      if (line.startsWith('>')) {
        const cleaned = line.replace(/^>\s*/, '').trim();
        return { text: cleaned, type: 'quote' as LineType };
      }

      // Tag markers
      for (const [tag, type] of Object.entries(TAG_MAP)) {
        if (line.toUpperCase().includes(tag)) {
          const cleaned = line
            .replace(new RegExp(`\\[/?${tag.slice(1, -1)}\\]`, 'gi'), '')
            .replace(/^[-*]\s+/, '')
            .replace(/^#{1,4}\s*/, '')
            .replace(/^\d+\.\s*/, '')
            .trim();
          return { text: cleaned, type };
        }
      }

      // Keyword fallback (Vietnamese synonyms)
      const cleaned = line
        .replace(/^[-*]\s+/, '')
        .replace(/^#{1,4}\s*/, '')
        .replace(/^\d+\.\s*/, '')
        .trim();

      if (/\b(đề xuất|chiến lược|điều chỉnh|khuyến nghị|nên triển khai|dài hạn|ngắn hạn|khuyến khích|cần làm|hành động|tiếp theo|nên làm|việc cần)\b/i.test(cleaned)) {
        return { text: cleaned, type: 'action' as LineType };
      }
      if (/\b(rủi ro|cảnh báo|lưu ý|cẩn trọng|nguy cơ|sụt giảm|đe dọa|tiềm ẩn|mất mát|suy yếu|tụt|giảm mạnh)\b/i.test(cleaned)) {
        return { text: cleaned, type: 'signal' as LineType };
      }
      if (/\b(xu hướng|thị trường|ngành|bối cảnh|mùa|trend|nhu cầu|người tiêu dùng)\b/i.test(cleaned)) {
        return { text: cleaned, type: 'context' as LineType };
      }
      if (/\b(hiện tại|đang ở|so với|mục tiêu|hiệu suất|đạt được|tỉ lệ|doanh thu)\b/i.test(cleaned)) {
        return { text: cleaned, type: 'current' as LineType };
      }

      return { text: cleaned, type: 'prose' as LineType };
    });

    // Blockquote fallback: nếu AI quên blockquote, auto-promote dòng signal/quan trọng nhất
    const hasQuote = result.some((l) => l.type === 'quote');
    if (!hasQuote && result.length > 0) {
      const signalIdx = result.findIndex((l) => l.type === 'signal');
      if (signalIdx > -1) {
        result[signalIdx] = { ...result[signalIdx], type: 'quote' };
      } else {
        // pick the line with most **bold** as most important
        let best = 0;
        let bestCount = 0;
        result.forEach((l, i) => {
          const count = (l.text.match(/\*\*/g) || []).length;
          if (count > bestCount) { bestCount = count; best = i; }
        });
        if (bestCount > 0) {
          result[best] = { ...result[best], type: 'quote' };
        }
      }
    }

    return result;
  }, [insight, activeStyle]);

  /* ═══════ SECTION STATS ═══════ */
  const sectionStats = useMemo(() => {
    const counts: Partial<Record<LineType, number>> = {};
    parsedLines.forEach((l) => { counts[l.type] = (counts[l.type] || 0) + 1; });
    return counts;
  }, [parsedLines]);

  /* ═══════ RENDER ═══════ */
  const styleMeta = STYLE_META[activeStyle];
  const StyleIcon = STYLE_ICONS[styleMeta.icon];

  return (
    <div className={`relative group ${className}`}>
      {/* Animated gradient border */}
      <div
        className="absolute -inset-[1px] rounded-2xl opacity-50 group-hover:opacity-90 transition-opacity duration-500 blur-[1px]"
        style={{ background: 'linear-gradient(135deg,#6366f1,#a855f7,#ec4899,#6366f1)', backgroundSize: '300% 300%', animation: 'ai-gradient-move 6s ease infinite' }}
      />

      <div className="relative bg-gradient-to-br from-indigo-50/95 via-white/95 to-purple-50/95 dark:from-gray-900/95 dark:via-gray-900/95 dark:to-indigo-950/95 rounded-2xl overflow-hidden backdrop-blur-sm" style={pulseGlow}>
        {/* Floating orbs */}
        <div className="absolute top-3 right-16 w-20 h-20 bg-gradient-to-br from-purple-400/10 to-pink-400/10 dark:from-purple-400/5 dark:to-pink-400/5 rounded-full blur-xl pointer-events-none" style={floatStyle(0)} />
        <div className="absolute bottom-2 left-10 w-16 h-16 bg-gradient-to-br from-indigo-400/10 to-cyan-400/10 dark:from-indigo-400/5 dark:to-cyan-400/5 rounded-full blur-xl pointer-events-none" style={floatStyle(1.5)} />

        {/* Shimmer */}
        <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={shimmerStyle} />
        </div>

        {/* ── Header ── */}
        <div className="relative flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-indigo-50/50 via-white to-purple-50/50 dark:from-indigo-950/30 dark:via-gray-900 dark:to-purple-950/30 border-b border-indigo-100 dark:border-indigo-900">
          <button onClick={() => setCollapsed(!collapsed)} className="flex items-center gap-3 group/btn">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-br from-indigo-400 via-violet-400 to-pink-400 rounded-xl blur opacity-60 group-hover/btn:opacity-90 transition-opacity" />
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Sparkles className="w-4.5 h-4.5 text-white drop-shadow-sm" style={floatStyle(0)} />
              </div>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-extrabold bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 dark:from-indigo-400 dark:via-violet-400 dark:to-pink-400 bg-clip-text text-transparent">
                {title}
              </span>
              <span className="text-[10px] text-indigo-400/70 dark:text-indigo-500/70 font-medium tracking-wide">Powered by QUANG PHÚC</span>
            </div>
            <div className="ml-1 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
              {collapsed ? <ChevronDown className="w-3 h-3 text-indigo-500" /> : <ChevronUp className="w-3 h-3 text-indigo-500" />}
            </div>
          </button>

          <div className="flex items-center gap-2">
            {/* Style selector */}
            <div className="relative hidden sm:block">
              <select
                value={activeStyle}
                onChange={(e) => setActiveStyle(e.target.value as PromptStyle)}
                className="appearance-none text-[11px] font-semibold bg-white/70 dark:bg-gray-800/70 border border-indigo-200/60 dark:border-indigo-700/40 rounded-lg pl-7 pr-6 py-1.5 text-indigo-700 dark:text-indigo-300 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-400"
              >
                {(Object.keys(STYLE_META) as PromptStyle[]).map((s) => (
                  <option key={s} value={s}>{STYLE_META[s].label}</option>
                ))}
              </select>
              <StyleIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 pointer-events-none" />
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-indigo-400 pointer-events-none" />
            </div>

            {timestamp && !loading && (
              <span className="hidden md:flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                <Clock className="w-3 h-3" />
                {timestamp}
              </span>
            )}
            {insight && !loading && (
              <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-full border border-emerald-200/50 dark:border-emerald-800/30">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Đã phân tích
              </span>
            )}
            <button
              onClick={fetchInsight}
              disabled={loading}
              className="relative flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl overflow-hidden shadow-lg shadow-indigo-500/20 hover:shadow-xl transition-shadow disabled:opacity-70 group/cta"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 group-hover/cta:scale-105 transition-transform duration-300" />
              <div
                className="absolute inset-0 opacity-0 group-hover/cta:opacity-100 transition-opacity duration-300"
                style={{
                  background: 'linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.2) 50%, transparent 75%)',
                  backgroundSize: '250% 250%',
                  animation: 'shimmer 1.5s ease-in-out infinite',
                }}
              />
              <RefreshCw className={`relative w-3.5 h-3.5 ${loading ? 'animate-spin' : 'group-hover/cta:rotate-180 transition-transform duration-500'}`} />
              <span className="relative">{insight ? 'Phân tích lại' : 'Phân tích ngay'}</span>
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        {!collapsed && (
          <div className="relative px-5 pb-5">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <div className="relative">
                  <div className="absolute -inset-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-md opacity-30 animate-pulse" />
                  <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center">
                    <Brain className="w-7 h-7 text-white animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center gap-1 h-6">
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="w-1 rounded-full bg-gradient-to-t from-indigo-500 to-purple-500" style={{ animation: `ai-wave .8s ease-in-out ${i * .1}s infinite`, height: '100%' }} />
                  ))}
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">AI đang phân tích dữ liệu...</span>
                  <span className="text-[11px] text-indigo-400 dark:text-indigo-500">Đang tổng hợp và đưa ra nhận định</span>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-start gap-3 py-3.5 px-4 bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20 rounded-xl border border-rose-200/60 dark:border-rose-800/40">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-rose-500/20">
                  <AlertCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">Lỗi phân tích</p>
                  <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">{error}</p>
                </div>
              </div>
            ) : insight ? (
              <div
                className="relative pt-5 pb-4 px-0 rounded-xl"
                style={{ animation: 'ai-section-in .4s ease-out both' }}
              >
                {/* Card header + copy button */}
                <div className="flex items-center justify-between mb-4 pb-3 mx-5 border-b border-slate-200/60 dark:border-slate-700/40">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                      <StyleIcon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 tracking-widest uppercase">{styleMeta.label}</span>
                    {/* Word count badge */}
                    <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 text-[9px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100/60 dark:bg-slate-800/40 rounded-full">
                      <BarChart3 className="w-2.5 h-2.5" />
                      {insight.split(/\s+/).length} từ
                    </span>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 bg-white/80 dark:bg-gray-800/50 border border-slate-200/70 dark:border-slate-700/50 rounded-lg hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md hover:shadow-indigo-500/10 transition-all duration-200"
                    title="Sao chép phân tích"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>

                {/* ── Summary composition strip ── */}
                <div className="mx-5 mb-4 flex items-center gap-2">
                  <Eye className="w-3 h-3 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                  <div className="flex-1 h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800/50 flex">
                    {(['context', 'current', 'signal', 'quote', 'action', 'prose'] as LineType[])
                      .filter((t) => (sectionStats[t] || 0) > 0)
                      .map((t) => {
                        const gradientMap: Record<string, string> = {
                          context: 'from-sky-400 to-blue-500',
                          current: 'from-indigo-400 to-blue-600',
                          signal: 'from-amber-400 to-orange-500',
                          action: 'from-emerald-400 to-green-600',
                          quote: 'from-violet-400 to-purple-500',
                          prose: 'from-slate-300 to-slate-400',
                        };
                        return (
                          <div
                            key={t}
                            className={`h-full bg-gradient-to-r ${gradientMap[t]} transition-all duration-700`}
                            style={{ width: `${((sectionStats[t] || 0) / parsedLines.length) * 100}%` }}
                            title={`${t}: ${sectionStats[t]}`}
                          />
                        );
                      })
                    }
                  </div>
                </div>

                {/* ── Timeline layout ── */}
                <div className="relative ml-5 mr-5">
                  {/* Vertical timeline connector */}
                  <div className="absolute left-[13px] top-3 bottom-3 w-[2px] bg-gradient-to-b from-indigo-300/50 via-violet-300/30 to-emerald-300/50 dark:from-indigo-600/30 dark:via-violet-600/20 dark:to-emerald-600/30 rounded-full" style={{ animation: 'ai-timeline-grow .8s ease-out both' }} />

                  <div className="space-y-5">
                    {parsedLines.map((line, idx) => {
                      const delay = `${idx * 0.08}s`;
                      const lineAnim: React.CSSProperties = { animation: `ai-line-in .45s ease-out ${delay} both` };
                      const baseTextClass = 'text-[13.5px] text-slate-600 dark:text-slate-300 leading-[1.75]';

                      switch (line.type) {
                        case 'quote':
                          return (
                            <div key={idx} className="relative pl-10" style={{ animation: `ai-quote-in .5s ease-out ${delay} both` }}>
                              {/* Timeline dot */}
                              <div className="absolute left-[3px] top-4 w-[22px] h-[22px] rounded-full bg-gradient-to-br from-violet-400 to-purple-500 dark:from-violet-500 dark:to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/25 z-10">
                                <MessageSquareQuote className="w-3 h-3 text-white" />
                              </div>
                              <blockquote className="relative ml-2 pl-5 pr-5 py-4 bg-gradient-to-r from-violet-50/80 via-purple-50/50 to-fuchsia-50/30 dark:from-violet-950/30 dark:via-purple-950/20 dark:to-fuchsia-950/10 border border-violet-200/50 dark:border-violet-800/30 rounded-xl shadow-sm hover:shadow-md hover:shadow-violet-500/10 transition-shadow duration-300">
                                {/* Big decorative quotation mark */}
                                <div className="absolute -top-2 -left-1 text-violet-300/60 dark:text-violet-600/40 pointer-events-none select-none">
                                  <Quote className="w-8 h-8 rotate-180" />
                                </div>
                                <div className="absolute -bottom-2 -right-1 text-violet-300/60 dark:text-violet-600/40 pointer-events-none select-none">
                                  <Quote className="w-6 h-6" />
                                </div>
                                {/* Left accent bar */}
                                <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-gradient-to-b from-violet-400 via-purple-400 to-fuchsia-400 dark:from-violet-500 dark:via-purple-500 dark:to-fuchsia-500" />
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 mb-2 text-[9px] font-bold tracking-widest uppercase rounded-full border bg-violet-100/80 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border-violet-200/60 dark:border-violet-700/40">
                                  <Lightbulb className="w-2.5 h-2.5" />
                                  INSIGHT
                                </span>
                                <p className="relative text-sm text-slate-700 dark:text-slate-200 italic leading-relaxed font-medium">
                                  {renderInline(line.text, 'font-bold text-violet-700 dark:text-violet-300 not-italic')}
                                </p>
                              </blockquote>
                            </div>
                          );

                        case 'signal':
                          return (
                            <div key={idx} className="relative flex items-start gap-4 pl-10 group" style={lineAnim}>
                              {/* Timeline dot */}
                              <div className="absolute left-[3px] top-1 w-[22px] h-[22px] rounded-full bg-gradient-to-br from-amber-400 to-orange-500 dark:from-amber-500 dark:to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/25 group-hover:scale-110 transition-transform duration-200 z-10">
                                <Shield className="w-3 h-3 text-white" />
                              </div>
                              <div className="ml-2 flex-1 py-1.5 px-3 -mx-1 rounded-lg hover:bg-amber-50/50 dark:hover:bg-amber-950/10 transition-colors duration-200">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 mb-1.5 text-[9px] font-bold tracking-widest uppercase rounded-full border bg-amber-100/80 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-700/40">
                                  <Shield className="w-2.5 h-2.5" />
                                  TÍN HIỆU
                                </span>
                                <p className={baseTextClass}>
                                  {renderInline(line.text, 'font-bold text-amber-600 dark:text-amber-300')}
                                </p>
                              </div>
                            </div>
                          );

                        case 'action':
                          return (
                            <div key={idx} className="relative flex items-start gap-4 pl-10 group" style={lineAnim}>
                              {/* Timeline dot */}
                              <div className="absolute left-[3px] top-1 w-[22px] h-[22px] rounded-full bg-gradient-to-br from-emerald-400 to-green-600 dark:from-emerald-500 dark:to-green-700 flex items-center justify-center shadow-md shadow-emerald-500/25 group-hover:scale-110 group-hover:rotate-12 transition-all duration-200 z-10">
                                <Target className="w-3 h-3 text-white" />
                              </div>
                              <div className="ml-2 flex-1 py-1.5 px-3 -mx-1 rounded-lg hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10 transition-colors duration-200">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 mb-1.5 text-[9px] font-bold tracking-widest uppercase rounded-full border bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-700/40">
                                  <Target className="w-2.5 h-2.5" />
                                  ĐỀ XUẤT
                                </span>
                                <p className={`${baseTextClass} font-medium`}>
                                  {renderInline(line.text, 'font-bold text-emerald-600 dark:text-emerald-300')}
                                </p>
                              </div>
                            </div>
                          );

                        case 'context':
                          return (
                            <div key={idx} className="relative flex items-start gap-4 pl-10 group" style={lineAnim}>
                              {/* Timeline dot */}
                              <div className="absolute left-[3px] top-1 w-[22px] h-[22px] rounded-full bg-gradient-to-br from-sky-400 to-blue-500 dark:from-sky-500 dark:to-blue-600 flex items-center justify-center shadow-md shadow-sky-500/25 z-10">
                                <BookOpen className="w-3 h-3 text-white" />
                              </div>
                              <div className="ml-2 flex-1 py-1.5 px-3 -mx-1 rounded-lg hover:bg-sky-50/50 dark:hover:bg-sky-950/10 transition-colors duration-200">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 mb-1.5 text-[9px] font-bold tracking-widest uppercase rounded-full border bg-sky-100/80 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 border-sky-200/60 dark:border-sky-700/40">
                                  <BookOpen className="w-2.5 h-2.5" />
                                  BỐI CẢNH
                                </span>
                                <p className={baseTextClass}>
                                  {renderInline(line.text, 'font-bold text-sky-600 dark:text-sky-300')}
                                </p>
                              </div>
                            </div>
                          );

                        case 'current':
                          return (
                            <div key={idx} className="relative flex items-start gap-4 pl-10 group" style={lineAnim}>
                              {/* Timeline dot */}
                              <div className="absolute left-[3px] top-1 w-[22px] h-[22px] rounded-full bg-gradient-to-br from-indigo-400 to-blue-600 dark:from-indigo-500 dark:to-blue-700 flex items-center justify-center shadow-md shadow-indigo-500/25 z-10">
                                <TrendingUp className="w-3 h-3 text-white" />
                              </div>
                              <div className="ml-2 flex-1 py-1.5 px-3 -mx-1 rounded-lg hover:bg-indigo-50/50 dark:hover:bg-indigo-950/10 transition-colors duration-200">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 mb-1.5 text-[9px] font-bold tracking-widest uppercase rounded-full border bg-indigo-100/80 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-700/40">
                                  <TrendingUp className="w-2.5 h-2.5" />
                                  HIỆN TRẠNG
                                </span>
                                <p className={baseTextClass}>
                                  {renderInline(line.text, 'font-bold text-indigo-600 dark:text-indigo-300')}
                                </p>
                              </div>
                            </div>
                          );

                        default: // prose
                          return (
                            <div key={idx} className="relative pl-10" style={lineAnim}>
                              {/* Small timeline dot for prose */}
                              <div className="absolute left-[9px] top-2.5 w-[8px] h-[8px] rounded-full bg-slate-300 dark:bg-slate-600 z-10" />
                              <p className={`ml-2 px-3 ${baseTextClass}`}>
                                {renderInline(line.text, 'font-semibold text-slate-800 dark:text-slate-100')}
                              </p>
                            </div>
                          );
                      }
                    })}
                  </div>
                </div>

                {/* ── Legend footer ── */}
                <div className="mx-5 mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-700/30">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 dark:text-slate-500">
                    {[
                      { label: 'Bối cảnh', color: 'bg-sky-400', type: 'context' as LineType },
                      { label: 'Hiện trạng', color: 'bg-indigo-400', type: 'current' as LineType },
                      { label: 'Tín hiệu', color: 'bg-amber-400', type: 'signal' as LineType },
                      { label: 'Insight', color: 'bg-violet-400', type: 'quote' as LineType },
                      { label: 'Đề xuất', color: 'bg-emerald-400', type: 'action' as LineType },
                    ].filter((item) => (sectionStats[item.type] || 0) > 0).map((item, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${item.color}`} />
                        <span>{item.label}</span>
                      </div>
                    ))}
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <span>{parsedLines.length} đoạn phân tích</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Empty state */
              <div className="flex items-center gap-3 py-4 px-4 bg-white/40 dark:bg-gray-800/30 rounded-xl border border-dashed border-indigo-200/60 dark:border-indigo-800/30">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center" style={floatStyle(0)}>
                  <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Nhấn <span className="font-bold text-indigo-600 dark:text-indigo-400">&quot;Phân tích ngay&quot;</span> để AI đánh giá dữ liệu
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">AI sẽ phân tích dữ liệu thực tế trên trang và đưa ra nhận định chi tiết</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
