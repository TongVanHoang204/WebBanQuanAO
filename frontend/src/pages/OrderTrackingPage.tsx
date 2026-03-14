import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Search, Package, MapPin, Clock } from 'lucide-react';
import { ordersAPI } from '../services/api';
import { formatPrice } from '../hooks/useShop';

interface TrackedOrder {
  id: string;
  order_code: string;
  status: string;
  grand_total: number;
  customer_name: string;
  customer_phone: string;
  ship_address_line1: string;
  ship_city: string;
  ship_province: string;
  created_at: string;
}

export default function OrderTrackingPage() {
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOrder(null);

    if (!code.trim() || !phone.trim()) {
      setError('Vui long nhap day du ma don hang va so dien thoai');
      return;
    }

    setIsLoading(true);
    try {
      const response = await ordersAPI.getByCode(code.trim(), phone.trim());
      setOrder(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Khong tim thay don hang');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Theo doi don hang - Fashion Store</title>
      </Helmet>

      <div className="container-custom py-10">
        <div className="mx-auto max-w-2xl rounded-3xl border border-secondary-100 bg-white p-6 shadow-sm md:p-8">
          <h1 className="mb-2 text-2xl font-bold text-secondary-900">Theo doi don hang</h1>
          <p className="mb-6 text-sm text-secondary-500">
            Nhap ma don hang va so dien thoai da dat hang de xem trang thai moi nhat.
          </p>

          <form onSubmit={handleTrack} className="space-y-4">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ma don hang (VD: FS20260314-1234)"
              className="input"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="So dien thoai dat hang"
              className="input"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full rounded-full"
            >
              {isLoading ? 'Dang tra cuu...' : 'Tra cuu don hang'}
            </button>
          </form>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          )}

          {order && (
            <div className="mt-6 rounded-2xl border border-secondary-100 bg-secondary-50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500">Don hang</p>
                  <p className="text-lg font-bold text-secondary-900">#{order.order_code}</p>
                </div>
                <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
                  {order.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-secondary-700">
                <p className="flex items-center gap-2"><Clock className="h-4 w-4" /> {new Date(order.created_at).toLocaleString('vi-VN')}</p>
                <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {order.ship_address_line1}, {order.ship_city}, {order.ship_province}</p>
                <p className="flex items-center gap-2"><Package className="h-4 w-4" /> Tong tien: {formatPrice(order.grand_total)}</p>
              </div>

              <div className="mt-4">
                <Link to={`/orders/${order.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:underline">
                  <Search className="h-4 w-4" /> Xem chi tiet don hang
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
