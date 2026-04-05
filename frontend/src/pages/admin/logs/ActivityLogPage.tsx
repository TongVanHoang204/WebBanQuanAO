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
  X,
  RotateCcw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../../../services/api';
import Pagination from '../../../components/common/Pagination';
import ConfirmModal from '../../../components/common/ConfirmModal';

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
  is_rolled_back?: boolean;
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

const LogSkeleton = () => (
  <div className="space-y-3 p-4">
    {Array.from({ length: 7 }).map((_, index) => (
      <div key={index} className="rounded-xl border border-secondary-100 bg-white p-4 dark:border-secondary-700 dark:bg-secondary-800">
        <div className="mb-3 h-5 w-40 animate-pulse rounded bg-secondary-100 dark:bg-secondary-700" />
        <div className="mb-2 h-4 w-64 animate-pulse rounded bg-secondary-100 dark:bg-secondary-700" />
        <div className="flex gap-2">
          <div className="h-3 w-24 animate-pulse rounded bg-secondary-100 dark:bg-secondary-700" />
          <div className="h-3 w-28 animate-pulse rounded bg-secondary-100 dark:bg-secondary-700" />
          <div className="h-3 w-20 animate-pulse rounded bg-secondary-100 dark:bg-secondary-700" />
        </div>
      </div>
    ))}
  </div>
);

const isRequestCanceled = (error: any) =>
  error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError';

