import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Ticket, ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { couponService } from '../../../services/coupon.service';
import { toast } from 'react-hot-toast';

export default function CouponDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = id && id !== 'new';
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      code: '',
      type: 'percent',
      value: 0,
      min_subtotal: 0,
      start_at: '',
      end_at: '',
      usage_limit: '',
      is_active: true
    }
  });

  useEffect(() => {
    if (isEdit) {
      const fetchCoupon = async () => {
        try {
          const res = await couponService.getCoupon(id);
          const data = res.data;
          // Format dates for input
          const formatDate = (d: string) => d ? new Date(d).toISOString().split('T')[0] : '';
          
          reset({
            ...data,
            value: Number(data.value),
            min_subtotal: Number(data.min_subtotal),
            start_at: formatDate(data.start_at),
            end_at: formatDate(data.end_at),
            usage_limit: data.usage_limit || ''
          });
        } catch (error) {
          toast.error('Không thể tải thông tin mã giảm giá');
          navigate('/admin/coupons');
        } finally {
          setLoading(false);
        }
      };
      fetchCoupon();
    }
  }, [id, isEdit, reset, navigate]);

  const onSubmit = async (data: any) => {
    try {
      setSaving(true);
      const payload = {
        ...data,
        value: Number(data.value),
        min_subtotal: Number(data.min_subtotal),
        usage_limit: data.usage_limit ? Number(data.usage_limit) : null,
        start_at: data.start_at || null,
        end_at: data.end_at || null
      };

      if (isEdit) {
        await couponService.updateCoupon(id, payload);
        toast.success('Cập nhật thành công');
      } else {
        await couponService.createCoupon(payload);
        toast.success('Tạo mã khuyến mãi thành công');
      }
      navigate('/admin/coupons');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/coupons"
          className="p-2 text-secondary-500 hover:bg-secondary-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white flex items-center gap-2">
            {isEdit ? 'Chỉnh sửa mã khuyến mãi' : 'Tạo mã khuyến mãi mới'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white dark:bg-secondary-800 rounded-xl border border-secondary-200 dark:border-secondary-700 shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Code */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Mã giảm giá (Code)
              </label>
              <div className="relative">
                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type="text"
                  {...register('code', { required: 'Vui lòng nhập mã', minLength: 3 })}
                  className="w-full pl-10 pr-4 py-2 bg-secondary-50 dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 rounded-lg focus:ring-2 focus:ring-primary-500 dark:text-white uppercase font-mono"
                  placeholder="VD: SALE50"
                />
              </div>
              {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message as string}</p>}
            </div>

            {/* Status */}
            <div className="flex items-center pt-8">
              <label className="flex items-center cursor-pointer gap-2">
                <input
                  type="checkbox"
                  {...register('is_active')}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300">Kích hoạt ngay</span>
              </label>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Loại giảm giá
              </label>
              <select
                {...register('type')}
                className="w-full px-4 py-2 bg-secondary-50 dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 rounded-lg focus:ring-2 focus:ring-primary-500 dark:text-white"
              >
                <option value="percent">Phần trăm (%)</option>
                <option value="fixed">Số tiền cố định (VNĐ)</option>
              </select>
            </div>

            {/* Value */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Giá trị giảm
              </label>
              <input
                type="number"
                {...register('value', { required: true, min: 0 })}
                className="w-full px-4 py-2 bg-secondary-50 dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 rounded-lg focus:ring-2 focus:ring-primary-500 dark:text-white"
              />
            </div>

            {/* Min Subtotal */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Giá trị đơn tối thiểu
              </label>
              <input
                type="number"
                {...register('min_subtotal')}
                className="w-full px-4 py-2 bg-secondary-50 dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 rounded-lg focus:ring-2 focus:ring-primary-500 dark:text-white"
              />
            </div>

            {/* Usage Limit */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Giới hạn lượt dùng (Để trống = Vô hạn)
              </label>
              <input
                type="number"
                {...register('usage_limit')}
                className="w-full px-4 py-2 bg-secondary-50 dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 rounded-lg focus:ring-2 focus:ring-primary-500 dark:text-white"
              />
            </div>

            {/* Dates */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Ngày bắt đầu
              </label>
              <input
                type="date"
                {...register('start_at')}
                className="w-full px-4 py-2 bg-secondary-50 dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 rounded-lg focus:ring-2 focus:ring-primary-500 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
                Ngày kết thúc
              </label>
              <input
                type="date"
                {...register('end_at')}
                className="w-full px-4 py-2 bg-secondary-50 dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-700 rounded-lg focus:ring-2 focus:ring-primary-500 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            to="/admin/coupons"
            className="px-6 py-2 border border-secondary-200 dark:border-secondary-700 rounded-lg text-secondary-600 dark:text-secondary-400 font-medium hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
          >
            Hủy
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'Cập nhật' : 'Tạo mới'}
          </button>
        </div>
      </form>
    </div>
  );
}
