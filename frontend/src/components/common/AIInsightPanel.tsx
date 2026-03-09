import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Sparkles, RefreshCw, ChevronDown, ChevronUp, AlertCircle,
  Brain, Target, TrendingUp, Shield, Clock, Copy, Check,
  BookOpen, Zap, Compass, Quote,
  BarChart3, MessageSquareQuote, Lightbulb,
} from 'lucide-react';
import { adminAPI } from '../../services/api';

/* ═══════════ CONSTANTS ═══════════ */
/** Max entries in LRU session cache */
const CACHE_MAX = 30;
const CACHE_INDEX_KEY = 'ai_insight_lru';

/** Max output lines per style */
const MAX_LINES: Record<PromptStyle, number> = {
  concise: 8,
  story: 14,
  strategic: 14,
  focus: 12,
  overview: 16,
};

/* ═══════════ TYPES ═══════════ */
type PromptStyle = 'concise' | 'story' | 'strategic' | 'focus' | 'overview';
type LineType = 'prose' | 'quote' | 'context' | 'current' | 'signal' | 'action';

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

interface ParsedLine {
  text: string;
  type: LineType;
}

/* ═══════════ SANITISATION ═══════════ */
/** Strip any HTML tags from AI output to prevent XSS */
function sanitizeText(raw: string): string {
  return raw.replace(/<\/?[^>]+(>|$)/g, '');
}

/* ═══════════ INLINE RENDERER ═══════════ */

/** Highlight standalone numbers / percentages with accent pill — uses word boundaries */
function renderNumbers(text: string) {
  return text.split(/(\b\d[\d.,]*%?\b)/).map((seg, j) =>
    /^\d[\d.,]*%?$/.test(seg)
      ? <span key={j} className="inline-block px-1 mx-px bg-indigo-100/70 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded font-semibold tabular-nums text-xs">{seg}</span>
      : seg
  );
}

