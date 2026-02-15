import { useState, useEffect } from 'react';
import {
  Activity, 
  Filter,
  Clock,
  User,
  Monitor
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { resolveApiUrl, adminAPI } from '../../../services/api';
import AIInsightPanel from '../../../components/common/AIInsightPanel';

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

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (actionFilter) params.action = actionFilter;
      if (dateFilter) params.start_date = dateFilter;

      const res = await fetch(resolveApiUrl(`/api/admin/logs?${new URLSearchParams(params)}`), {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const data = await res.json();
      if (data.success) {
        setLogs(data.data.logs);
      }
    } catch (error) {
      toast.error('Không thể tải nhật ký');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, dateFilter]);

  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20';
    if (action.includes('update')) return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20';
    if (action.includes('delete')) return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20';
    return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800';
  };

  const ACTION_MAP: Record<string, string> = {
    create: 'Tạo mới',
    update: 'Cập nhật',
    delete: 'Xóa',
    login: 'Đăng nhập',
    logout: 'Đăng xuất',
    export: 'Xuất báo cáo',
    import: 'Nhập dữ liệu'
  };

  const ENTITY_MAP: Record<string, string> = {
    product: 'Sản phẩm',
    order: 'Đơn hàng',
    user: 'Người dùng',
    category: 'Danh mục',
    brand: 'Thương hiệu',
    coupon: 'Mã giảm giá',
    system: 'Hệ thống',
    settings: 'Cài đặt'
  };

  const formatAction = (action: string, entityType: string) => {
    // Try to find exact match first
    if (ACTION_MAP[action]) return ACTION_MAP[action];
    
    // Fallback: Check inclusion
    if (action.includes('create')) return 'Tạo mới';
    if (action.includes('update')) return 'Cập nhật';
    if (action.includes('delete')) return 'Xóa';
    
    return action;
  };
  
  const formatEntity = (entity: string) => {
    return ENTITY_MAP[entity.toLowerCase()] || entity;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
          Nhật ký Hoạt động
        </h1>
        <p className="text-secondary-500 dark:text-secondary-400">
          Theo dõi các thay đổi trong hệ thống
        </p>
      </div>

      {/* AI Anomaly Detection */}
      <AIInsightPanel
        title="🔍 AI Phân tích & Phát hiện bất thường"
        cacheKey="log_anomaly"
        onAnalyze={async () => {
          const res = await adminAPI.aiLogAnalyze();
          return res.data.data;
        }}
        type="custom"
        renderContent={(data: any) => (
          <div className="space-y-3">
            {data.summary && <p className="text-sm text-secondary-700 dark:text-secondary-300">{data.summary}</p>}
            {data.anomalies && data.anomalies.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-500 uppercase mb-1">⚠️ Bất thường phát hiện</p>
                <ul className="space-y-1">
                  {data.anomalies.map((a: any, i: number) => (
                    <li key={i} className="text-sm text-red-600 dark:text-red-400 flex items-start gap-1">
                      <span className="shrink-0">•</span> {typeof a === 'string' ? a : a.description || a.type || JSON.stringify(a)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.top_users && data.top_users.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-secondary-500 uppercase mb-1">Người dùng hoạt động nhiều nhất</p>
                <div className="flex flex-wrap gap-2">
                  {data.top_users.map((u: any, i: number) => (
                    <span key={i} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs">
                      {u.name || u.username}: {u.count} thao tác
                    </span>
                  ))}
                </div>
              </div>
            )}
            {data.recommendations && (
              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">💡 Khuyến nghị</p>
                <p className="text-sm text-secondary-700 dark:text-secondary-300">{typeof data.recommendations === 'string' ? data.recommendations : Array.isArray(data.recommendations) ? data.recommendations.map((r: any) => typeof r === 'string' ? r : r.description || r.text || JSON.stringify(r)).join(', ') : JSON.stringify(data.recommendations)}</p>
              </div>
            )}
          </div>
        )}
      />

      {/* Filters */}
      <div className="bg-white dark:bg-secondary-800 rounded-xl p-4 shadow-sm border border-secondary-200 dark:border-secondary-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Tất cả hành động</option>
              <option value="create">Tạo mới</option>
              <option value="update">Cập nhật</option>
              <option value="delete">Xóa</option>
              <option value="login">Đăng nhập</option>
              <option value="export">Xuất báo cáo</option>
            </select>
          </div>
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-white dark:bg-secondary-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm border border-secondary-200 dark:border-secondary-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-secondary-500">Đang tải...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-12 h-12 mx-auto text-secondary-300 mb-4" />
            <p className="text-secondary-500">Chưa có nhật ký nào</p>
          </div>
        ) : (
          <div className="divide-y divide-secondary-200 dark:divide-secondary-700">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-secondary-50 dark:hover:bg-secondary-900/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg shrink-0 ${getActionColor(log.action)}`}>
                    <Activity className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-secondary-900 dark:text-white">
                          {formatAction(log.action, log.entity_type)} {log.entity_type ? `- ${formatEntity(log.entity_type)}` : ''}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-secondary-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {log.user?.full_name || log.user?.username || 'System'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(log.created_at).toLocaleString('vi-VN')}
                          </span>
                          {log.ip_address && (
                            <span className="flex items-center gap-1 text-xs bg-secondary-100 dark:bg-secondary-700 px-2 py-0.5 rounded">
                              <Monitor className="w-3 h-3" />
                              {log.ip_address}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {log.details && ((() => {
                      try {
                        const parsed = JSON.parse(log.details);
                        // Case 1: Has Diff (Update)
                        if (parsed.diff) {
                          return (
                            <div className="mt-2 text-sm bg-secondary-50 dark:bg-secondary-900 rounded-lg p-3">
                              <p className="font-semibold text-xs text-secondary-500 uppercase mb-2">Thay đổi:</p>
                              <div className="grid gap-2">
                                {Object.entries(parsed.diff).map(([field, change]: [string, any]) => (
                                  <div key={field} className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="font-medium text-secondary-700 dark:text-secondary-300 min-w-[100px]">{field}:</span>
                                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded line-through decoration-red-500/50">
                                      {typeof change.from === 'object' ? JSON.stringify(change.from) : String(change.from)}
                                    </span>
                                    <span className="text-secondary-400">→</span>
                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
                                      {typeof change.to === 'object' ? JSON.stringify(change.to) : String(change.to)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              {parsed.updates && Object.keys(parsed.updates).length > 0 && (
                                <details className="mt-2">
                                  <summary className="cursor-pointer text-xs text-secondary-400 hover:text-secondary-600">Chi tiết payload</summary>
                                  <pre className="mt-1 text-xs text-secondary-500 overflow-x-auto">
                                    {JSON.stringify(parsed.updates, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          );
                        }
                        // Case 2: Creation/Deletion (just showing key stats)
                        return (
                           <div className="mt-2 p-3 bg-secondary-50 dark:bg-secondary-900 rounded-lg text-xs font-mono break-all text-secondary-600 dark:text-secondary-400">
                              <pre className="whitespace-pre-wrap font-sans">{JSON.stringify(parsed, null, 2)}</pre>
                           </div>
                        );
                      } catch (e) {
                         // Fallback for plain string
                         return (
                            <div className="mt-2 p-3 bg-secondary-50 dark:bg-secondary-900 rounded-lg text-xs font-mono break-all text-secondary-600 dark:text-secondary-400">
                              {log.details}
                            </div>
                         );
                      }
                    })())}
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