const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.error?.message || error?.response?.data?.message || fallback;

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
  const [deleteOldModalOpen, setDeleteOldModalOpen] = useState(false);
  const [deletingOld, setDeletingOld] = useState(false);

  // Rollback state
  const [rollbackModal, setRollbackModal] = useState<{ isOpen: boolean; logId: string | null; action: string }>({ isOpen: false, logId: null, action: '' });
  const [rollbackingIds, setRollbackingIds] = useState<Set<string>>(new Set());

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

  const buildLogParams = useCallback(
    (includePagination = false) => {
      const params: {
        page?: number;
        limit?: number;
        action?: string;
        entity_type?: string;
        role?: string;
        user_id?: string;
        search?: string;
        start_date?: string;
        end_date?: string;
      } = {};

      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entity_type = entityFilter;
      if (roleFilter) params.role = roleFilter;
      if (userFilter) params.user_id = userFilter;
      if (searchQuery) params.search = searchQuery;

      if (includePagination) {
        params.page = page;
        params.limit = 20;
      }

      const { startDate, endDate } = getDateRange();
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      return params;
    },
    [actionFilter, entityFilter, roleFilter, userFilter, searchQuery, page, getDateRange]
  );

  const fetchLogs = useCallback(async () => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setLoading(true);
      const response = await adminAPI.getLogs(buildLogParams(true), abortController.signal);
      const payload = response.data?.data;

      if (payload) {
        setLogs(payload.logs || []);
        if (payload.pagination) {
          setTotalPages(payload.pagination.totalPages);
          setTotalLogs(payload.pagination.total || 0);
        }
      }
    } catch (error: any) {
      if (isRequestCanceled(error)) return;
      toast.error('Không thể tải nhật ký');
    } finally {
      if (abortControllerRef.current === abortController) {
        setLoading(false);
      }
    }
  }, [buildLogParams]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await adminAPI.getLogStats();
      if (response.data?.success) {
        setStats(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to load stats:', getErrorMessage(error, 'Unknown error'));
    } finally {
      setStatsLoading(false);
    }
  }, [getErrorMessage]);

  // Export CSV
  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await adminAPI.exportLogsCsv(buildLogParams());
      const blob = response.data as Blob;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity_logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('Xuất nhật ký thành công');
    } catch (error: any) {
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
        const response = await adminAPI.bulkDeleteLogs(Array.from(selectedIds));
        const data = response.data;
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
        const response = await adminAPI.deleteLogEntry(deleteModal.idToDelete);
        const data = response.data;
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
    } catch (error: any) {
      toast.error('Có lỗi xảy ra khi xóa');
    } finally {
      setIsDeleting(false);
      setDeleteModal({ isOpen: false, isBulk: false, idToDelete: null });
    }
  };

  const handleDeleteOldLogs = async () => {
    try {
      setDeletingOld(true);
      const response = await adminAPI.deleteOldLogs(90);
      const data = response.data;
      if (data.success) {
        toast.success(data.message || 'Đã xóa log cũ');
        fetchLogs();
        fetchStats();
      } else {
        toast.error(data.error?.message || data.message || 'Không thể xóa log cũ');
      }
    } catch (error: any) {
      toast.error('Không thể xóa log cũ');
    } finally {
      setDeletingOld(false);
      setDeleteOldModalOpen(false);
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
    const visibleLogIds = new Set(logs.map((log) => log.id));
    setExpandedIds((prev) => {
      const next = [...prev].filter((id) => visibleLogIds.has(id));
      return next.length === prev.size ? prev : new Set(next);
    });
  }, [logs]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchLogs(); }, 300);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Fetch users list
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await adminAPI.getUsers({ limit: 200 });
        const payload = response.data?.data;
        if (response.data?.success && payload) {
          const users = Array.isArray(payload) ? payload : (payload.users || []);
          setUsersList(users.map((u: any) => ({
            id: u.id?.toString(),
            username: u.username,
            full_name: u.full_name,
            role: u.role
          })));
        }
      } catch (error: any) {
        console.error('Failed to fetch users:', getErrorMessage(error, 'Unknown error'));
      }
    };
    fetchUsers();
  }, [getErrorMessage]);

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

  const DETAIL_LABELS: Record<string, string> = {
    product_name: 'Tên sản phẩm',
    variant_sku: 'SKU biến thể',
    old_stock: 'Tồn trước',
    new_stock: 'Tồn sau',
    stock_qty: 'Số lượng tồn',
    movement_qty: 'Số lượng thay đổi',
    type: 'Loại thay đổi',
    note: 'Ghi chú',
    before: 'Trước khi thay đổi',
    after: 'Sau khi thay đổi',
    diff: 'Thay đổi',
    name: 'Tên',
    slug: 'Đường dẫn',
    title: 'Tiêu đề',
    subtitle: 'Tiêu đề phụ',
    image_url: 'Ảnh đại diện',
    link_url: 'Liên kết',
    button_text: 'Nút bấm',
    position: 'Vị trí hiển thị',
    sort_order: 'Thứ tự',
    is_active: 'Đang hoạt động',
    is_featured: 'Bộ sưu tập nổi bật',
    featured_sort_order: 'Thứ tự nổi bật',
    description: 'Mô tả',
    code: 'Mã',
    value: 'Giá trị',
    min_subtotal: 'Đơn tối thiểu',
    max_discount: 'Giảm tối đa',
    start_at: 'Bắt đầu',
    end_at: 'Kết thúc',
    usage_limit: 'Giới hạn sử dụng',
    usage_per_user: 'Giới hạn mỗi khách',
    base_fee: 'Phí cơ bản',
    fee_per_kg: 'Phí mỗi kg',
    min_days: 'Ngày giao tối thiểu',
    max_days: 'Ngày giao tối đa',
    provinces: 'Khu vực áp dụng',
    keys: 'Các khóa cài đặt',
    deleted_count: 'Số log đã xóa',
    cutoff_days: 'Số ngày lưu trữ',
    cutoff_date: 'Mốc xóa',
    store_logo: 'Logo cửa hàng'
  };

  const DETAIL_VALUE_LABELS: Record<string, Record<string, string>> = {
    type: {
      in: 'Nhập thêm',
      out: 'Xuất bớt',
      adjust: 'Điều chỉnh trực tiếp'
    },
    position: {
      home_hero: 'Banner trang chủ',
      home_promo: 'Khối khuyến mãi trang chủ',
      category_top: 'Đầu trang danh mục'
    }
  };

  const CURRENCY_FIELDS = new Set(['value', 'min_subtotal', 'max_discount', 'base_fee', 'fee_per_kg']);
  const LONG_DETAIL_TEXT_THRESHOLD = 180;

  const formatDetailLabel = (field: string) => {
    if (DETAIL_LABELS[field]) return DETAIL_LABELS[field];
    return field
      .replace(/\[id=.*?\]/g, '')
      .replace(/\[\d+\]/g, '')
      .split('.')
      .pop()
      ?.replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase()) || field;
  };

  const formatDetailPrimitive = (value: any, field?: string): string => {
    if (value === null || value === undefined || value === '') return 'Không có';
    if (typeof value === 'boolean') return value ? 'Có' : 'Không';
    if (typeof value === 'number') {
      if (field && CURRENCY_FIELDS.has(field)) {
        return `${value.toLocaleString('vi-VN')} đ`;
      }
      return value.toLocaleString('vi-VN');
    }
    if (typeof value === 'string') {
      if (field && DETAIL_VALUE_LABELS[field]?.[value]) {
        return DETAIL_VALUE_LABELS[field][value];
      }
      if (/^\d{4}-\d{2}-\d{2}T/.test(value) || /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) {
          return date.toLocaleString('vi-VN');
        }
      }
      return value;
    }
    return String(value);
  };

  const renderOverflowAwareValue = (value: any, field?: string) => {
    if (typeof value === 'string') {
      const displayValue = formatDetailPrimitive(value, field);

      if (displayValue.length > LONG_DETAIL_TEXT_THRESHOLD) {
        return (
          <div className="max-h-56 overflow-auto whitespace-pre-wrap break-words pr-1 leading-6 custom-scrollbar">
            {displayValue}
          </div>
        );
      }

      return <div className="whitespace-pre-wrap break-words">{displayValue}</div>;
    }

    return renderValue(value, 0, field);
  };

  const isPrimitiveDetail = (value: any) =>
    value === null ||
    value === undefined ||
    value === '' ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean';

  const isObjectDetail = (value: unknown): value is Record<string, any> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

  const DETAIL_META_FIELDS = new Set([
    'before',
    'after',
    'diff',
    'deleted_data',
    'restored_values',
    'rolled_back_from_log_id',
    'original_action',
    'entity_type',
    'entity_id',
    'updates'
  ]);

  const parseLogDetails = (details: string | null) => {
    if (!details) return null;

    try {
      return JSON.parse(details);
    } catch {
      return null;
    }
  };

  const getPrimitiveEntriesFromRecord = (value: Record<string, any>) =>
    Object.entries(value).filter(([, entryValue]) => isPrimitiveDetail(entryValue));

  const getStructuredDetailEntries = (parsed: Record<string, any>) => {
    const primitiveEntries: [string, any][] = [];
    const nestedEntries: [string, any][] = [];

    Object.entries(parsed).forEach(([field, value]) => {
      if (DETAIL_META_FIELDS.has(field)) return;
      if (isPrimitiveDetail(value)) primitiveEntries.push([field, value]);
      else nestedEntries.push([field, value]);
    });

    return { primitiveEntries, nestedEntries };
  };

  const summarizeFilterMap = (value: string) => {
    const parsed = parseLogDetails(value);
    if (!isObjectDetail(parsed)) return '';

    return Object.entries(parsed)
      .filter(([, filterValue]) => filterValue !== '' && filterValue !== null && filterValue !== undefined)
      .slice(0, 3)
      .map(([field, filterValue]) => `${formatDetailLabel(field)}: ${formatDetailPrimitive(filterValue, field)}`)
      .join(' · ');
  };

  const getFriendlyTextDetailSummary = (log: Log, detailText: string) => {
    const normalized = detailText.replace(/\s+/g, ' ').trim();
    if (!normalized) {
      return `Không có thêm chi tiết cho ${formatEntity(log.entity_type || 'system').toLowerCase()}.`;
    }

    const createdOrderMatch = normalized.match(/^Created order\s+(.+)$/i);
    if (createdOrderMatch) return `Đã tạo đơn hàng ${createdOrderMatch[1]}.`;

    const updatedStatusMatch = normalized.match(/^Updated order status to\s+(.+)$/i);
    if (updatedStatusMatch) return `Trạng thái đơn hàng đã được cập nhật thành ${updatedStatusMatch[1]}.`;

    const cancelledOrderMatch = normalized.match(/^Cancelled order\s+(.+)$/i);
    if (cancelledOrderMatch) return `Đơn hàng ${cancelledOrderMatch[1]} đã bị hủy.`;

    const refundRequestMatch = normalized.match(/^Requested refund for order\s+(.+)$/i);
    if (refundRequestMatch) return `Đã tạo yêu cầu hoàn tiền cho đơn hàng ${refundRequestMatch[1]}.`;

    const refundRestockMatch = normalized.match(/^Restocked refunded order\s+(.+)$/i);
    if (refundRestockMatch) return `Đã hoàn tồn kho cho đơn hàng ${refundRestockMatch[1]} sau hoàn tiền.`;

    const exportedWithFilterMatch = normalized.match(/^Exported\s+(.+?)\.\s*Filters:\s*(.+)$/i);
    if (exportedWithFilterMatch) {
      const entityMap: Record<string, string> = {
        orders: 'đơn hàng',
        products: 'sản phẩm'
      };
      const exportedEntity = entityMap[exportedWithFilterMatch[1].toLowerCase()] || exportedWithFilterMatch[1];
      const filters = summarizeFilterMap(exportedWithFilterMatch[2]);
      return filters
        ? `Đã xuất ${exportedEntity} với bộ lọc ${filters}.`
        : `Đã xuất ${exportedEntity}.`;
    }

    if (/^Exported customers list$/i.test(normalized)) {
      return 'Đã xuất danh sách khách hàng.';
    }

    const importedProductsMatch = normalized.match(/^Imported products:\s*(\d+)\s*created,\s*(\d+)\s*updated,\s*(\d+)\s*errors$/i);
    if (importedProductsMatch) {
      return `Đã nhập dữ liệu sản phẩm: ${importedProductsMatch[1]} tạo mới, ${importedProductsMatch[2]} cập nhật, ${importedProductsMatch[3]} lỗi.`;
    }

    const createdStaffMatch = normalized.match(/^Created staff account:\s*(.+)$/i);
    if (createdStaffMatch) return `Đã tạo tài khoản nhân viên ${createdStaffMatch[1]}.`;

    const deletedStaffMatch = normalized.match(/^Deleted staff ID:\s*(.+)$/i);
    if (deletedStaffMatch) return `Đã xóa tài khoản nhân viên có ID ${deletedStaffMatch[1]}.`;

    const vnPaySuccessMatch = normalized.match(/^VNPay Success\.\s*Ref:\s*(.+)$/i);
    if (vnPaySuccessMatch) return `Thanh toán VNPay thành công. Mã giao dịch: ${vnPaySuccessMatch[1]}.`;

    return normalized;
  };

  const getDetailSummaryTone = (
    log: Log,
    parsed?: Record<string, any> | null,
    rawDetails?: string
  ): 'default' | 'warning' | 'danger' | 'success' => {
    if (parsed?.deleted_data) return 'danger';
    if (parsed?.restored_values) return 'success';
    if (parsed?.diff || parsed?.before || parsed?.after) return 'warning';

    const action = log.action.toLowerCase();
    if (action.includes('xóa') || action.includes('delete')) return 'danger';
    if (
      action.includes('tạo') ||
      action.includes('create') ||
      action.includes('login') ||
      action.includes('đăng nhập')
    ) {
      return 'success';
    }

    if (rawDetails) {
      const normalized = rawDetails.toLowerCase();
      if (normalized.includes('error') || normalized.includes('fail')) return 'danger';
    }

    return 'default';
  };

  const getFriendlyDetailSummary = (log: Log, parsed: Record<string, any>) => {
    const entityLabel = formatEntity(log.entity_type || 'system').toLowerCase();

    if (parsed.product_name && parsed.old_stock !== undefined && parsed.new_stock !== undefined) {
      const direction = Number(parsed.new_stock) >= Number(parsed.old_stock) ? 'tăng' : 'giảm';
      return `Tồn kho của "${parsed.product_name}" đã ${direction} từ ${formatDetailPrimitive(parsed.old_stock, 'old_stock')} lên ${formatDetailPrimitive(parsed.new_stock, 'new_stock')}.`;
    }

    if (isObjectDetail(parsed.restored_values)) {
      return `Đã khôi phục ${Object.keys(parsed.restored_values).length} trường dữ liệu của ${entityLabel}.`;
    }

    if (isObjectDetail(parsed.deleted_data)) {
      return `Bản ghi ${entityLabel} này đã bị xóa. Hệ thống vẫn lưu lại dữ liệu cũ để đối chiếu hoặc khôi phục.`;
    }

    if (isObjectDetail(parsed.diff)) {
      return `Bản ghi ${entityLabel} này đã được cập nhật ${Object.keys(parsed.diff).length} trường thông tin.`;
    }

    if (parsed.deleted_count && parsed.cutoff_days) {
      return `Hệ thống đã xóa ${formatDetailPrimitive(parsed.deleted_count, 'deleted_count')} log cũ hơn ${formatDetailPrimitive(parsed.cutoff_days, 'cutoff_days')} ngày.`;
    }

    if (Array.isArray(parsed.keys) && parsed.keys.length > 0) {
      return `Đã cập nhật ${parsed.keys.length} thiết lập hệ thống: ${parsed.keys.map((key: string) => formatDetailLabel(key)).join(', ')}.`;
    }

    const { primitiveEntries } = getStructuredDetailEntries(parsed);
    if (primitiveEntries.length > 0) {
      return primitiveEntries
        .slice(0, 3)
        .map(([field, value]) => `${formatDetailLabel(field)}: ${formatDetailPrimitive(value, field)}`)
        .join(' · ');
    }

    return `Chi tiết thao tác của ${entityLabel} đã được lưu lại để đối chiếu.`;
  };

  const renderQuickSummary = (
    summary: string,
    tone: 'default' | 'warning' | 'danger' | 'success' = 'default'
  ) => {
    const styles = {
      default:
        'border-secondary-200 bg-secondary-50/80 text-secondary-700 dark:border-secondary-700 dark:bg-secondary-900/40 dark:text-secondary-200',
      warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200',
      danger: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200',
      success:
        'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200'
    };

    return (
      <div className={`mb-3 rounded-xl border px-3 py-2.5 text-sm leading-6 ${styles[tone]}`}>
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">Tóm tắt nhanh</div>
        <div>{summary}</div>
      </div>
    );
  };

  const renderPrimitiveFieldCards = (entries: [string, any][]) => {
    if (entries.length === 0) return null;

    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {entries.map(([field, value]) => (
          <div
            key={field}
            className="rounded-xl border border-secondary-200 bg-white px-3 py-2.5 dark:border-secondary-700 dark:bg-secondary-800/80"
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary-500 dark:text-secondary-400">
              {formatDetailLabel(field)}
            </div>
            <div className="mt-1 break-words text-sm font-medium text-secondary-900 dark:text-white">
              {renderOverflowAwareValue(value, field)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDiffPreviewCards = (entries: [string, any][]) => {
    if (entries.length === 0) return null;

    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {entries.slice(0, 3).map(([field, change]) => (
          <div
            key={field}
            className="rounded-xl border border-secondary-200 bg-white px-3 py-3 dark:border-secondary-700 dark:bg-secondary-800/80"
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary-500 dark:text-secondary-400">
              {formatDetailLabel(field)}
            </div>
            <div className="mt-2 space-y-2">
              <div className="rounded-lg bg-red-50 px-2 py-1.5 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-300">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] opacity-80">Cũ</div>
                <div className="break-words">{renderOverflowAwareValue(change?.from, field)}</div>
              </div>
              <div className="rounded-lg bg-green-50 px-2 py-1.5 text-xs text-green-700 dark:bg-green-900/20 dark:text-green-300">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] opacity-80">Mới</div>
                <div className="break-words">{renderOverflowAwareValue(change?.to, field)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderNestedDetailBlocks = (entries: [string, any][]) => {
    if (entries.length === 0) return null;

    return (
      <div className="mt-3 space-y-3">
        {entries.map(([field, value]) => (
          <div
            key={field}
            className="rounded-xl border border-secondary-200 bg-white px-3 py-3 dark:border-secondary-700 dark:bg-secondary-800/80"
          >
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary-500 dark:text-secondary-400">
              {formatDetailLabel(field)}
            </div>
            <div className="text-xs text-secondary-700 dark:text-secondary-200">{renderOverflowAwareValue(value, field)}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderDetailToggle = ({
    logId,
    label,
    icon,
    className = 'text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200'
  }: {
    logId: string;
    label: string;
    icon: JSX.Element;
    className?: string;
  }) => (
    <button
      onClick={() => toggleExpand(logId)}
      className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${className}`}
    >
      {icon}
      <span>{label}</span>
      <ChevronDown
        className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedIds.has(logId) ? 'rotate-180' : ''}`}
      />
    </button>
  );

  const renderRawDetailBlock = (value: string) => (
    <div className="mt-2 rounded-xl border border-secondary-200 bg-secondary-50/80 px-3 py-3 dark:border-secondary-700 dark:bg-secondary-900/40">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary-500 dark:text-secondary-400">
        Chi tiết gốc
      </div>
      <div className="whitespace-pre-wrap break-words text-sm leading-6 text-secondary-700 dark:text-secondary-200">
        {value}
      </div>
    </div>
  );

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
  const renderValue = (val: any, depth: number = 0, field?: string): JSX.Element => {
    if (val === null || val === undefined || val === '') return <span className="text-secondary-400 italic">Không có</span>;
    if (typeof val === 'boolean') return <span className={val ? 'text-green-600' : 'text-red-500'}>{formatDetailPrimitive(val, field)}</span>;
    if (typeof val === 'number') return <span className="text-blue-600 dark:text-blue-400">{formatDetailPrimitive(val, field)}</span>;
    if (typeof val === 'string') {
      return <>{renderOverflowAwareValue(val, field)}</>;
    }
    if (Array.isArray(val)) {
      if (val.length === 0) return <span className="text-secondary-400 italic">Không có</span>;
      return (
        <div className={`${depth > 0 ? 'ml-3 pl-2 border-l-2 border-secondary-200 dark:border-secondary-700' : ''}`}>
          {val.map((item, i) => (
            <div key={i} className="flex items-start gap-1 py-0.5">
              <span className="text-secondary-400 select-none text-[10px] mt-0.5">{i}:</span>
              {renderValue(item, depth + 1, field)}
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
              <span className="text-secondary-500 dark:text-secondary-400 font-medium text-[10px] shrink-0">{formatDetailLabel(k)}:</span>
              <div className="min-w-0">{renderValue(v, depth + 1, k)}</div>
            </div>
          ))}
        </div>
      );
    }
    return <span>{String(val)}</span>;
  };

  // --- Rollback Helpers ---
  // Returns true if the log HAS rollback-able data (regardless of whether it was already rolled back)
  const hasRollbackData = (log: Log): boolean => {
    const supported = ['brand', 'category', 'product', 'user', 'collection', 'inventory', 'shipping_method', 'coupon', 'banner', 'settings'];
    if (!supported.includes(log.entity_type)) return false;
    if (!log.details) return false;
    try {
      const parsed = JSON.parse(log.details);
      return !!(
        parsed.before ||
        (parsed.diff && Object.keys(parsed.diff).length > 0) ||
        parsed.deleted_data ||
        (log.entity_type === 'inventory' && parsed.old_stock !== undefined && parsed.new_stock !== undefined)
      );
    } catch { return false; }
  };

  const canRollback = (log: Log): boolean => hasRollbackData(log) && !log.is_rolled_back;

  const handleRollback = async () => {
    const logId = rollbackModal.logId;
    if (!logId) return;
    setRollbackModal({ isOpen: false, logId: null, action: '' });
    setRollbackingIds(prev => new Set([...prev, logId]));
    try {
      const response = await adminAPI.rollbackLog(logId);
      const data = response.data;
      if (data.success) {
        toast.success('Khôi phục dữ liệu thành công');
        fetchLogs();
        fetchStats();
      } else {
        toast.error(data.error?.message || 'Khôi phục thất bại');
      }
    } catch (error: any) {
      toast.error('Có lỗi xảy ra khi khôi phục');
    } finally {
      setRollbackingIds(prev => { const next = new Set(prev); next.delete(logId); return next; });
    }
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

  const renderInventorySummary = (details: any) => {
    const cards = [
      { label: 'Tên sản phẩm', value: details.product_name },
      { label: 'SKU biến thể', value: details.variant_sku },
      { label: 'Tồn trước', value: formatDetailPrimitive(details.old_stock, 'old_stock') },
      { label: 'Tồn sau', value: formatDetailPrimitive(details.new_stock, 'new_stock') },
      { label: 'Số lượng thay đổi', value: formatDetailPrimitive(details.movement_qty, 'movement_qty') },
      { label: 'Loại thay đổi', value: formatDetailPrimitive(details.type, 'type') },
      { label: 'Ghi chú', value: formatDetailPrimitive(details.note, 'note') }
    ];

    return (
      <div className="mt-2 rounded-lg border border-secondary-200 bg-secondary-50/80 p-3 dark:border-secondary-700 dark:bg-secondary-900/40">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-secondary-500 dark:text-secondary-400">
          <Settings className="h-3.5 w-3.5" />
          Chi tiết biến động kho
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <div key={card.label} className="rounded-xl border border-secondary-200 bg-white px-3 py-2.5 dark:border-secondary-700 dark:bg-secondary-800/80">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary-500 dark:text-secondary-400">
                {card.label}
              </div>
              <div className="mt-1 text-sm font-medium text-secondary-900 dark:text-white break-words">
                {card.value || 'Không có'}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- Render Details ---
  const renderLegacyDetails = (log: Log) => {
    if (!log.details) return null;
    const isExpanded = expandedIds.has(log.id);

    try {
      const parsed = JSON.parse(log.details);

      if (parsed.product_name && parsed.old_stock !== undefined && parsed.new_stock !== undefined) {
        return (
          <div className="mt-3">
            <button
              onClick={() => toggleExpand(log.id)}
              className="flex items-center gap-1.5 text-xs font-medium text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200 transition-colors"
            >
              <Eye className="w-3 h-3" />
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
              Xem chi tiết kho
            </button>
            {isExpanded && renderInventorySummary(parsed)}
          </div>
        );
      }

      // --- Rollback detail view ---
      if (parsed.restored_values && typeof parsed.restored_values === 'object') {
        const restoredEntries = Object.entries(parsed.restored_values);
        const entityLabel = ENTITY_MAP[parsed.entity_type] || parsed.entity_type || '';
        return (
          <div className="mt-3">
            <button
              onClick={() => toggleExpand(log.id)}
              className="flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 transition-colors"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
              <RotateCcw className="w-3 h-3" />
              Xem chi tiết khôi phục · {restoredEntries.length} trường
            </button>
            {isExpanded && (
              <div className="mt-2 rounded-lg border border-amber-200 dark:border-amber-800 overflow-hidden animate-fadeIn">
                {/* Header metadata */}
                <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-amber-700 dark:text-amber-300">
                  {parsed.original_action && (
                    <span>Hoàn tác: <strong>{parsed.original_action}</strong></span>
                  )}
                  {entityLabel && parsed.entity_id && (
                    <span>{entityLabel} <strong>#{parsed.entity_id}</strong></span>
                  )}
                  {parsed.rolled_back_from_log_id && (
                    <span className="font-mono opacity-70">Log #{parsed.rolled_back_from_log_id}</span>
                  )}
                </div>
                {/* Restored values table */}
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-secondary-50 dark:bg-secondary-900">
                      <th className="px-3 py-2 text-left font-semibold text-secondary-500 dark:text-secondary-400 w-1/3">Trường</th>
                      <th className="px-3 py-2 text-left font-semibold text-amber-600 dark:text-amber-400">Giá trị được khôi phục</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-100 dark:divide-secondary-700">
                    {restoredEntries.map(([field, value]) => (
                      <tr key={field} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors">
                        <td className="px-3 py-2 font-medium text-secondary-700 dark:text-secondary-300">{formatDetailLabel(field)}</td>
                        <td className="px-3 py-2 break-all">
                          <div className="bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded font-medium text-amber-800 dark:text-amber-200">
                            {renderValue(value, 0, field)}
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

      if (parsed.deleted_data && typeof parsed.deleted_data === 'object' && Object.keys(parsed.deleted_data).length > 0) {
        const deletedEntries = Object.entries(parsed.deleted_data);
        return (
          <div className="mt-3">
            <button
              onClick={() => toggleExpand(log.id)}
              className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200 transition-colors"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
              <Trash2 className="w-3 h-3" />
              Dữ liệu đã xóa · {deletedEntries.length} trường
            </button>
            {isExpanded && (
              <div className="mt-2 rounded-lg border border-red-200 dark:border-red-800 overflow-hidden animate-fadeIn">
                <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 text-[11px] text-red-700 dark:text-red-300 font-medium">
                  Bản ghi đã bị xóa vĩnh viễn
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-secondary-50 dark:bg-secondary-900">
                      <th className="px-3 py-2 text-left font-semibold text-secondary-500 dark:text-secondary-400 w-1/3">Trường</th>
                      <th className="px-3 py-2 text-left font-semibold text-red-500 dark:text-red-400">Giá trị</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-100 dark:divide-secondary-700">
                    {deletedEntries.map(([field, value]) => (
                      <tr key={field} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors">
                        <td className="px-3 py-2 font-medium text-secondary-700 dark:text-secondary-300">{formatDetailLabel(field)}</td>
                        <td className="px-3 py-2 break-all">
                          <div className="bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded line-through text-red-700 dark:text-red-300">
                            {renderValue(value, 0, field)}
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
                        <td className="px-3 py-2 font-medium text-secondary-700 dark:text-secondary-300">{formatDetailLabel(field)}</td>
                        <td className="px-3 py-2 text-red-600 dark:text-red-400 break-all">
                          <div className="bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded line-through">
                            {renderValue(change.from, 0, field)}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-green-600 dark:text-green-400 break-all">
                          <div className="bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded font-medium">
                            {renderValue(change.to, 0, field)}
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

  const renderDetails = (log: Log) => {
    if (!log.details) return null;

    const isExpanded = expandedIds.has(log.id);
    const parsed = parseLogDetails(log.details);

    if (Array.isArray(parsed)) {
      return (
        <div className="mt-3">
          {renderQuickSummary(`Log này chứa ${parsed.length} mục dữ liệu liên quan.`)}
          <div className="mt-3">
            {renderDetailToggle({
              logId: log.id,
              label: 'Xem toàn bộ danh sách',
              icon: <Eye className="w-3 h-3" />
            })}
            {isExpanded && (
              <div className="mt-2 rounded-lg border border-secondary-200 bg-secondary-50/80 p-3 text-xs animate-fadeIn overflow-x-auto dark:border-secondary-700 dark:bg-secondary-900/40">
                {renderValue(parsed)}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (isObjectDetail(parsed)) {
      const summary = getFriendlyDetailSummary(log, parsed);
      const tone = getDetailSummaryTone(log, parsed);
      const { primitiveEntries, nestedEntries } = getStructuredDetailEntries(parsed);

      if (parsed.product_name && parsed.old_stock !== undefined && parsed.new_stock !== undefined) {
        return (
          <div className="mt-3">
            {renderQuickSummary(summary, tone)}
            {renderInventorySummary(parsed)}
          </div>
        );
      }

      if (isObjectDetail(parsed.restored_values)) {
        const restoredEntries = Object.entries(parsed.restored_values);
        const entityLabel = ENTITY_MAP[parsed.entity_type] || parsed.entity_type || '';
        const previewEntries = getPrimitiveEntriesFromRecord(parsed.restored_values).slice(0, 3);

        return (
          <div className="mt-3">
            {renderQuickSummary(summary, tone)}
            {previewEntries.length > 0 && renderPrimitiveFieldCards(previewEntries)}
            <div className="mt-3">
              {renderDetailToggle({
                logId: log.id,
                label: `Xem chi tiết khôi phục · ${restoredEntries.length} trường`,
                icon: <RotateCcw className="w-3 h-3" />,
                className: 'text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200'
              })}
              {isExpanded && (
                <div className="mt-2 rounded-lg border border-amber-200 dark:border-amber-800 overflow-hidden animate-fadeIn">
                  <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-amber-700 dark:text-amber-300">
                    {parsed.original_action && (
                      <span>Hoàn tác: <strong>{parsed.original_action}</strong></span>
                    )}
                    {entityLabel && parsed.entity_id && (
                      <span>{entityLabel} <strong>#{parsed.entity_id}</strong></span>
                    )}
                    {parsed.rolled_back_from_log_id && (
                      <span className="font-mono opacity-70">Log #{parsed.rolled_back_from_log_id}</span>
                    )}
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-secondary-50 dark:bg-secondary-900">
                        <th className="px-3 py-2 text-left font-semibold text-secondary-500 dark:text-secondary-400 w-1/3">Trường</th>
                        <th className="px-3 py-2 text-left font-semibold text-amber-600 dark:text-amber-400">Giá trị được khôi phục</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-100 dark:divide-secondary-700">
                      {restoredEntries.map(([field, value]) => (
                        <tr key={field} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors">
                          <td className="px-3 py-2 font-medium text-secondary-700 dark:text-secondary-300">{formatDetailLabel(field)}</td>
                          <td className="px-3 py-2 break-all">
                            <div className="bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded font-medium text-amber-800 dark:text-amber-200">
                              {renderOverflowAwareValue(value, field)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      }

      if (isObjectDetail(parsed.deleted_data) && Object.keys(parsed.deleted_data).length > 0) {
        const deletedEntries = Object.entries(parsed.deleted_data);
        const previewEntries = getPrimitiveEntriesFromRecord(parsed.deleted_data).slice(0, 3);

        return (
          <div className="mt-3">
            {renderQuickSummary(summary, tone)}
            {previewEntries.length > 0 && renderPrimitiveFieldCards(previewEntries)}
            <div className="mt-3">
              {renderDetailToggle({
                logId: log.id,
                label: `Dữ liệu đã xóa · ${deletedEntries.length} trường`,
                icon: <Trash2 className="w-3 h-3" />,
                className: 'text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200'
              })}
              {isExpanded && (
                <div className="mt-2 rounded-lg border border-red-200 dark:border-red-800 overflow-hidden animate-fadeIn">
                  <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 text-[11px] text-red-700 dark:text-red-300 font-medium">
                    Bản ghi đã bị xóa vĩnh viễn
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-secondary-50 dark:bg-secondary-900">
                        <th className="px-3 py-2 text-left font-semibold text-secondary-500 dark:text-secondary-400 w-1/3">Trường</th>
                        <th className="px-3 py-2 text-left font-semibold text-red-500 dark:text-red-400">Giá trị</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-100 dark:divide-secondary-700">
                      {deletedEntries.map(([field, value]) => (
                        <tr key={field} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors">
                          <td className="px-3 py-2 font-medium text-secondary-700 dark:text-secondary-300">{formatDetailLabel(field)}</td>
                          <td className="px-3 py-2 break-all">
                            <div className="bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded line-through text-red-700 dark:text-red-300">
                              {renderOverflowAwareValue(value, field)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      }

      if (isObjectDetail(parsed.diff) && Object.keys(parsed.diff).length > 0) {
        const diffEntries = Object.entries(parsed.diff) as [string, any][];
        const shouldShowDiffTable = diffEntries.length > 4;

        return (
          <div className="mt-3">
            {renderQuickSummary(summary, tone)}
            {renderDiffPreviewCards(diffEntries)}
            {shouldShowDiffTable && (
              <div className="mt-3">
                {renderDetailToggle({
                  logId: log.id,
                  label: `Xem đầy đủ ${diffEntries.length} thay đổi`,
                  icon: <ArrowRightLeft className="w-3 h-3" />
                })}
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
                        {diffEntries.map(([field, change]) => (
                          <tr key={field} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors">
                            <td className="px-3 py-2 font-medium text-secondary-700 dark:text-secondary-300">{formatDetailLabel(field)}</td>
                            <td className="px-3 py-2 text-red-600 dark:text-red-400 break-all">
                              <div className="bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded line-through">
                                {renderOverflowAwareValue(change.from, field)}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-green-600 dark:text-green-400 break-all">
                              <div className="bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded font-medium">
                                {renderOverflowAwareValue(change.to, field)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }

      const shouldShowRawObject = nestedEntries.length > 0 || primitiveEntries.length === 0;
      const objectToggleLabel =
        nestedEntries.length > 1
          ? `Xem thêm ${nestedEntries.length} nhóm dữ liệu`
          : nestedEntries.length === 1
            ? `Xem ${formatDetailLabel(nestedEntries[0][0]).toLowerCase()}`
            : 'Xem toàn bộ chi tiết';

      return (
        <div className="mt-3">
          {renderQuickSummary(summary, tone)}
          {primitiveEntries.length > 0 && renderPrimitiveFieldCards(primitiveEntries.slice(0, 6))}
          {shouldShowRawObject && (
            <div className="mt-3">
              {renderDetailToggle({
                logId: log.id,
                label: objectToggleLabel,
                icon: <Eye className="w-3 h-3" />
              })}
              {isExpanded &&
                (nestedEntries.length > 0 ? (
                  renderNestedDetailBlocks(nestedEntries)
                ) : (
                  <div className="mt-2 rounded-lg border border-secondary-200 bg-secondary-50/80 p-3 text-xs animate-fadeIn overflow-x-auto dark:border-secondary-700 dark:bg-secondary-900/40">
                    {renderValue(parsed)}
                  </div>
                ))}
            </div>
          )}
        </div>
      );
    }

    const summary = getFriendlyTextDetailSummary(log, log.details);
    const shouldShowRawText = summary !== log.details.trim() || log.details.trim().length > 140;

    return (
      <div className="mt-3">
        {renderQuickSummary(summary, getDetailSummaryTone(log, null, log.details))}
        {shouldShowRawText && (
          <div className="mt-3">
            {renderDetailToggle({
              logId: log.id,
              label: 'Xem nội dung gốc',
              icon: <Eye className="w-3 h-3" />
            })}
            {isExpanded && renderRawDetailBlock(log.details)}
          </div>
        )}
      </div>
    );
  };

  const hasExpandableDetails = (log: Log) => {
    if (!log.details) return false;

    const parsed = parseLogDetails(log.details);
    if (Array.isArray(parsed)) return true;

    if (isObjectDetail(parsed)) {
      if (parsed.product_name && parsed.old_stock !== undefined && parsed.new_stock !== undefined) {
        return false;
      }

      if (isObjectDetail(parsed.restored_values)) return true;
      if (isObjectDetail(parsed.deleted_data) && Object.keys(parsed.deleted_data).length > 0) return true;
      if (isObjectDetail(parsed.diff) && Object.keys(parsed.diff).length > 0) {
        return Object.keys(parsed.diff).length > 4;
      }

      const { primitiveEntries, nestedEntries } = getStructuredDetailEntries(parsed);
      return nestedEntries.length > 0 || primitiveEntries.length === 0;
    }

    const summary = getFriendlyTextDetailSummary(log, log.details);
    return summary !== log.details.trim() || log.details.trim().length > 140;
  };

  const expandableLogIds = useMemo(
    () => logs.filter((log) => hasExpandableDetails(log)).map((log) => log.id),
    [logs]
  );

  const areAllExpandableDetailsExpanded =
    expandableLogIds.length > 0 && expandableLogIds.every((id) => expandedIds.has(id));

  const toggleExpandAllVisibleDetails = () => {
    setExpandedIds((prev) => {
      const next = new Set(prev);

      if (expandableLogIds.every((id) => next.has(id))) {
        expandableLogIds.forEach((id) => next.delete(id));
      } else {
        expandableLogIds.forEach((id) => next.add(id));
      }

      return next;
    });
  };

  const logGroups = useMemo(() => groupLogsByDate(logs), [logs, groupLogsByDate]);

  const renderLogItem = (log: Log) => (
    <div
      key={log.id}
      className="relative border-b border-secondary-100 p-4 pl-12 transition-colors last:border-b-0 hover:bg-secondary-50/50 dark:border-secondary-800/50 dark:hover:bg-secondary-900/30 group"
    >
      <div className="absolute bottom-0 left-[24px] top-0 w-px bg-secondary-200 dark:bg-secondary-700" />
      <div className={`absolute left-[20px] top-6 z-[1] h-2.5 w-2.5 rounded-full border-2 border-white dark:border-secondary-800 ${getTimelineDotColor(log.action)}`} />

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-md border border-transparent px-2 py-0.5 text-xs font-semibold shadow-sm dark:border-secondary-700/50 ${getActionColor(log.action)}`}>
                {getActionIcon(log.action)}
                {formatAction(log.action)}
              </span>
              {log.entity_type && (
                <button
                  onClick={() => {
                    setEntityFilter(log.entity_type);
                    if (log.entity_id) setSearchQuery(log.entity_id);
                    setPage(1);
                  }}
                  className="rounded bg-secondary-100 px-2 py-0.5 text-sm font-medium text-secondary-900 transition hover:bg-primary-50 hover:text-primary-700 dark:bg-secondary-800 dark:text-secondary-200 dark:hover:bg-primary-900/20 dark:hover:text-primary-300"
                  title="Xem lịch sử của đối tượng này"
                >
                  {formatEntity(log.entity_type)}
                </button>
              )}
              {log.entity_id && (
                <span className="rounded border border-secondary-200 bg-secondary-100 px-1.5 py-0.5 font-mono text-[10px] text-secondary-500 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-400">
                  #{log.entity_id.length > 8 ? log.entity_id.slice(0, 8) : log.entity_id}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="flex items-center gap-1 text-xs font-medium text-secondary-600 dark:text-secondary-400">
                <User className="h-3.5 w-3.5" />
                {log.user?.full_name || log.user?.username || 'System'}
              </span>
              {log.user?.role && getRoleBadge(log.user.role)}
              <span className="flex items-center gap-1 text-xs text-secondary-400 dark:text-secondary-500" title={new Date(log.created_at).toLocaleString('vi-VN')}>
                <Clock className="h-3.5 w-3.5" />
                {formatRelativeTime(log.created_at)}
              </span>
              {log.user_agent && (() => {
                const ua = parseUserAgent(log.user_agent);
                const UAIcon = ua.icon;
                return (
                  <span className="flex items-center gap-1 rounded bg-secondary-50 px-1.5 py-0.5 text-[10px] text-secondary-400 dark:bg-secondary-900/50 dark:text-secondary-500" title={log.user_agent}>
                    <UAIcon className="h-3 w-3" />
                    {ua.browser} {ua.os && `· ${ua.os}`}
                  </span>
                );
              })()}
              {log.ip_address && (
                <button
                  onClick={() => {
                    setSearchQuery(log.ip_address || '');
                    setPage(1);
                  }}
                  className="flex items-center gap-1 rounded bg-secondary-50 px-1.5 py-0.5 font-mono text-[10px] text-secondary-400 transition hover:bg-primary-50 hover:text-primary-700 dark:bg-secondary-900/50 dark:text-secondary-500 dark:hover:bg-primary-900/20 dark:hover:text-primary-300"
                  title="Lọc theo địa chỉ IP"
                >
                  <Globe className="h-3 w-3 shrink-0" />
                  {log.ip_address}
                </button>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-start">
            <input
              type="checkbox"
              checked={selectedIds.has(log.id)}
              onChange={() => toggleSelect(log.id)}
              className="h-4 w-4 cursor-pointer rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
            />
            {hasRollbackData(log) && (
              log.is_rolled_back ? (
                <span
                  className="inline-flex cursor-not-allowed items-center gap-1 rounded-md border border-secondary-200 bg-secondary-50 px-2 py-1 text-[11px] text-secondary-300 dark:border-secondary-700 dark:bg-secondary-900/40 dark:text-secondary-600"
                  title="Đã khôi phục trước đó"
                >
                  <RotateCcw className="h-3 w-3" />
                </span>
              ) : (
                <button
                  onClick={() => setRollbackModal({ isOpen: true, logId: log.id, action: log.action })}
                  disabled={rollbackingIds.has(log.id)}
                  className="inline-flex items-center gap-1 rounded-md border border-secondary-200 bg-white px-2 py-1 text-[11px] text-secondary-500 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600 disabled:opacity-50 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-300 dark:hover:border-amber-700 dark:hover:bg-amber-900/20 dark:hover:text-amber-400"
                  title="Khôi phục về trạng thái trước"
                >
                  {rollbackingIds.has(log.id) ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                </button>
              )
            )}
            <button
              onClick={() => copyLog(log)}
              className="inline-flex items-center gap-1 rounded-md border border-secondary-200 bg-white px-2 py-1 text-[11px] text-secondary-500 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-300 dark:hover:border-primary-700 dark:hover:bg-primary-900/20 dark:hover:text-primary-400"
              title="Sao chép nhật ký"
            >
              {copiedId === log.id ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
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
              className="inline-flex items-center gap-1 rounded-md border border-secondary-200 bg-white px-2 py-1 text-[11px] text-secondary-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-300 dark:hover:border-red-700 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              title="Xóa nhật ký"
            >
              <Trash2 className="h-3 w-3" />
            </button>
            <span className="hidden whitespace-nowrap font-mono text-[10px] text-secondary-400 dark:text-secondary-500 xl:block">
              {new Date(log.created_at).toLocaleTimeString('vi-VN')}
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {log.entity_type && log.entity_id && (
            <button
              onClick={() => {
                setEntityFilter(log.entity_type || '');
                setSearchQuery(log.entity_id || '');
                setPage(1);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-secondary-200 bg-white px-2.5 py-1.5 text-xs font-medium text-secondary-700 transition hover:border-primary-300 hover:text-primary-700 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-300 dark:hover:border-primary-700 dark:hover:text-primary-300"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              Xem lịch sử của đối tượng này
            </button>
          )}
          {log.ip_address && (
            <button
              onClick={() => {
                setSearchQuery(log.ip_address || '');
                setPage(1);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-secondary-200 bg-white px-2.5 py-1.5 text-xs font-medium text-secondary-700 transition hover:border-primary-300 hover:text-primary-700 dark:border-secondary-700 dark:bg-secondary-900 dark:text-secondary-300 dark:hover:border-primary-700 dark:hover:text-primary-300"
            >
              <Shield className="h-3.5 w-3.5" />
              Lọc theo IP này
            </button>
          )}
        </div>

        {renderDetails(log)}
      </div>
    </div>
  );

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
            onClick={() => setDeleteOldModalOpen(true)}
            disabled={deletingOld}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-secondary-800 border border-red-200 dark:border-red-900/40 rounded-lg text-red-600 dark:text-red-300 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
          >
            {deletingOld ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Xóa log cũ hơn 90 ngày
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
                  <option value="Đăng nhập">Đăng nhập</option>
                  <option value="Đăng xuất">Đăng xuất</option>
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
              lines.push(`Phân bố hành động: ${stats.actionDistribution.map(a => `${a.action}: ${a.count}`).join(', ')}`);
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
          <LogSkeleton />
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
                {expandableLogIds.length > 0 && (
                  <button
                    onClick={toggleExpandAllVisibleDetails}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-secondary-200 bg-white px-2.5 py-1.5 text-xs font-medium text-secondary-700 transition hover:border-primary-300 hover:text-primary-700 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-300 dark:hover:border-primary-700 dark:hover:text-primary-300"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {areAllExpandableDetailsExpanded ? 'Thu gọn chi tiết' : 'Mở tất cả chi tiết'}
                  </button>
                )}
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

            <div className="overflow-auto pr-2 custom-scrollbar" style={{ height: '70vh', minHeight: '600px' }}>
              {logGroups.map((group) => (
                <section key={group.date}>
                  <div className="sticky top-0 z-10 border-y border-secondary-200 bg-secondary-50/95 px-4 py-2.5 backdrop-blur-md dark:border-secondary-700 dark:bg-secondary-900/95">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-secondary-700 dark:text-secondary-300">{group.label}</span>
                      <span className="text-[10px] font-medium text-secondary-400 dark:text-secondary-500">{group.date !== group.label ? `· ${group.date}` : ''}</span>
                      <span className="ml-auto rounded-full border border-secondary-100 bg-white px-2 py-0.5 text-[10px] font-medium text-secondary-600 shadow-sm dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-400">
                        {group.logs.length} hoạt động
                      </span>
                    </div>
                  </div>
                  {group.logs.map(renderLogItem)}
                </section>
              ))}
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
    <ConfirmModal
        isOpen={deleteOldModalOpen}
        onClose={() => setDeleteOldModalOpen(false)}
        onConfirm={handleDeleteOldLogs}
        title="Xác nhận xóa log cũ"
        message="Hệ thống sẽ xóa toàn bộ nhật ký cũ hơn 90 ngày. Hành động này không thể hoàn tác."
        confirmText={deletingOld ? "Đang xóa..." : "Xóa log cũ"}
        cancelText="Hủy"
        isDestructive={true}
      />
    <ConfirmModal
        isOpen={rollbackModal.isOpen}
        onClose={() => setRollbackModal({ isOpen: false, logId: null, action: '' })}
        onConfirm={handleRollback}
        title="Xác nhận khôi phục dữ liệu"
        message={`Bạn sắp khôi phục đối tượng về trạng thái trước hành động "${rollbackModal.action}". Thao tác này sẽ ghi đè dữ liệu hiện tại. Tiếp tục?`}
        confirmText="Khôi phục"
        cancelText="Hủy"
        isDestructive={false}
      />
    </>
  );
}
