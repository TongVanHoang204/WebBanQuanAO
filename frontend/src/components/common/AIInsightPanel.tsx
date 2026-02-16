import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Sparkles, RefreshCw, ChevronDown, ChevronUp, AlertCircle,
  Brain, Target, TrendingUp, Shield, Clock, Copy, Check,
  BookOpen, Zap, Compass,
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

/** Render **bold**, `code`, and normal text  */
function renderInline(text: string, boldClass: string) {
  const parts = text.split(/(\*\*.*?\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <span key={i} className={`font-bold ${boldClass}`}>
          {part.slice(2, -2)}
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
    return <span key={i}>{part}</span>;
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
  concise: `Ban la tro ly AI cua cua hang thoi trang ShopFeshen, ghi chu nhanh cho quan ly.

PHONG CACH: Toi gian, truc tiep, khong lan man, khong emoji.

CACH VIET:
- Tra loi 4-6 dong, moi dong 1 y ngan.
- Bat buoc co dung 1 dong blockquote bat dau bang ky tu > de nhan manh y quan trong nhat.
- Dong cuoi la hanh dong cu the can lam tiep theo, bat dau bang [ACTION].
- In dam **so lieu** va **tu khoa quan trong**.
- Khong dung heading ###, khong dung bullet *, khong dung markdown list.
- Phan tich DUA TREN DU LIEU THUC, khong bia so lieu.`,

  story: `Ban la chuyen gia ke chuyen du lieu cua cua hang thoi trang ShopFeshen. Ban bien so lieu kho khan thanh cau chuyen de hieu va thu vi.

PHONG CACH: Ke chuyen tu nhien, dan dat logic, de hieu. Khong emoji.

CACH VIET:
- Viet 3-4 doan van xuoi ngan (moi doan 2-3 cau), ke cau chuyen tu du lieu.
- Doan 1: Mo dau bang boi canh/tinh hinh.
- Doan 2: Dien bien chinh va diem noi bat.
- Doan 3: Y nghia va goc nhin.
- Bat buoc co dung 1 dong blockquote bat dau bang ky tu > de nhan manh insight quan trong nhat.
- Dong cuoi la hanh dong cu the, bat dau bang [ACTION].
- In dam **so lieu** va **tu khoa quan trong**.
- Khong dung heading ###, khong dung bullet *, khong dung markdown list.
- Phan tich DUA TREN DU LIEU THUC, khong bia so lieu.`,

  strategic: `Ban la co van chien luoc cao cap cua cua hang thoi trang ShopFeshen. Ban co tam nhin xa, phan tich sau va tu duy nhu mot chien luoc gia nganh ban le thoi trang.

PHONG CACH: Diem tinh, sau sac, co tam nhin dai han. Van xuoi mach lac. Khong emoji.

CAU TRUC (4 doan, moi doan 2-3 cau, bat dau bang tag danh dau):
[CONTEXT] Boi canh nganh thoi trang va xu huong thi truong lien quan den du lieu hien tai.
[CURRENT] Vi tri hien tai cua shop so voi muc tieu, danh gia hieu suat cot loi.
[SIGNAL] Canh bao rui ro hoac nhan dien co hoi dang mo ra.
[ACTION] De xuat dieu chinh chien luoc ngan han va dai han.

QUY TAC:
- In dam **chi so quan trong** va **yeu to chien luoc** then chot.
- Bat buoc co dung 1 blockquote (dong bat dau bang ky tu >) de nhan manh mot tin hieu thi truong hoac thay doi can theo doi sat.
- Han che toi da bullet, uu tien van xuoi lien mach.
- Tong toi da 10-14 dong.
- Khong dung heading ###, khong dung bullet *, khong dung markdown list.
- Phan tich DUA TREN DU LIEU THUC, khong bia so lieu.`,
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
      @keyframes ai-pulse-glow{0%,100%{box-shadow:0 0 12px rgba(99,102,241,.12)}50%{box-shadow:0 0 24px rgba(139,92,246,.28)}}
      @keyframes ai-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
      @keyframes ai-wave{0%,100%{transform:scaleY(.4)}50%{transform:scaleY(1)}}
      @keyframes ai-gradient-move{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
      @keyframes ai-section-in{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:translateY(0)}}
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
        <div className="relative flex items-center justify-between px-5 py-3.5">
          <button onClick={() => setCollapsed(!collapsed)} className="flex items-center gap-3 group/btn">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl blur-sm opacity-50 group-hover/btn:opacity-80 transition-opacity" />
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg">
                <Sparkles className="w-4.5 h-4.5 text-white drop-shadow-sm" style={floatStyle(0)} />
              </div>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                {title}
              </span>
              <span className="text-[10px] text-indigo-400/70 dark:text-indigo-500/70 font-medium tracking-wide">Powered by Ollama</span>
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
            <button onClick={fetchInsight} disabled={loading} className="relative flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl transition-all duration-300 overflow-hidden disabled:opacity-70 group/action">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 group-hover/action:from-indigo-700 group-hover/action:via-purple-700 group-hover/action:to-pink-700 transition-all duration-300" />
              <div className="absolute inset-0 opacity-0 group-hover/action:opacity-100 transition-opacity duration-300" style={shimmerStyle} />
              <RefreshCw className={`relative w-3.5 h-3.5 ${loading ? 'animate-spin' : 'group-hover/action:rotate-180 transition-transform duration-500'}`} />
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
                className="relative py-5 px-5 rounded-xl border-l-4 border-l-teal-500 dark:border-l-teal-400 border border-slate-200/70 dark:border-slate-700/50 bg-gradient-to-br from-slate-50/95 via-white/95 to-teal-50/40 dark:from-slate-900/60 dark:via-gray-900/60 dark:to-teal-950/20 shadow-sm"
                style={{ animation: 'ai-section-in .4s ease-out both' }}
              >
                {/* Card header + copy button */}
                <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-200/60 dark:border-slate-700/40">
                  <div className="flex items-center gap-2">
                    <StyleIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span className="text-[10px] font-bold text-teal-700/90 dark:text-teal-300/90 tracking-widest uppercase">{styleMeta.label}</span>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 bg-white/60 dark:bg-gray-800/40 border border-slate-200/60 dark:border-slate-700/40 rounded-md hover:border-teal-300 dark:hover:border-teal-600 transition-all"
                    title="Sao chép phân tích"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {parsedLines.map((line, idx) => {
                    if (line.type === 'quote') {
                      return (
                        <blockquote
                          key={idx}
                          className="pl-3.5 border-l-[3px] border-cyan-400 dark:border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/20 py-2 px-3 rounded-r-lg text-[13px] text-slate-700 dark:text-slate-200 leading-[1.75] italic"
                        >
                          <TrendingUp className="inline w-3.5 h-3.5 mr-1.5 text-cyan-500 dark:text-cyan-400 -mt-0.5" />
                          {renderInline(line.text, 'text-cyan-700 dark:text-cyan-300 not-italic font-semibold')}
                        </blockquote>
                      );
                    }
                    if (line.type === 'signal') {
                      return (
                        <div key={idx} className="flex items-start gap-2">
                          <Shield className="w-4 h-4 mt-0.5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                          <p className="text-[13px] text-slate-700 dark:text-slate-300 leading-[1.75]">
                            {renderInline(line.text, 'text-amber-700 dark:text-amber-300 font-semibold')}
                          </p>
                        </div>
                      );
                    }
                    if (line.type === 'action') {
                      return (
                        <div key={idx} className="flex items-start gap-2 pt-1.5 border-t border-slate-200/50 dark:border-slate-700/30">
                          <Target className="w-4 h-4 mt-0.5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                          <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200 leading-[1.75]">
                            {renderInline(line.text, 'text-teal-700 dark:text-teal-300')}
                          </p>
                        </div>
                      );
                    }
                    if (line.type === 'context') {
                      return (
                        <p key={idx} className="text-[13px] text-slate-500 dark:text-slate-400 leading-[1.75]">
                          {renderInline(line.text, 'text-slate-700 dark:text-slate-200 font-semibold')}
                        </p>
                      );
                    }
                    if (line.type === 'current') {
                      return (
                        <p key={idx} className="text-[13px] text-slate-600 dark:text-slate-300 leading-[1.75]">
                          {renderInline(line.text, 'text-indigo-700 dark:text-indigo-300 font-semibold')}
                        </p>
                      );
                    }
                    return (
                      <p key={idx} className="text-[13px] text-slate-600 dark:text-slate-300 leading-[1.75]">
                        {renderInline(line.text, 'text-slate-800 dark:text-slate-100 font-semibold')}
                      </p>
                    );
                  })}
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