/** Render **bold**, `code`, numbers, and normal text — sanitizes HTML */
function renderInline(text: string, boldClass: string) {
  const sanitized = sanitizeText(text);
  const parts = sanitized.split(/(\*\*.*?\*\*|`[^`]+`)/g);
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
        <code key={i} className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700/50 text-indigo-600 dark:text-indigo-300 rounded font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{renderNumbers(part)}</span>;
  });
}

/* ═══════════ ANIMATION HELPERS ═══════════ */
/* Keyframes are defined in index.css — no runtime <style> injection needed */
const shimmerStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
  backgroundSize: '200% 100%',
  animation: 'ai-shimmer 2s ease-in-out infinite',
};
const floatStyle = (d: number): React.CSSProperties => ({ animation: `ai-float 4s ease-in-out ${d}s infinite` });

/* ═══════════ LRU CACHE ═══════════ */
function lruGet(key: string): string | null {
  try {
    const val = sessionStorage.getItem(key);
    if (val !== null) {
      let idx: string[] = [];
      try {
        idx = JSON.parse(sessionStorage.getItem(CACHE_INDEX_KEY) || '[]');
      } catch (parseErr) {
        idx = [];
      }
      const pos = idx.indexOf(key);
      if (pos > -1) idx.splice(pos, 1);
      idx.push(key);
      try {
        sessionStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(idx));
      } catch (e) { /* ignore */ }
    }
    return val;
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[AIInsight] lruGet failed:', err);
    return null;
  }
}

function lruSet(key: string, value: string) {
  try {
    let idx: string[] = [];
    try {
      idx = JSON.parse(sessionStorage.getItem(CACHE_INDEX_KEY) || '[]');
    } catch (parseErr) {
      idx = [];
    }
    while (idx.length >= CACHE_MAX) {
      const oldest = idx.shift()!;
      sessionStorage.removeItem(oldest);
      sessionStorage.removeItem(oldest + '_ts');
    }
    const pos = idx.indexOf(key);
    if (pos > -1) idx.splice(pos, 1);
    idx.push(key);
    sessionStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(idx));
    sessionStorage.setItem(key, value);
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[AIInsight] lruSet failed (quota?):', err);
  }
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

/** Shared analysis principles injected into every style */
const ANALYSIS_BASE = `
NGUYÊN TẮC PHÂN TÍCH THÔNG MINH:
- Luôn so sánh tương đối: "tăng 25%" thay vì chỉ nêu con số tuyệt đối.
- Phát hiện mẫu hình: nhận diện xu hướng tăng/giảm, chu kỳ lặp, điểm bất thường.
- Ưu tiên insight có thể hành động được — tránh nhận xét chung chung.
- Liên kết dữ liệu chéo: ví dụ tỷ lệ hủy đơn cao + tồn kho thấp = vấn đề chuỗi cung ứng.

XỬ LÝ THIẾU DỮ LIỆU:
- Nếu một chỉ số = 0 hoặc không có dữ liệu: ghi rõ "chưa có dữ liệu" thay vì bỏ qua.
- Nếu dữ liệu bất thường (VD: doanh thu = 0 bất ngờ): cảnh báo rõ, KHÔNG coi là bình thường.
- TUYỆT ĐỐI KHÔNG bịa số liệu hoặc phỏng đoán khi không có dữ liệu.

GUIDELINE NGÀNH THỜI TRANG (ShopFeshen):
- Tỷ lệ chuyển đổi tốt: 2-4%. Giá trị đơn trung bình (AOV) nên theo dõi sát.
- Biên lợi nhuận gộp ngành thời trang: 50-65% là khỏe.
- Mùa cao điểm: Tết, 8/3, Black Friday, Giáng sinh. Mùa thấp: tháng 2-4, 7-8.
- Tỷ lệ hoàn hàng chấp nhận được: < 5%. Trên 10% là cảnh báo đỏ.
- Hàng tồn kho > 60 ngày: cần xả, > 90 ngày: tồn kho chết.

ĐỊNH DẠNG CHUNG:
- Luôn trả lời bằng tiếng Việt có dấu chuẩn, tự nhiên. Không emoji.
- In đậm **số liệu** và **từ khóa quan trọng**.
- Không dùng heading ###, không dùng bullet *, không dùng markdown list.
- KHÔNG dùng [CONTEXT] hoặc bối cảnh ngành chung chung.
- Phân tích DỰA TRÊN DỮ LIỆU THỰC được cung cấp.`;

/** WHO-WHAT-WHEN action format */
const ACTION_GUIDE = `
YÊU CẦU CHO PHẦN [ACTION]:
- Cấu trúc bắt buộc: Ai làm → Làm gì cụ thể → Trong khung thời gian nào.
- Ví dụ đúng: "Quản kho kiểm tra 5 SKU tồn < 10 trong hôm nay. Marketing chạy flash sale cuối tuần."
- KHÔNG BAO GIỜ tự ý in thêm chữ "WHO-WHAT-WHEN:" vào câu trả lời. Chỉ viết nội dung hành động.
- KHÔNG đề xuất mơ hồ kiểu "cần cải thiện" hay "nên xem xét".`;

const SYSTEM_PROMPTS: Record<PromptStyle, string> = {
  concise: `Bạn là trợ lý AI của cửa hàng thời trang ShopFeshen, ghi chú nhanh cho quản lý.
PHONG CÁCH: Tối giản, trực tiếp, không lan man.
CẤU TRÚC:
[CURRENT] 2-3 ý ngắn về hiện trạng, mỗi ý 1 câu.
[SIGNAL] 1-2 tín hiệu đáng chú ý.
[ACTION] 1-2 việc cần làm ngay (WHO-WHAT-WHEN).
- Tổng tối đa 6-8 dòng.
${ACTION_GUIDE}
${ANALYSIS_BASE}`,

  story: `Bạn là chuyên gia kể chuyện dữ liệu của cửa hàng thời trang ShopFeshen. Bạn biến số liệu thành câu chuyện dễ hiểu.
PHONG CÁCH: Kể chuyện tự nhiên, dẫn dắt logic, dễ hiểu.
CÁCH VIẾT — 3 đoạn văn xuôi ngắn (mỗi đoạn 2-3 câu):
- Đoạn 1 [CURRENT]: Hiện trạng — mở bằng số liệu chính, kể diễn biến.
- Đoạn 2 [SIGNAL]: Điểm nhấn — phát hiện đáng chú ý, rủi ro hoặc cơ hội.
- Đoạn 3 [ACTION]: Hành động WHO-WHAT-WHEN rõ ràng.
- Ưu tiên văn xuôi liền mạch. Tổng tối đa 8-10 dòng.
${ACTION_GUIDE}
${ANALYSIS_BASE}`,

  strategic: `Bạn là cố vấn chiến lược cao cấp của cửa hàng thời trang ShopFeshen. Tư duy như chiến lược gia ngành bán lẻ.
PHONG CÁCH: Điềm tĩnh, sâu sắc, tầm nhìn dài hạn. Văn xuôi mạch lạc.
CẤU TRÚC (3 đoạn, mỗi đoạn 2-3 câu):
[CURRENT] Vị trí hiện tại so với mục tiêu, benchmark với chỉ số ngành thời trang.
[SIGNAL] Rủi ro hoặc cơ hội chiến lược đang mở ra.
[ACTION] Điều chỉnh chiến lược WHO-WHAT-WHEN: ngắn hạn (tuần này) và dài hạn (tháng tới).
- Ưu tiên văn xuôi. Tổng tối đa 8-10 dòng.
${ACTION_GUIDE}
${ANALYSIS_BASE}`,

  focus: `Bạn là cố vấn chiến lược cao cấp của ShopFeshen.
PHONG CÁCH: Trực tiếp, ngắn gọn, hành động rõ ràng.
CẤU TRÚC BẮT BUỘC (chỉ đúng 3 phần, mỗi phần 2-3 câu):
[CURRENT] Hiện trạng shop (số liệu cụ thể, so sánh mục tiêu hoặc benchmark ngành).
[SIGNAL] Tín hiệu quan trọng nhất — rủi ro hoặc cơ hội cần phản ứng ngay.
[ACTION] Đề xuất WHO-WHAT-WHEN: ai làm gì, khi nào xong.
QUY TẮC CỨNG: Không thêm phần khác. Không blockquote. Tổng tối đa 8-10 dòng.
${ACTION_GUIDE}
${ANALYSIS_BASE}`,

  overview: `Bạn là chuyên gia phân tích kinh doanh tổng hợp của ShopFeshen. Nhiệm vụ: bức tranh toàn cảnh.
PHONG CÁCH: Báo cáo chuyên nghiệp, trực quan, dễ đọc.
CẤU TRÚC BẮT BUỘC (đúng 3 phần, mỗi tag ĐÚNG 1 LẦN):
[CURRENT] Tóm tắt toàn bộ KPI: doanh thu, đơn hàng, AOV, khách hàng, sản phẩm bán chạy, tỷ lệ chuyển đổi. Benchmark với ngành thời trang. So sánh kỳ trước nếu có (3-5 câu).
[SIGNAL] Vấn đề cần chú ý: tồn kho > 60 ngày, tỷ lệ hủy > 5%, doanh thu sụt, hoặc cơ hội mới (2-3 câu).
[ACTION] 2-3 hành động ưu tiên cao nhất dạng WHO-WHAT-WHEN (2-3 câu).
- Tổng tối đa 10-14 dòng.
${ACTION_GUIDE}
${ANALYSIS_BASE}`,
};

const STYLE_META: Record<PromptStyle, { label: string; icon: 'Zap' | 'BookOpen' | 'Compass' | 'Target' | 'TrendingUp'; color: string }> = {
  concise: { label: 'Ghi chú nhanh', icon: 'Zap', color: 'amber' },
  story: { label: 'Kể chuyện dữ liệu', icon: 'BookOpen', color: 'violet' },
  strategic: { label: 'Chiến lược', icon: 'Compass', color: 'teal' },
  focus: { label: 'Trọng tâm', icon: 'Target', color: 'rose' },
  overview: { label: 'Tổng quan', icon: 'TrendingUp', color: 'blue' },
};

const STYLE_ICONS = { Zap, BookOpen, Compass, Target, TrendingUp };

/* ═══════════ PARSE HELPERS ═══════════ */
const TAG_MAP: Record<string, LineType> = {
  '[CONTEXT]': 'context',
  '[CURRENT]': 'current',
  '[SIGNAL]': 'signal',
  '[ACTION]': 'action',
};

const KEYWORD_RULES: { pattern: RegExp; type: LineType }[] = [
  { pattern: /\b(đề xuất|chiến lược|điều chỉnh|khuyến nghị|nên triển khai|dài hạn|ngắn hạn|khuyến khích|cần làm|hành động|tiếp theo|nên làm|việc cần)\b/i, type: 'action' },
  { pattern: /\b(rủi ro|cảnh báo|lưu ý|cẩn trọng|nguy cơ|sụt giảm|đe dọa|tiềm ẩn|mất mát|suy yếu|tụt|giảm mạnh)\b/i, type: 'signal' },
  { pattern: /\b(xu hướng|thị trường|ngành|bối cảnh|mùa|trend|nhu cầu|người tiêu dùng)\b/i, type: 'context' },
  { pattern: /\b(hiện tại|đang ở|so với|mục tiêu|hiệu suất|đạt được|tỉ lệ|doanh thu)\b/i, type: 'current' },
];

/** Clean markdown artifacts and unwanted AI prefixes from a line */
function cleanLine(line: string): string {
  return line
    .replace(/^[-*]\s+/, '')
    .replace(/^#{1,4}\s*/, '')
    .replace(/^\d+\.\s*/, '')
    .replace(/^(—\s*|-?\s*)?WHO-WHAT-WHEN:\s*/i, '')
    .replace(/^(—\s*|-?\s*)?\[ACTION\]\s*/i, '')
    .trim();
}

/** Classify a single line by tag, blockquote, or keyword fallback */
function classifyLine(line: string): ParsedLine {
  if (line.startsWith('>')) {
    return { text: line.replace(/^>\s*/, '').trim(), type: 'quote' };
  }
  for (const [tag, type] of Object.entries(TAG_MAP)) {
    if (line.toUpperCase().includes(tag)) {
      let cleaned = line.replace(new RegExp(`\\[/?${tag.slice(1, -1)}\\]`, 'gi'), '');
      cleaned = cleanLine(cleaned);
      return { text: cleaned, type };
    }
  }
  const cleaned = cleanLine(line);
  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(cleaned)) return { text: cleaned, type: rule.type };
  }
  return { text: cleaned, type: 'prose' };
}

/** Auto-promote best candidate to blockquote if AI forgot */
function ensureBlockquote(lines: ParsedLine[]): ParsedLine[] {
  if (lines.length === 0 || lines.some((l) => l.type === 'quote')) return lines;
  const result = [...lines];
  const signalIdx = result.findIndex((l) => l.type === 'signal');
  if (signalIdx > -1) {
    result[signalIdx] = { ...result[signalIdx], type: 'quote' };
    return result;
  }
  let best = 0, bestCount = 0;
  result.forEach((l, i) => {
    const count = (l.text.match(/\*\*/g) || []).length;
    if (count > bestCount) { bestCount = count; best = i; }
  });
  if (bestCount > 0) result[best] = { ...result[best], type: 'quote' };
  return result;
}

/* ══════════════════════════════════════════════════════ */
/*                  SUBCOMPONENTS                        */
/* ══════════════════════════════════════════════════════ */

/* ── Loading State ── */
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-4" role="status" aria-live="polite">
      <div className="relative">
        <div className="absolute -inset-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-md opacity-30 animate-pulse" />
        <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center">
          <Brain className="w-7 h-7 text-white animate-pulse" />
        </div>
      </div>
      <div className="flex items-center gap-1 h-6" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="w-1 rounded-full bg-gradient-to-t from-indigo-500 to-purple-500" style={{ animation: `ai-wave .8s ease-in-out ${i * .1}s infinite`, height: '100%' }} />
        ))}
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">AI đang phân tích dữ liệu...</span>
        <span className="text-xs text-indigo-400 dark:text-indigo-500">Đang tổng hợp và đưa ra nhận định</span>
      </div>
    </div>
  );
}

/* ── Error State with Retry ── */
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex items-start gap-3 py-3.5 px-4 bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20 rounded-xl border border-rose-200/60 dark:border-rose-800/40">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-rose-500/20">
        <AlertCircle className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">Lỗi phân tích</p>
        <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">{error}</p>
        <button
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-100/80 dark:bg-rose-900/30 border border-rose-300/60 dark:border-rose-700/40 rounded-lg hover:bg-rose-200/80 dark:hover:bg-rose-800/40 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Thử lại
        </button>
      </div>
    </div>
  );
}

/* ── Empty State ── */
function EmptyState() {
  return (
    <div className="flex items-center gap-3 py-4 px-4 bg-white/40 dark:bg-gray-800/30 rounded-xl border border-dashed border-indigo-200/60 dark:border-indigo-800/30">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center" style={floatStyle(0)}>
        <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Nhấn <span className="font-bold text-indigo-600 dark:text-indigo-400">&quot;Phân tích ngay&quot;</span> để AI đánh giá dữ liệu
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">AI sẽ phân tích dữ liệu thực tế trên trang và đưa ra nhận định chi tiết</p>
      </div>
    </div>
  );
}

/* ── Enhanced Block Renderers ── */
function QuoteLine({ line, delay }: { line: ParsedLine; delay: string }) {
  return (
    <div className="relative mb-4" style={{ animation: `ai-fade-up .5s ease-out ${delay} both` }}>
      <blockquote className="relative p-5 bg-gradient-to-r from-violet-50/90 via-purple-50/60 to-fuchsia-50/40 dark:from-violet-900/20 dark:via-purple-900/10 dark:to-fuchsia-900/5 rounded-2xl border border-violet-100 dark:border-violet-800/30 shadow-sm hover:shadow-md hover:shadow-violet-500/5 transition-all duration-300 group/quote">
        <div className="absolute top-0 left-0 w-1.5 h-full rounded-l-2xl bg-gradient-to-b from-violet-400 via-purple-400 to-fuchsia-400" />
        
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400 ring-2 ring-white dark:ring-gray-900 shadow-sm">
            <Lightbulb className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-bold tracking-widest uppercase text-violet-600 dark:text-violet-400">
            Insight Quan Trọng
          </span>
        </div>
        
        <div className="relative pl-2">
          <Quote className="absolute -top-1 -left-1 w-6 h-6 text-violet-200 dark:text-violet-800/50 rotate-180" />
          <p className="relative text-[15px] text-slate-700 dark:text-slate-200 leading-relaxed font-medium z-10">
            {renderInline(line.text, 'font-bold text-violet-700 dark:text-violet-300')}
          </p>
        </div>
      </blockquote>
    </div>
  );
}

const SECTION_CONFIG: Record<Exclude<LineType, 'prose' | 'quote'>, {
  icon: typeof Shield; label: string; 
  bg: string; border: string; iconBg: string; iconColor: string; 
  titleColor: string; textColor: string; boldColor: string;
}> = {
  current: { 
    icon: TrendingUp, label: 'Hiện Trạng', 
    bg: 'bg-indigo-50/50 dark:bg-indigo-900/10', border: 'border-indigo-100/60 dark:border-indigo-800/30', 
    iconBg: 'bg-indigo-500', iconColor: 'text-white', 
    titleColor: 'text-indigo-600 dark:text-indigo-400', textColor: 'text-slate-600 dark:text-slate-300', boldColor: 'text-indigo-700 dark:text-indigo-300' 
  },
  signal: { 
    icon: Shield, label: 'Tín Hiệu Cảnh Báo', 
    bg: 'bg-amber-50/50 dark:bg-amber-900/10', border: 'border-amber-100/60 dark:border-amber-800/30', 
    iconBg: 'bg-amber-500', iconColor: 'text-white', 
    titleColor: 'text-amber-600 dark:text-amber-400', textColor: 'text-slate-600 dark:text-slate-300', boldColor: 'text-amber-700 dark:text-amber-400' 
  },
  action: { 
    icon: Target, label: 'Đề Xuất Hành Động', 
    bg: 'bg-emerald-50/50 dark:bg-emerald-900/10', border: 'border-emerald-100/60 dark:border-emerald-800/30', 
    iconBg: 'bg-emerald-500', iconColor: 'text-white', 
    titleColor: 'text-emerald-600 dark:text-emerald-400', textColor: 'text-slate-600 dark:text-slate-300', boldColor: 'text-emerald-700 dark:text-emerald-400' 
  },
  context: { 
    icon: BookOpen, label: 'Bối Cảnh', 
    bg: 'bg-sky-50/50 dark:bg-sky-900/10', border: 'border-sky-100/60 dark:border-sky-800/30', 
    iconBg: 'bg-sky-500', iconColor: 'text-white', 
    titleColor: 'text-sky-600 dark:text-sky-400', textColor: 'text-slate-600 dark:text-slate-300', boldColor: 'text-sky-700 dark:text-sky-400' 
  },
};

function SectionLine({ line, delay }: { line: ParsedLine; delay: string }) {
  const config = SECTION_CONFIG[line.type as keyof typeof SECTION_CONFIG];
  if (!config) return null;
  const Icon = config.icon;
  
  return (
    <div className={`relative flex items-start gap-4 mb-4 p-4 rounded-2xl ${config.bg} border ${config.border} hover:shadow-md transition-shadow duration-300`} style={{ animation: `ai-fade-up .45s ease-out ${delay} both` }}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${config.iconBg} flex items-center justify-center shadow-sm`}>
        <Icon className={`w-4 h-4 ${config.iconColor}`} />
      </div>
      <div className="flex-1 pt-0.5">
        <h4 className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${config.titleColor}`}>
          {config.label}
        </h4>
        <p className={`text-[14px] leading-relaxed ${config.textColor}`}>
          {renderInline(line.text, `font-bold ${config.boldColor}`)}
        </p>
      </div>
    </div>
  );
}

function ProseLine({ line, delay }: { line: ParsedLine; delay: string }) {
  return (
    <div className="relative flex items-start gap-3 mb-3 px-2" style={{ animation: `ai-fade-up .45s ease-out ${delay} both` }}>
      <div className="flex-shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
      <p className="text-[14px] text-slate-600 dark:text-slate-300 leading-relaxed">
        {renderInline(line.text, 'font-semibold text-slate-800 dark:text-slate-100')}
      </p>
    </div>
  );
}

/* ── Legend Footer ── */
function LegendFooter({ parsedLines, sectionCounts }: { parsedLines: ParsedLine[]; sectionCounts: Partial<Record<LineType, number>> }) {
  const legends = [
    { label: 'Bối cảnh', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-sky-200 dark:border-sky-800', type: 'context' as LineType },
    { label: 'Hiện trạng', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800', type: 'current' as LineType },
    { label: 'Tín hiệu', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800', type: 'signal' as LineType },
    { label: 'Insight', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200 dark:border-violet-800', type: 'quote' as LineType },
    { label: 'Đề xuất', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', type: 'action' as LineType },
  ];
  return (
    <div className="mx-2 mt-5 pt-4 border-t border-slate-200/50 dark:border-slate-700/30 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium">
        <span className="text-slate-500 dark:text-slate-400 mr-1">Thành phần:</span>
        {legends.filter((item) => (sectionCounts[item.type] || 0) > 0).map((item, i) => (
          <span key={i} className={`px-2 py-0.5 rounded border ${item.color}`}>
            {item.label}
          </span>
        ))}
      </div>
      <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded">
        {parsedLines.length} đoạn phân tích
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════ */
/*                  MAIN COMPONENT                       */
/* ══════════════════════════════════════════════════════ */
export default function AIInsightPanel({
  prompt,
  dataContext,
  title = 'Phân tích AI',
  className = '',
  style: defaultStyle = 'focus',
}: AIInsightPanelProps) {
  const { isAdmin } = useAuth();
  
  // Only admin can see AI insights
  if (!isAdmin) return null;

  const [activeStyle, setActiveStyle] = useState<PromptStyle>(defaultStyle);

  // Compute cache key reactively via useMemo instead of stale ref
  const currentCacheKey = useMemo(
    () => getCacheKey(prompt, dataContext, activeStyle),
    [prompt, dataContext, activeStyle]
  );

  const [insight, setInsight] = useState<string | null>(() => lruGet(currentCacheKey));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timestamp, setTimestamp] = useState<string | null>(() => {
    try { return sessionStorage.getItem(currentCacheKey + '_ts'); } catch { return null; }
  });

  const fetchInsightIdRef = useRef(0);

  // Sync state when cache key changes — with cleanup flag to avoid stale setState
  useEffect(() => {
    let cancelled = false;
    const cached = lruGet(currentCacheKey);
    if (!cancelled) {
      if (cached) {
        setInsight(cached);
        try { setTimestamp(sessionStorage.getItem(currentCacheKey + '_ts')); } catch { /* */ }
      } else {
        setInsight(null);
        setTimestamp(null);
      }
    }
    return () => { cancelled = true; };
  }, [currentCacheKey]);

  /* ═══════ COPY ═══════ */
  const handleCopy = useCallback(() => {
    if (!insight) return;
    navigator.clipboard.writeText(insight).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [insight]);

  /* ═══════ FETCH — with cancellation guard ═══════ */
  const fetchInsight = useCallback(async () => {
    const fetchId = ++fetchInsightIdRef.current;
    setLoading(true);
    setError(null);
    
    try {
      const userContent = dataContext
        ? `${prompt}\n\n--- DỮ LIỆU THỰC TẾ ---\n${dataContext}`
        : prompt;

      const res = await adminAPI.chat([
        { role: 'system', content: SYSTEM_PROMPTS[activeStyle] },
        { role: 'user', content: userContent },
      ], {
        temperature: 0.7,
        maxTokens: 800
      });
      
      if (fetchId !== fetchInsightIdRef.current) return;
      
      const message = res.data?.data?.message;
      if (message) {
        setInsight(message);
        const now = new Date().toLocaleString('vi-VN');
        setTimestamp(now);
        lruSet(currentCacheKey, message);
        try { sessionStorage.setItem(currentCacheKey + '_ts', now); } catch { /* */ }
      } else {
        setError('Không nhận được phản hồi từ AI');
      }
    } catch (err: any) {
      if (fetchId !== fetchInsightIdRef.current) return;
      console.error('AI Insight error:', err);
      setError(err?.response?.data?.message || 'Không thể kết nối đến AI. Vui lòng thử lại sau.');
    } finally {
      if (fetchId === fetchInsightIdRef.current) {
        setLoading(false);
      }
    }
  }, [activeStyle, prompt, dataContext, currentCacheKey]);

  /* ═══════ PARSE LINES (uses extracted helpers) ═══════ */
  const parsedLines = useMemo(() => {
    if (!insight) return [] as ParsedLine[];
    const maxLines = MAX_LINES[activeStyle];
    const lines = insight.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, maxLines);
    let result = ensureBlockquote(lines.map(classifyLine));
    // Lọc bỏ dòng rỗng (tag không có nội dung)
    result = result.filter((l) => l.text.trim().length > 0);
    // Bỏ qua Bối cảnh và blockquote ở tất cả style
    result = result.filter((l) => l.type !== 'context' && l.type !== 'quote');
    return result;
  }, [insight, activeStyle]);

  /* ═══════ SECTION COUNTS ═══════ */
  const sectionCounts = useMemo(() => {
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
        aria-hidden="true"
      />

      <div className="relative bg-gradient-to-br from-indigo-50/95 via-white/95 to-purple-50/95 dark:from-gray-900/95 dark:via-gray-900/95 dark:to-indigo-950/95 rounded-2xl overflow-hidden backdrop-blur-sm" style={{ animation: 'ai-pulse-glow 3s ease-in-out infinite' }}>
        {/* Floating orbs */}
        <div className="absolute top-3 right-16 w-20 h-20 bg-gradient-to-br from-purple-400/10 to-pink-400/10 dark:from-purple-400/5 dark:to-pink-400/5 rounded-full blur-xl pointer-events-none" style={floatStyle(0)} aria-hidden="true" />
        <div className="absolute bottom-2 left-10 w-16 h-16 bg-gradient-to-br from-indigo-400/10 to-cyan-400/10 dark:from-indigo-400/5 dark:to-cyan-400/5 rounded-full blur-xl pointer-events-none" style={floatStyle(1.5)} aria-hidden="true" />

        {/* Shimmer */}
        <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden" aria-hidden="true">
          <div className="absolute inset-0 opacity-20" style={shimmerStyle} />
        </div>

        {/* ── Header ── */}
        <div className="relative flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-indigo-50/50 via-white to-purple-50/50 dark:from-indigo-950/30 dark:via-gray-900 dark:to-purple-950/30 border-b border-indigo-100 dark:border-indigo-900">
          <button onClick={() => setCollapsed(!collapsed)} className="flex items-center gap-3 group/btn" aria-expanded={!collapsed} aria-label={collapsed ? 'Mở rộng bảng phân tích' : 'Thu gọn bảng phân tích'}>
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
              <span className="text-[10px] text-indigo-400/70 dark:text-indigo-500/70 font-medium tracking-wide">Powered by me</span>
            </div>
            <div className="ml-1 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
              {collapsed ? <ChevronDown className="w-3 h-3 text-indigo-500" /> : <ChevronUp className="w-3 h-3 text-indigo-500" />}
            </div>
          </button>

          <div className="flex items-center gap-2">
            {/* Style selector — button group for mobile and desktop */}
            <div className="flex bg-white/70 dark:bg-gray-800/70 border border-indigo-200/60 dark:border-indigo-700/40 rounded-lg p-0.5">
              {(Object.keys(STYLE_META) as PromptStyle[]).map((s) => {
                const isActive = activeStyle === s;
                const meta = STYLE_META[s];
                const Icon = STYLE_ICONS[meta.icon];
                return (
                  <button
                    key={s}
                    onClick={(e) => { e.stopPropagation(); setActiveStyle(s); }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                      isActive
                        ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 shadow-sm'
                        : 'text-gray-500 xl:text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20'
                    }`}
                    title={meta.label}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{meta.label}</span>
                  </button>
                );
              })}
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
              <LoadingState />
            ) : error ? (
              <ErrorState error={error} onRetry={fetchInsight} />
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
                    <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 text-[9px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100/60 dark:bg-slate-800/40 rounded-full">
                      <BarChart3 className="w-2.5 h-2.5" />
                      {insight.split(/\s+/).length} từ
                    </span>
                  </div>
                  <button
                    onClick={handleCopy}
                    aria-label="Sao chép phân tích"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 bg-white/80 dark:bg-gray-800/50 border border-slate-200/70 dark:border-slate-700/50 rounded-lg hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md hover:shadow-indigo-500/10 transition-all duration-200"
                    title="Sao chép phân tích"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                  </button>
                </div>

                {/* ── Card Block layout ── */}
                <div className="relative mx-1">
                  <div className="flex flex-col">
                    {parsedLines.map((line, idx) => {
                      const delay = `${idx * 0.08}s`;
                      if (line.type === 'quote') return <QuoteLine key={idx} line={line} delay={delay} />;
                      if (line.type === 'prose') return <ProseLine key={idx} line={line} delay={delay} />;
                      return <SectionLine key={idx} line={line} delay={delay} />;
                    })}
                  </div>
                </div>

                <LegendFooter parsedLines={parsedLines} sectionCounts={sectionCounts} />
              </div>
            ) : (
              <EmptyState />
            )}
          </div>
        )}
      </div>
    </div>
  );
}