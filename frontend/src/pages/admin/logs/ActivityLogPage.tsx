import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import AIInsightPanel from '../../../components/common/AIInsightPanel';
import {
  Activity,
  Filter,
  Clock,
  User,
  Monitor,
  Plus,
  Edit,
  Trash2,
  LogIn,
  LogOut,
  Download,
  Upload,
  Search,
  RefreshCw,
  ChevronDown,
  Shield,
  Loader2,
  Settings,
  ArrowRightLeft,
  CalendarDays,
  TrendingUp,
  Users,
  Zap,
  FileDown,
  Globe,
  Smartphone,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  Eye,
  Copy,
  Check,
  UserSearch,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { resolveApiUrl } from '../../../services/api';
import Pagination from '../../../components/common/Pagination';
import ConfirmModal from '../../../components/common/ConfirmModal';
import { useVirtualizer } from '@tanstack/react-virtual';

interface UserOption {
  id: string;
  username: string;
  full_name: string | null;
  role: string;
}

interface Log {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string | null;
  ip_address: string;
  user_agent: string;
  created_at: string;
  user?: {
    username: string;
    full_name: string;
    role: string;
  };
}

interface LogStats {
  totalToday: number;
  totalWeek: number;
  totalAll: number;
  actionDistribution: { action: string; count: number }[];
  entityDistribution: { entity_type: string; count: number }[];
  topUsers: { user_id: string; count: number; username: string; full_name: string | null; role: string | null; avatar_url: string | null }[];
}

const ACTION_MAP: Record<string, string> = {
  'Tạo': 'Tạo mới',
  'Cập nhật': 'Cập nhật',
  'Xóa': 'Xóa',
  'export': 'Xuất báo cáo',
  'import': 'Nhập dữ liệu',
  'login': 'Đăng nhập',
  'logout': 'Đăng xuất'
};

const ENTITY_MAP: Record<string, string> = {
  product: 'Sản phẩm',
  order: 'Đơn hàng',
  user: 'Người dùng',
  category: 'Danh mục',
  brand: 'Thương hiệu',
  coupon: 'Mã giảm giá',
  system: 'Hệ thống',
  settings: 'Cài đặt',
  banner: 'Banner',
  review: 'Đánh giá',
  staff: 'Nhân viên'
};

const DATE_PRESETS = [
  { label: 'Hôm nay', value: 'today' },
  { label: '7 ngày', value: '7d' },
  { label: '30 ngày', value: '30d' },
  { label: 'Tùy chỉnh', value: 'custom' },
];

// Parse user agent with memoization cache
const uaCache = new Map<string, { browser: string; os: string; icon: any }>();

const parseUserAgent = (ua: string): { browser: string; os: string; icon: any } => {
  if (!ua) return { browser: 'Unknown', os: '', icon: Globe };
  if (uaCache.has(ua)) return uaCache.get(ua)!;

  let browser = 'Trình duyệt';
  let os = '';

  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';

  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  const icon = (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) ? Smartphone : Monitor;
  const result = { browser, os, icon };
  uaCache.set(ua, result);
  return result;
};

export default function ActivityLogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialAction = searchParams.get('action') || '';
  const initialEntity = searchParams.get('entity_type') || '';
  const initialRole = searchParams.get('role') || '';
  const initialUser = searchParams.get('user_id') || '';
  const initialDatePreset = searchParams.get('date_preset') || '';
  const initialDateFrom = searchParams.get('start_date') || '';
  const initialDateTo = searchParams.get('end_date') || '';
  const initialSearch = searchParams.get('search') || '';
  const initialPage = Math.max(1, Number(searchParams.get('page') || 1) || 1);

  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [actionFilter, setActionFilter] = useState(initialAction);
  const [entityFilter, setEntityFilter] = useState(initialEntity);
  const [roleFilter, setRoleFilter] = useState(initialRole);
  const [userFilter, setUserFilter] = useState(initialUser);
  const [usersList, setUsersList] = useState<UserOption[]>([]);
  const [datePreset, setDatePreset] = useState(initialDatePreset);
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(() => localStorage.getItem('logAutoRefresh') === 'true');
  const [exporting, setExporting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Selection & Deletion State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, isBulk: boolean, idToDelete: string | null}>({
    isOpen: false,
    isBulk: false,
    idToDelete: null
  });

  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Calculate date range from preset
  const getDateRange = useCallback(() => {
    const now = new Date();
    let startDate = dateFrom;
    let endDate = dateTo;

    if (datePreset === 'today') {
      startDate = now.toISOString().split('T')[0];
      endDate = '';
    } else if (datePreset === '7d') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      startDate = d.toISOString().split('T')[0];
      endDate = '';
    } else if (datePreset === '30d') {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      startDate = d.toISOString().split('T')[0];
      endDate = '';
    }

    return { startDate, endDate };
  }, [datePreset, dateFrom, dateTo]);

  const fetchLogs = useCallback(async () => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entity_type = entityFilter;
      if (roleFilter) params.role = roleFilter;
      if (userFilter) params.user_id = userFilter;
      if (searchQuery) params.search = searchQuery;
      params.page = page.toString();
      params.limit = '20';

      const { startDate, endDate } = getDateRange();
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await fetch(resolveApiUrl(`/api/admin/logs?${new URLSearchParams(params)}`), {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        signal: abortController.signal
      });

      const data = await res.json();
      if (data.success) {
        setLogs(data.data.logs);
        if (data.data.pagination) {
          setTotalPages(data.data.pagination.totalPages);
          setTotalLogs(data.data.pagination.total || 0);
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return; // Ignore cancelled requests
      toast.error('Không thể tải nhật ký');
    } finally {
      if (abortControllerRef.current === abortController) {
        setLoading(false);
      }
    }
  }, [actionFilter, entityFilter, roleFilter, userFilter, searchQuery, page, getDateRange]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await fetch(resolveApiUrl('/api/admin/logs/stats'), {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Export CSV
  const handleExport = async () => {
    try {
      setExporting(true);
      const params: Record<string, string> = {};
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entity_type = entityFilter;
      if (roleFilter) params.role = roleFilter;
      if (userFilter) params.user_id = userFilter;
      if (searchQuery) params.search = searchQuery;

      const { startDate, endDate } = getDateRange();
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await fetch(resolveApiUrl(`/api/admin/logs/export?${new URLSearchParams(params)}`), {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity_logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('Xuất nhật ký thành công');
    } catch (error) {
      toast.error('Không thể xuất nhật ký');
    } finally {
      setExporting(false);
    }
  };

  // --- Deletion Handlers ---
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      if (deleteModal.isBulk) {
        if (selectedIds.size === 0) return;
        const res = await fetch(resolveApiUrl('/api/admin/logs/bulk-delete'), {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}` 
          },
          body: JSON.stringify({ ids: Array.from(selectedIds) })
        });
        const data = await res.json();
        if (data.success) {
          toast.success(data.message || 'Xóa thành công');
          setSelectedIds(new Set());
          fetchLogs();
          fetchStats();
        } else {
          toast.error(data.message || 'Xóa thất bại');
        }
      } else {
        if (!deleteModal.idToDelete) return;
        const res = await fetch(resolveApiUrl(`/api/admin/logs/${deleteModal.idToDelete}`), {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        if (data.success) {
          toast.success('Xóa nhật ký thành công');
          setSelectedIds(prev => {
            const next = new Set(prev);
            next.delete(deleteModal.idToDelete!);
            return next;
          });
          fetchLogs();
          fetchStats();
        } else {
          toast.error(data.message || 'Xóa thất bại');
        }
      }
    } catch (err) {
      toast.error('Có lỗi xảy ra khi xóa');
    } finally {
      setIsDeleting(false);
      setDeleteModal({ isOpen: false, isBulk: false, idToDelete: null });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === logs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(logs.map(log => log.id)));
    }
  };

  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, actionFilter, entityFilter, roleFilter, userFilter, datePreset, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchLogs(); }, 300);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Fetch users list
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(resolveApiUrl('/api/admin/users?limit=200'), {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        if (data.success && data.data) {
          const users = Array.isArray(data.data) ? data.data : (data.data.users || []);
          setUsersList(users.map((u: any) => ({
            id: u.id?.toString(),
            username: u.username,
            full_name: u.full_name,
            role: u.role
          })));
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
      }
    };
    fetchUsers();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshRef.current = setInterval(() => { fetchLogs(); }, 30000);
    } else if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current);
    }
    return () => { if (autoRefreshRef.current) clearInterval(autoRefreshRef.current); };
  }, [autoRefresh, fetchLogs]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'r' && !e.ctrlKey && !e.metaKey && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLSelectElement)) {
        fetchLogs();
        fetchStats();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [fetchLogs, fetchStats]);

  // URL sync
  useEffect(() => {
    const next = new URLSearchParams();
    if (actionFilter) next.set('action', actionFilter);
    if (entityFilter) next.set('entity_type', entityFilter);
    if (roleFilter) next.set('role', roleFilter);
    if (userFilter) next.set('user_id', userFilter);
    if (datePreset) next.set('date_preset', datePreset);
    if (dateFrom) next.set('start_date', dateFrom);
    if (dateTo) next.set('end_date', dateTo);
    if (searchQuery) next.set('search', searchQuery);
    if (page > 1) next.set('page', String(page));
    if (next.toString() === searchParams.toString()) return;
    setSearchParams(next, { replace: true });
  }, [actionFilter, entityFilter, roleFilter, userFilter, datePreset, dateFrom, dateTo, searchQuery, page, searchParams, setSearchParams]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // --- Helpers ---
  const getActionIcon = (action: string) => {
    if (action.includes('Tạo') || action.includes('create')) return <Plus className="w-4 h-4" />;
    if (action.includes('Cập nhật') || action.includes('update')) return <Edit className="w-4 h-4" />;
    if (action.includes('Xóa') || action.includes('delete')) return <Trash2 className="w-4 h-4" />;
    if (action.includes('login') || action.includes('Đăng nhập')) return <LogIn className="w-4 h-4" />;
    if (action.includes('logout') || action.includes('Đăng xuất')) return <LogOut className="w-4 h-4" />;
    if (action.includes('export') || action.includes('Xuất')) return <Download className="w-4 h-4" />;
    if (action.includes('import') || action.includes('Nhập')) return <Upload className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('Tạo') || action.includes('create')) return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
    if (action.includes('Cập nhật') || action.includes('update')) return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
    if (action.includes('Xóa') || action.includes('delete')) return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
    if (action.includes('login') || action.includes('logout') || action.includes('Đăng nhập') || action.includes('Đăng xuất')) return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30';
    if (action.includes('export') || action.includes('import') || action.includes('Xuất') || action.includes('Nhập')) return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30';
    return 'text-secondary-600 bg-secondary-100 dark:text-secondary-400 dark:bg-secondary-700';
  };

  const getTimelineDotColor = (action: string) => {
    if (action.includes('Tạo') || action.includes('create')) return 'bg-green-500';
    if (action.includes('Cập nhật') || action.includes('update')) return 'bg-blue-500';
    if (action.includes('Xóa') || action.includes('delete')) return 'bg-red-500';
    if (action.includes('login') || action.includes('logout') || action.includes('Đăng nhập') || action.includes('Đăng xuất')) return 'bg-purple-500';
    return 'bg-secondary-400';
  };

  const getRoleBadge = (role?: string) => {
    if (!role) return null;
    const styles: Record<string, string> = {
      admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      staff: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      manager: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    };
    const labels: Record<string, string> = {
      admin: 'Admin',
      staff: 'Nhân viên',
      manager: 'Quản lý',
    };
    return (
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${styles[role] || 'bg-secondary-100 text-secondary-600 dark:bg-secondary-700 dark:text-secondary-300'}`}>
        {labels[role] || role}
      </span>
    );
  };

  const formatAction = (action: string) => {
    if (ACTION_MAP[action]) return ACTION_MAP[action];
    if (action.includes('Tạo')) return action;
    if (action.includes('Cập nhật')) return action;
    if (action.includes('Xóa')) return action;
    if (action.includes('export')) return 'Xuất báo cáo';
    if (action.includes('import')) return 'Nhập dữ liệu';
    return action;
  };

  const formatEntity = (entity: string) => {
    return ENTITY_MAP[entity?.toLowerCase()] || entity;
  };

  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHour < 24) return `${diffHour} giờ trước`;
    if (diffDay < 7) return `${diffDay} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  // --- Group logs by date ---
  const groupLogsByDate = useCallback((logsArray: Log[]) => {
    const groups: { date: string; label: string; logs: Log[] }[] = [];
    const today = new Date().toLocaleDateString('vi-VN');
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('vi-VN');

    logsArray.forEach(log => {
      const dateStr = new Date(log.created_at).toLocaleDateString('vi-VN');
      let label = dateStr;
      if (dateStr === today) label = 'Hôm nay';
      else if (dateStr === yesterday) label = 'Hôm qua';

      const existing = groups.find(g => g.date === dateStr);
      if (existing) {
        existing.logs.push(log);
      } else {
        groups.push({ date: dateStr, label, logs: [log] });
      }
    });

    return groups;
  }, []);

  // --- Recursive Value Renderer for deep objects/arrays ---
  const renderValue = (val: any, depth: number = 0): JSX.Element => {
    if (val === null || val === undefined) return <span className="text-secondary-400 italic">null</span>;
    if (typeof val === 'boolean') return <span className={val ? 'text-green-600' : 'text-red-500'}>{val ? 'true' : 'false'}</span>;
    if (typeof val === 'number') return <span className="text-blue-600 dark:text-blue-400">{val.toLocaleString('vi-VN')}</span>;
    if (typeof val === 'string') {
      if (val.length > 200) return <span className="break-all">{val.slice(0, 200)}…</span>;
      return <span>{val}</span>;
    }
    if (Array.isArray(val)) {
      if (val.length === 0) return <span className="text-secondary-400 italic">[ ]</span>;
      return (
        <div className={`${depth > 0 ? 'ml-3 pl-2 border-l-2 border-secondary-200 dark:border-secondary-700' : ''}`}>
          {val.map((item, i) => (
            <div key={i} className="flex items-start gap-1 py-0.5">
              <span className="text-secondary-400 select-none text-[10px] mt-0.5">{i}:</span>
              {renderValue(item, depth + 1)}
            </div>
          ))}
        </div>
      );
    }
    if (typeof val === 'object') {
      const entries = Object.entries(val);
      if (entries.length === 0) return <span className="text-secondary-400 italic">{'{ }'}</span>;
      return (
        <div className={`${depth > 0 ? 'ml-3 pl-2 border-l-2 border-secondary-200 dark:border-secondary-700' : ''}`}>
          {entries.map(([k, v]) => (
            <div key={k} className="flex items-start gap-1 py-0.5">
              <span className="text-secondary-500 dark:text-secondary-400 font-medium text-[10px] shrink-0">{k}:</span>
              <div className="min-w-0">{renderValue(v, depth + 1)}</div>
            </div>
          ))}
        </div>
      );
    }
    return <span>{String(val)}</span>;
  };

  // --- Copy Log to Clipboard ---
  const copyLog = async (log: Log) => {
    const lines: string[] = [
      `📝 Nhật ký #${log.id}`,
      `Hành động: ${formatAction(log.action)}`,
      `Đối tượng: ${formatEntity(log.entity_type)} ${log.entity_id ? '#' + log.entity_id : ''}`,
      `Người thực hiện: ${log.user?.full_name || log.user?.username || 'System'} (${log.user?.role || 'N/A'})`,
      `Thời gian: ${new Date(log.created_at).toLocaleString('vi-VN')}`,
      `IP: ${log.ip_address || 'N/A'}`,
    ];
    if (log.details) {
      try {
        const parsed = JSON.parse(log.details);
        lines.push(`Chi tiết: ${JSON.stringify(parsed, null, 2)}`);
      } catch {
        lines.push(`Chi tiết: ${log.details}`);
      }
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedId(log.id);
      toast.success('Đã sao chép nhật ký');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Không thể sao chép');
    }
  };

  // --- Render Details ---
  const renderDetails = (log: Log) => {
    if (!log.details) return null;
    const isExpanded = expandedIds.has(log.id);

    try {
      const parsed = JSON.parse(log.details);

      if (parsed.diff && Object.keys(parsed.diff).length > 0) {
        return (
          <div className="mt-3">
            <button
              onClick={() => toggleExpand(log.id)}
              className="flex items-center gap-1.5 text-xs font-medium text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200 transition-colors"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
              <ArrowRightLeft className="w-3 h-3" />
              {Object.keys(parsed.diff).length} thay đổi
            </button>
            {isExpanded && (
              <div className="mt-2 rounded-lg border border-secondary-200 dark:border-secondary-700 overflow-hidden animate-fadeIn">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-secondary-50 dark:bg-secondary-900">
                      <th className="px-3 py-2 text-left font-semibold text-secondary-500 dark:text-secondary-400 w-1/4">Trường</th>
                      <th className="px-3 py-2 text-left font-semibold text-red-500 dark:text-red-400 w-[37.5%]">Giá trị cũ</th>
                      <th className="px-3 py-2 text-left font-semibold text-green-600 dark:text-green-400 w-[37.5%]">Giá trị mới</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-100 dark:divide-secondary-700">
                    {Object.entries(parsed.diff).map(([field, change]: [string, any]) => (
                      <tr key={field} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors">
                        <td className="px-3 py-2 font-medium text-secondary-700 dark:text-secondary-300">{field}</td>
                        <td className="px-3 py-2 text-red-600 dark:text-red-400 break-all">
                          <div className="bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded line-through">
                            {renderValue(change.from)}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-green-600 dark:text-green-400 break-all">
                          <div className="bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded font-medium">
                            {renderValue(change.to)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      }

      return (
        <div className="mt-3">
          <button
            onClick={() => toggleExpand(log.id)}
            className="flex items-center gap-1.5 text-xs font-medium text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200 transition-colors"
          >
            <Eye className={`w-3 h-3`} />
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            Xem chi tiết
          </button>
          {isExpanded && (
            <div className="mt-2 p-3 bg-secondary-50 dark:bg-secondary-900/50 border border-secondary-200 dark:border-secondary-700 rounded-lg text-xs animate-fadeIn overflow-x-auto">
               {renderValue(parsed)}
            </div>
          )}
        </div>
      );
    } catch {
      if (!log.details) return null;
      return (
        <div className="mt-3">
          <button
            onClick={() => toggleExpand(log.id)}
            className="flex items-center gap-1.5 text-xs font-medium text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200 transition-colors"
          >
            <Eye className="w-3 h-3" />
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            Xem chi tiết
          </button>
          {isExpanded && (
            <div className="mt-2 p-3 bg-secondary-50 dark:bg-secondary-900 rounded-lg text-xs font-mono break-all text-secondary-600 dark:text-secondary-400 animate-fadeIn">
              {log.details}
            </div>
          )}
        </div>
      );
    }
  };

  const logGroups = useMemo(() => groupLogsByDate(logs), [logs, groupLogsByDate]);
  const parentRef = useRef<HTMLDivElement>(null);

  // Flatten the groups for virtualization while keeping track of headers vs items
  const flatItems = useMemo(() => {
    const items: { type: 'header' | 'log', data: any, id: string }[] = [];
    logGroups.forEach(group => {
      items.push({ type: 'header', data: group, id: `header-${group.date}` });
      group.logs.forEach(log => {
        items.push({ type: 'log', data: log, id: `log-${log.id}` });
      });
    });
    return items;
  }, [logGroups]);

  const virtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback((index: number) => {
      const item = flatItems[index];
      if (item.type === 'header') return 45; // specific header height
      
      const log = item.data;
      if (expandedIds.has(log.id)) {
        return 300; // estimated expanded height
      }
      return 100; // estimated collapsed height
    }, [flatItems, expandedIds]),
    overscan: 5,
  });

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary-600" />
            Nhật ký Hoạt động
          </h1>
          <p className="text-secondary-500 dark:text-secondary-400 text-sm mt-1">
            Theo dõi tất cả các thay đổi trong hệ thống · Nhấn <kbd className="px-1.5 py-0.5 bg-secondary-100 dark:bg-secondary-700 rounded text-[10px] font-mono font-bold">R</kbd> để làm mới
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto-refresh toggle */}
          <button
            onClick={() => { const next = !autoRefresh; setAutoRefresh(next); localStorage.setItem('logAutoRefresh', String(next)); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
              autoRefresh 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' 
                : 'bg-white dark:bg-secondary-800 border-secondary-200 dark:border-secondary-700 text-secondary-600 dark:text-secondary-400'
            }`}
            title={autoRefresh ? 'Tự động làm mới: BẬT (30s)' : 'Tự động làm mới: TẮT'}
          >
            {autoRefresh ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            <span className="hidden sm:inline">Auto</span>
          </button>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg text-secondary-700 dark:text-secondary-300 text-sm font-medium hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            Xuất CSV
          </button>
          <button
            onClick={() => { fetchLogs(); fetchStats(); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Grid Layout: Left Column (Stats & Filters) + Right Column (Logs) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* LEFT COLUMN: Controls & Stats */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Filters Panel */}
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 overflow-hidden">
            <div className="p-4 bg-secondary-50 dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-700">
              <h2 className="text-sm font-bold text-secondary-900 dark:text-white flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Bộ lọc tìm kiếm
              </h2>
            </div>
            <div className="p-4 flex flex-col gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm ID, tên, mã..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-sm text-secondary-900 dark:text-white placeholder-secondary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
              </div>

              {/* Date Preset */}
              <div className="grid grid-cols-2 gap-2">
                {DATE_PRESETS.map(preset => (
                  <button
                    key={preset.value}
                    onClick={() => {
                      setDatePreset(prev => prev === preset.value ? '' : preset.value);
                      if (preset.value !== 'custom') {
                        setDateFrom('');
                        setDateTo('');
                      }
                      setPage(1);
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all text-center border ${
                      datePreset === preset.value
                        ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/40 dark:border-primary-500 dark:text-primary-300'
                        : 'bg-secondary-50 border-transparent text-secondary-600 dark:bg-secondary-800 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Range */}
              {datePreset === 'custom' && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                    className="w-full px-2 py-1.5 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-xs text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-colors"
                  />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                    className="w-full px-2 py-1.5 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-xs text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-colors"
                  />
                </div>
              )}

              {/* Action Filter */}
              <div className="relative">
                <select
                  value={actionFilter}
                  onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                  className="w-full pl-3 pr-8 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-sm text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer transition-colors"
                >
                  <option value="">Tất cả thao tác</option>
                  <option value="Tạo">Tạo mới</option>
                  <option value="Cập nhật">Cập nhật</option>
                  <option value="Xóa">Xóa</option>
                  <option value="export">Xuất báo cáo</option>
                  <option value="login">Đăng nhập</option>
                  <option value="logout">Đăng xuất</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
              </div>

              {/* Entity Filter */}
              <div className="relative">
                <select
                  value={entityFilter}
                  onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
                  className="w-full pl-3 pr-8 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-sm text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer transition-colors"
                >
                  <option value="">Tất cả đối tượng</option>
                  <option value="product">Sản phẩm</option>
                  <option value="order">Đơn hàng</option>
                  <option value="user">Người dùng</option>
                  <option value="category">Danh mục</option>
                  <option value="coupon">Mã giảm giá</option>
                  <option value="banner">Banner</option>
                  <option value="settings">Cài đặt</option>
                  <option value="brand">Thương hiệu</option>
                  <option value="review">Đánh giá</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
              </div>

              {/* Role Filter */}
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                  className="w-full pl-3 pr-8 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-sm text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer transition-colors"
                >
                  <option value="">Tất cả vai trò</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Quản lý</option>
                  <option value="staff">Nhân viên</option>
                  <option value="customer">Khách hàng</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400 pointer-events-none" />
              </div>

              {/* Active Filters Summary */}
              {(actionFilter || entityFilter || roleFilter || userFilter || datePreset || searchQuery) && (
                <div className="pt-3 border-t border-secondary-100 dark:border-secondary-800 flex flex-wrap gap-2">
                  {actionFilter && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs font-medium border border-primary-200 dark:border-primary-800">
                      {ACTION_MAP[actionFilter] || actionFilter}
                      <button onClick={() => { setActionFilter(''); setPage(1); }} className="hover:text-primary-900 dark:hover:text-white"><X className="w-3 h-3"/></button>
                    </span>
                  )}
                  {entityFilter && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 text-xs font-medium border border-secondary-200 dark:border-secondary-700">
                      {ENTITY_MAP[entityFilter] || entityFilter}
                      <button onClick={() => { setEntityFilter(''); setPage(1); }} className="hover:text-secondary-900 dark:hover:text-white"><X className="w-3 h-3"/></button>
                    </span>
                  )}
                  {roleFilter && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 text-xs font-medium border border-secondary-200 dark:border-secondary-700">
                      {roleFilter}
                      <button onClick={() => { setRoleFilter(''); setPage(1); }} className="hover:text-secondary-900 dark:hover:text-white"><X className="w-3 h-3"/></button>
                    </span>
                  )}
                  {datePreset && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 text-xs font-medium border border-secondary-200 dark:border-secondary-700">
                      {DATE_PRESETS.find(p => p.value === datePreset)?.label || datePreset}
                      <button onClick={() => { setDatePreset(''); setDateFrom(''); setDateTo(''); setPage(1); }} className="hover:text-secondary-900 dark:hover:text-white"><X className="w-3 h-3"/></button>
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setActionFilter('');
                      setEntityFilter('');
                      setRoleFilter('');
                      setUserFilter('');
                      setDatePreset('');
                      setDateFrom('');
                      setDateTo('');
                      setSearchQuery('');
                      setPage(1);
                    }}
                    className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300 font-medium ml-1"
                  >
                    Xóa tất cả
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Column */}
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 overflow-hidden">
             <div className="p-4 bg-secondary-50 dark:bg-secondary-900 border-b border-secondary-200 dark:border-secondary-700">
               <h2 className="text-sm font-bold text-secondary-900 dark:text-white flex items-center gap-2">
                 <TrendingUp className="w-4 h-4" />
                 Thống kê nhanh
               </h2>
             </div>
             <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-secondary-500 dark:text-secondary-400 text-sm">Hôm nay</span>
                  <span className="text-secondary-900 dark:text-white font-bold">{statsLoading ? '...' : stats?.totalToday ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-secondary-500 dark:text-secondary-400 text-sm">7 ngày qua</span>
                  <span className="text-secondary-900 dark:text-white font-bold">{statsLoading ? '...' : stats?.totalWeek ?? 0}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-secondary-100 dark:border-secondary-700">
                  <span className="text-secondary-500 dark:text-secondary-400 text-sm">Tổng lưu trữ</span>
                  <span className="text-primary-600 dark:text-primary-400 font-bold">{statsLoading ? '...' : stats?.totalAll?.toLocaleString('vi-VN') ?? 0}</span>
                </div>
                
                {stats?.topUsers?.[0] && !statsLoading && (
                  <div className="pt-3 border-t border-secondary-100 dark:border-secondary-700">
                     <span className="text-secondary-500 dark:text-secondary-400 text-sm block mb-1">NV sôi nổi nhất</span>
                     <div className="flex justify-between items-center text-sm">
                       <span className="font-medium text-secondary-900 dark:text-white truncate max-w-[120px]" title={stats.topUsers[0].full_name || stats.topUsers[0].username}>
                         {stats.topUsers[0].full_name || stats.topUsers[0].username}
                       </span>
                       <span className="text-secondary-400">{stats.topUsers[0].count} log</span>
                     </div>
                  </div>
                )}
             </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Logs View */}
        <div className="lg:col-span-3 space-y-4">

      {/* AI Insight */}
      <AIInsightPanel
        title="AI Phân tích hoạt động"
        prompt="Phân tích nhật ký hoạt động hệ thống. Phát hiện hành vi bất thường, đánh giá tần suất thao tác, và đề xuất cải thiện quy trình vận hành."
        dataContext={(() => {
          const lines: string[] = [`Tổng lượt hoạt động: ${totalLogs}`];
          if (stats) {
            lines.push(`Hoạt động hôm nay: ${stats.totalToday}, tuần này: ${stats.totalWeek}, tổng cộng: ${stats.totalAll}`);
            if (stats.actionDistribution.length > 0) {
              lines.push(`Phân bổ hành động: ${stats.actionDistribution.map(a => `${a.action}: ${a.count}`).join(', ')}`);
            }
            if (stats.topUsers.length > 0) {
              lines.push(`Top người dùng: ${stats.topUsers.map(u => `${u.full_name || u.username}: ${u.count} lần`).join(', ')}`);
            }
          }
          if (logs.length > 0) {
            lines.push(`Hoạt động gần nhất: ${logs.slice(0, 3).map((l: any) => `${l.action} - ${l.entity_type || ''} (${new Date(l.created_at).toLocaleString('vi-VN')})`).join('; ')}`);
          }
          return lines.join('\n');
        })()}
      />

      {/* Timeline Log List */}
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-3" />
            <p className="text-sm text-secondary-500 dark:text-secondary-400">Đang tải nhật ký...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <Activity className="w-12 h-12 mx-auto text-secondary-300 dark:text-secondary-600 mb-4" />
            <p className="text-secondary-500 dark:text-secondary-400 font-medium">Chưa có nhật ký nào</p>
            <p className="text-secondary-400 dark:text-secondary-500 text-sm mt-1">
              {(actionFilter || entityFilter || datePreset || searchQuery) ? 'Thử thay đổi bộ lọc' : 'Các hoạt động sẽ hiển thị ở đây'}
            </p>
          </div>
        ) : (
          <>
            {/* Header bar */}
            <div className="px-4 py-3 bg-secondary-50 dark:bg-secondary-900/50 border-b border-secondary-200 dark:border-secondary-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={logs.length > 0 && selectedIds.size === logs.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                  {totalLogs > 0 ? `${totalLogs.toLocaleString('vi-VN')} bản ghi` : `${logs.length} bản ghi`}
                </span>
                
                {selectedIds.size > 0 && (
                  <button
                    onClick={() => setDeleteModal({ isOpen: true, isBulk: true, idToDelete: null })}
                    className="flex items-center gap-1.5 px-2 py-1 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors animate-fadeIn"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Xóa {selectedIds.size} mục
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {autoRefresh && (
                  <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Tự động cập nhật
                  </span>
                )}
                <span className="text-xs text-secondary-400 dark:text-secondary-500">
                  Trang {page}/{Math.max(1, totalPages)}
                </span>
              </div>
            </div>

            <div 
              ref={parentRef}
              className="overflow-auto pr-2 custom-scrollbar"
              style={{ height: '70vh', minHeight: '600px' }}
            >
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {virtualizer.getVirtualItems().map((virtualItem) => {
                  const item = flatItems[virtualItem.index];

                  if (item.type === 'header') {
                    const group = item.data;
                    return (
                      <div
                        key={virtualItem.key}
                        data-index={virtualItem.index}
                        ref={virtualizer.measureElement}
                        className="absolute top-0 left-0 w-full"
                        style={{
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                      >
                        <div className="sticky top-0 z-10 px-4 py-2.5 bg-secondary-50/95 dark:bg-secondary-900/95 backdrop-blur-md border-y border-secondary-200 dark:border-secondary-700">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-primary-500" />
                            <span className="text-xs font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-wider">{group.label}</span>
                            <span className="text-[10px] text-secondary-400 dark:text-secondary-500 font-medium">{group.date !== group.label ? `· ${group.date}` : ''}</span>
                            <span className="ml-auto text-[10px] bg-white dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 px-2 py-0.5 rounded-full font-medium shadow-sm border border-secondary-100 dark:border-secondary-700">
                              {group.logs.length} hoạt động
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Render Log Item
                  const log = item.data;
                  return (
                      <div
                        key={virtualItem.key}
                        data-index={virtualItem.index}
                        ref={virtualizer.measureElement}
                        className="absolute top-0 left-0 w-full"
                        style={{
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                      >
                         <div className="relative p-4 pl-12 hover:bg-secondary-50/50 dark:hover:bg-secondary-900/30 transition-colors group border-b border-secondary-100 dark:border-secondary-800/50">
                            {/* Vertical line connecting dots */}
                            <div className="absolute left-[24px] top-0 bottom-0 w-px bg-secondary-200 dark:bg-secondary-700" />
                            {/* Timeline dot */}
                            <div className={`absolute left-[20px] top-6 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-secondary-800 ${getTimelineDotColor(log.action)} z-[1]`} />
                            
                            <div className="min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold shadow-sm border border-transparent dark:border-secondary-700/50 ${getActionColor(log.action)}`}>
                                        {getActionIcon(log.action)}
                                        {formatAction(log.action)}
                                      </span>
                                      {log.entity_type && (
                                        <span className="text-sm font-medium text-secondary-900 dark:text-secondary-200">
                                          {formatEntity(log.entity_type)}
                                        </span>
                                      )}
                                      {log.entity_id && (
                                        <span className="text-[10px] font-mono text-secondary-500 dark:text-secondary-400 bg-secondary-100 dark:bg-secondary-800 px-1.5 py-0.5 rounded border border-secondary-200 dark:border-secondary-700">
                                          #{log.entity_id.length > 8 ? log.entity_id.slice(0, 8) : log.entity_id}
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                      <span className="flex items-center gap-1 text-xs text-secondary-600 dark:text-secondary-400 font-medium">
                                        <User className="w-3.5 h-3.5" />
                                        {log.user?.full_name || log.user?.username || 'System'}
                                      </span>
                                      {log.user?.role && getRoleBadge(log.user.role)}
                                      <span className="flex items-center gap-1 text-xs text-secondary-400 dark:text-secondary-500" title={new Date(log.created_at).toLocaleString('vi-VN')}>
                                        <Clock className="w-3.5 h-3.5" />
                                        {formatRelativeTime(log.created_at)}
                                      </span>
                                      {log.user_agent && (() => {
                                        const ua = parseUserAgent(log.user_agent);
                                        const UAIcon = ua.icon;
                                        return (
                                          <span className="flex items-center gap-1 text-[10px] text-secondary-400 dark:text-secondary-500 bg-secondary-50 dark:bg-secondary-900/50 px-1.5 py-0.5 rounded" title={log.user_agent}>
                                            <UAIcon className="w-3 h-3" />
                                            {ua.browser} {ua.os && `· ${ua.os}`}
                                          </span>
                                        );
                                      })()}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 shrink-0">
                                    <input
                                      type="checkbox"
                                      checked={selectedIds.has(log.id)}
                                      onChange={() => toggleSelect(log.id)}
                                      className="w-4 h-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                    />
                                    <button
                                      onClick={() => copyLog(log)}
                                      className="hidden lg:flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-secondary-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 dark:hover:text-primary-400 opacity-0 group-hover:opacity-100 transition-all"
                                      title="Sao chép nhật ký"
                                    >
                                      {copiedId === log.id ? (
                                        <Check className="w-3 h-3 text-green-500" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() =>
                                        setDeleteModal({
                                          isOpen: true,
                                          isBulk: false,
                                          idToDelete: log.id,
                                        })
                                      }
                                      className="hidden lg:flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-secondary-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                      title="Xóa nhật ký"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                    <span className="hidden lg:block text-[10px] text-secondary-400 dark:text-secondary-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                                      {new Date(log.created_at).toLocaleTimeString(
                                        "vi-VN",
                                      )}
                                    </span>
                                  </div>
                                </div>

                                {/* Details */}
                                {renderDetails(log)}
                              </div>
                            </div>
                        </div>
                    );
                  })}
                </div>
              </div>

              {/* Pagination */}
              {!loading && totalPages > 0 && (
                <div className="px-4 py-3 border-t border-secondary-200 dark:border-secondary-700 flex flex-col sm:flex-row items-center justify-between gap-4 sm:px-6 bg-white dark:bg-secondary-800 transition-colors">
                  <div className="text-sm text-secondary-500 dark:text-secondary-400">
                    Hiển thị trang <span className="font-medium text-secondary-900 dark:text-white">{page}</span> trên <span className="font-medium text-secondary-900 dark:text-white">{totalPages}</span>
                  </div>
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}

            </>
          )}
        </div>
      </div>
    </div>

    <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, isBulk: false, idToDelete: null })}
        onConfirm={handleDelete}
        title={deleteModal.isBulk ? "Xác nhận xóa hàng loạt" : "Xác nhận xóa nhật ký"}
        message={deleteModal.isBulk 
          ? `Bạn có chắc chắn muốn xóa ${selectedIds.size} nhật ký đã chọn? Hành động này không thể hoàn tác.` 
          : "Bạn có chắc chắn muốn xóa nhật ký này? Hành động này không thể hoàn tác."}
        confirmText="Xóa nhật ký"
        cancelText="Hủy"
        isDestructive={true}
      />
    </>
  );
}
