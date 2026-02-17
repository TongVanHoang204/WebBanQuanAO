import { useState, useEffect } from 'react';
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
  ArrowRightLeft
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { resolveApiUrl } from '../../../services/api';
import Pagination from '../../../components/common/Pagination';

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

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entity_type = entityFilter;
      if (dateFilter) params.start_date = dateFilter;
      if (searchQuery) params.search = searchQuery;
      params.page = page.toString();
      params.limit = '15';

      const res = await fetch(resolveApiUrl(`/api/admin/logs?${new URLSearchParams(params)}`), {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      const data = await res.json();
      if (data.success) {
        setLogs(data.data.logs);
        if (data.data.pagination) {
          setTotalPages(data.data.pagination.totalPages);
          setTotalLogs(data.data.pagination.total || 0);
        }
      }
    } catch (error) {
      toast.error('Không thể tải nhật ký');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 300);
    return () => clearTimeout(timer);
  }, [actionFilter, entityFilter, dateFilter, searchQuery, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [actionFilter, entityFilter, dateFilter, searchQuery]);

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
    // Direct match
    if (ACTION_MAP[action]) return ACTION_MAP[action];
    // Substring match for Vietnamese action strings
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

  // --- Render Details ---

  const renderDetails = (log: Log) => {
    if (!log.details) return null;
    const isExpanded = expandedIds.has(log.id);

    try {
      const parsed = JSON.parse(log.details);

      // Case 1: Has Diff (Update)
      if (parsed.diff && Object.keys(parsed.diff).length > 0) {
        return (
          <div className="mt-3">
            <button
              onClick={() => toggleExpand(log.id)}
              className="flex items-center gap-1.5 text-xs font-medium text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200 transition-colors"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              <ArrowRightLeft className="w-3 h-3" />
              {Object.keys(parsed.diff).length} thay đổi
            </button>
            {isExpanded && (
              <div className="mt-2 rounded-lg border border-secondary-200 dark:border-secondary-700 overflow-hidden">
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
                          <span className="bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded line-through">
                            {typeof change.from === 'object' ? JSON.stringify(change.from) : String(change.from)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-green-600 dark:text-green-400 break-all">
                          <span className="bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded font-medium">
                            {typeof change.to === 'object' ? JSON.stringify(change.to) : String(change.to)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsed.updates && Object.keys(parsed.updates).length > 0 && (
                  <details className="border-t border-secondary-200 dark:border-secondary-700">
                    <summary className="cursor-pointer px-3 py-2 text-xs text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 bg-secondary-50 dark:bg-secondary-900 transition-colors">
                      Chi tiết payload
                    </summary>
                    <pre className="p-3 text-xs text-secondary-500 overflow-x-auto bg-secondary-50 dark:bg-secondary-900/50">
                      {JSON.stringify(parsed.updates, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        );
      }

      // Case 2: Creation/Deletion (summary)
      return (
        <div className="mt-3">
          <button
            onClick={() => toggleExpand(log.id)}
            className="flex items-center gap-1.5 text-xs font-medium text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200 transition-colors"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            Xem chi tiết
          </button>
          {isExpanded && (
            <div className="mt-2 p-3 bg-secondary-50 dark:bg-secondary-900 rounded-lg text-xs">
              <pre className="whitespace-pre-wrap font-mono text-secondary-600 dark:text-secondary-400 overflow-x-auto">
                {JSON.stringify(parsed, null, 2)}
              </pre>
            </div>
          )}
        </div>
      );
    } catch {
      // Fallback for plain string
      if (!log.details) return null;
      return (
        <div className="mt-3">
          <button
            onClick={() => toggleExpand(log.id)}
            className="flex items-center gap-1.5 text-xs font-medium text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-200 transition-colors"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            Xem chi tiết
          </button>
          {isExpanded && (
            <div className="mt-2 p-3 bg-secondary-50 dark:bg-secondary-900 rounded-lg text-xs font-mono break-all text-secondary-600 dark:text-secondary-400">
              {log.details}
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            Nhật ký Hoạt động
          </h1>
          <p className="text-secondary-500 dark:text-secondary-400 text-sm">
            Theo dõi tất cả các thay đổi trong hệ thống
          </p>
        </div>
        <button
          onClick={() => fetchLogs()}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg text-secondary-700 dark:text-secondary-300 text-sm font-medium hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 overflow-hidden">
        <div className="p-4 flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên người dùng, mã..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-sm text-secondary-900 dark:text-white placeholder-secondary-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>

          {/* Action Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-sm text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer transition-colors"
            >
              <option value="">Tất cả hành động</option>
              <option value="Tạo">Tạo mới</option>
              <option value="Cập nhật">Cập nhật</option>
              <option value="Xóa">Xóa</option>
              <option value="export">Xuất báo cáo</option>
            </select>
          </div>

          {/* Entity Filter */}
          <div className="relative">
            <Settings className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-sm text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer transition-colors"
            >
              <option value="">Tất cả đối tượng</option>
              <option value="product">Sản phẩm</option>
              <option value="order">Đơn hàng</option>
              <option value="user">Người dùng</option>
              <option value="category">Danh mục</option>
              <option value="coupon">Mã giảm giá</option>
              <option value="banner">Banner</option>
              <option value="settings">Cài đặt</option>
            </select>
          </div>

          {/* Date Filter */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-sm text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-colors"
          />
        </div>

        {/* Active Filters Summary */}
        {(actionFilter || entityFilter || dateFilter || searchQuery) && (
          <div className="px-4 pb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-secondary-500 dark:text-secondary-400">Đang lọc:</span>
            {actionFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs font-medium">
                {ACTION_MAP[actionFilter] || actionFilter}
                <button onClick={() => setActionFilter('')} className="hover:text-primary-900 dark:hover:text-white">×</button>
              </span>
            )}
            {entityFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium">
                {ENTITY_MAP[entityFilter] || entityFilter}
                <button onClick={() => setEntityFilter('')} className="hover:text-blue-900 dark:hover:text-white">×</button>
              </span>
            )}
            {dateFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 text-xs font-medium">
                {dateFilter}
                <button onClick={() => setDateFilter('')} className="hover:text-secondary-900 dark:hover:text-white">×</button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-100 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 text-xs font-medium">
                "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-secondary-900 dark:hover:text-white">×</button>
              </span>
            )}
            <button
              onClick={() => { setActionFilter(''); setEntityFilter(''); setDateFilter(''); setSearchQuery(''); }}
              className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors"
            >
              Xóa tất cả
            </button>
          </div>
        )}
      </div>

      {/* AI Insight */}
      <AIInsightPanel
        title="AI Phân tích hoạt động"
        prompt="Phân tích nhật ký hoạt động hệ thống. Phát hiện hành vi bất thường, đánh giá tần suất thao tác, và đề xuất cải thiện quy trình vận hành."
        dataContext={(() => {
          const lines: string[] = [`Tổng lượt hoạt động: ${totalLogs}`];
          if (logs.length > 0) {
            const actionCounts: Record<string, number> = {};
            const userCounts: Record<string, number> = {};
            logs.forEach((l: any) => {
              actionCounts[l.action] = (actionCounts[l.action] || 0) + 1;
              const name = l.user?.full_name || l.user?.username || 'Unknown';
              userCounts[name] = (userCounts[name] || 0) + 1;
            });
            lines.push(`Loại thao tác (trang hiện tại): ${Object.entries(actionCounts).map(([k,v]) => `${k}: ${v}`).join(', ')}`);
            lines.push(`Nhân viên hoạt động: ${Object.entries(userCounts).sort((a,b) => b[1] - a[1]).slice(0, 5).map(([k,v]) => `${k}: ${v} lần`).join(', ')}`);
            lines.push(`Hoạt động gần nhất: ${logs.slice(0, 3).map((l: any) => `${l.action} - ${l.entity_type || ''} (${new Date(l.created_at).toLocaleString('vi-VN')})`).join('; ')}`);
          }
          return lines.join('\n');
        })()}
      />

      {/* Logs List */}
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
              {(actionFilter || entityFilter || dateFilter || searchQuery) ? 'Thử thay đổi bộ lọc' : 'Các hoạt động sẽ hiển thị ở đây'}
            </p>
          </div>
        ) : (
          <>
            {/* Header bar */}
            <div className="px-4 py-3 bg-secondary-50 dark:bg-secondary-900/50 border-b border-secondary-200 dark:border-secondary-700 flex items-center justify-between">
              <span className="text-xs font-semibold text-secondary-500 dark:text-secondary-400 uppercase tracking-wider">
                {totalLogs > 0 ? `${totalLogs} bản ghi` : `${logs.length} bản ghi`}
              </span>
              <span className="text-xs text-secondary-400 dark:text-secondary-500">
                Trang {page}/{Math.max(1, totalPages)}
              </span>
            </div>

            {/* Log Items */}
            <div className="divide-y divide-secondary-100 dark:divide-secondary-700/50">
              {logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-secondary-50/50 dark:hover:bg-secondary-900/30 transition-colors group">
                  <div className="flex items-start gap-3">
                    {/* Action Icon */}
                    <div className={`p-2 rounded-lg shrink-0 ${getActionColor(log.action)} transition-colors`}>
                      {getActionIcon(log.action)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          {/* Action Title */}
                          <p className="font-medium text-secondary-900 dark:text-white text-sm">
                            {formatAction(log.action)}
                            {log.entity_type && (
                              <span className="text-secondary-500 dark:text-secondary-400 font-normal"> — {formatEntity(log.entity_type)}</span>
                            )}
                            {log.entity_id && (
                              <span className="ml-1.5 text-xs font-mono text-secondary-400 dark:text-secondary-500">#{log.entity_id.slice(0, 8)}</span>
                            )}
                          </p>

                          {/* Meta Info */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                            <span className="flex items-center gap-1 text-xs text-secondary-500 dark:text-secondary-400">
                              <User className="w-3 h-3" />
                              {log.user?.full_name || log.user?.username || 'System'}
                            </span>
                            {log.user?.role && getRoleBadge(log.user.role)}
                            <span className="flex items-center gap-1 text-xs text-secondary-400 dark:text-secondary-500" title={new Date(log.created_at).toLocaleString('vi-VN')}>
                              <Clock className="w-3 h-3" />
                              {formatRelativeTime(log.created_at)}
                            </span>
                            {log.ip_address && (
                              <span className="flex items-center gap-1 text-[11px] bg-secondary-100 dark:bg-secondary-700 text-secondary-500 dark:text-secondary-400 px-1.5 py-0.5 rounded font-mono">
                                <Monitor className="w-3 h-3" />
                                {log.ip_address}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Timestamp (visible on hover on desktop) */}
                        <span className="hidden lg:block text-xs text-secondary-400 dark:text-secondary-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                          {new Date(log.created_at).toLocaleString('vi-VN')}
                        </span>
                      </div>

                      {/* Details */}
                       {renderDetails(log)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
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
      </div>

    </div>
  );
}
