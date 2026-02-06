import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Loader2, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer?: any; // If editing
}

export default function CustomerModal({ isOpen, onClose, onSuccess, customer }: CustomerModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer',
    status: 'active',
    // Address fields
    address_line1: '',
    address_line2: '',
    city: '',
    province: ''
  });
  const [shippingAddresses, setShippingAddresses] = useState<any[]>([]);

  // Fetch full customer data when modal opens for editing
  useEffect(() => {
    const fetchCustomerDetails = async () => {
      if (customer && isOpen) {
        setFetchingData(true);
        try {
          const res = await adminAPI.getUserById(customer.id);
          if (res.data.success) {
            const data = res.data.data;
            setFormData({
              full_name: data.full_name || '',
              email: data.email || '',
              phone: data.phone || '',
              password: '',
              role: data.role || 'customer',
              status: data.status || 'active',
              address_line1: data.address_line1 || '',
              address_line2: data.address_line2 || '',
              city: data.city || '',
              province: data.province || ''
            });
            setShippingAddresses(data.shipping_addresses || []);
          }
        } catch (error) {
          console.error('Failed to fetch customer details:', error);
          // Fallback to passed customer data
          setFormData({
            full_name: customer.full_name || '',
            email: customer.email || '',
            phone: customer.phone || '',
            password: '',
            role: customer.role || 'customer',
            status: customer.status || 'active',
            address_line1: customer.address_line1 || '',
            address_line2: customer.address_line2 || '',
            city: customer.city || '',
            province: customer.province || ''
          });
          setShippingAddresses(customer.shipping_addresses || []);
        } finally {
          setFetchingData(false);
        }
      } else if (!customer && isOpen) {
        // Reset for new customer
        setFormData({
          full_name: '',
          email: '',
          phone: '',
          password: '',
          role: 'customer',
          status: 'active',
          address_line1: '',
          address_line2: '',
          city: '',
          province: ''
        });
        setShippingAddresses([]);
      }
    };

    fetchCustomerDetails();
  }, [customer, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Email không đúng định dạng');
      return;
    }

    // Vietnamese phone number validation (starts with 0, 10-11 digits)
    if (formData.phone) {
      const phoneRegex = /^0[0-9]{9,10}$/;
      if (!phoneRegex.test(formData.phone)) {
        toast.error('Số điện thoại không hợp lệ (VD: 0901234567)');
        return;
      }
    }

    setLoading(true);

    try {
      if (customer) {
        // Edit mode - send all editable fields including address
         await adminAPI.updateUser(customer.id, {
             full_name: formData.full_name,
             email: formData.email,
             phone: formData.phone,
             role: formData.role,
             status: formData.status,
             address_line1: formData.address_line1,
             address_line2: formData.address_line2,
             city: formData.city,
             province: formData.province
         });
         toast.success('Cập nhật khách hàng thành công');
      } else {
        // Create mode
        if (!formData.password) {
            toast.error('Vui lòng nhập mật khẩu');
            setLoading(false);
            return;
        }
        await adminAPI.createUser(formData);
        toast.success('Tạo khách hàng thành công');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <X className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      {customer ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
                    </Dialog.Title>
                    
                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                      {/* Name, Email, Phone - always shown */}
                      <div>
                          <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
                          <input
                          type="text"
                          value={formData.full_name}
                          onChange={e => setFormData({...formData, full_name: e.target.value})}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                          required
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <input
                          type="email"
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                          required
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                          <input
                          type="tel"
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                          />
                      </div>
                      
                      {/* Password - only for new users */}
                      {!customer && (
                           <div>
                              <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                              <input
                              type="password"
                              value={formData.password}
                              onChange={e => setFormData({...formData, password: e.target.value})}
                              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                              required
                              />
                          </div>
                      )}

                      {/* Status - Always editable */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                        <select
                            value={formData.status}
                            onChange={e => setFormData({...formData, status: e.target.value})}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                        >
                            <option value="active">Hoạt động</option>
                            <option value="blocked">Đã chặn</option>
                        </select>
                      </div>

                      {/* Address Fields - Show ONLY if no shipping addresses (Guest/Legacy) */}
                      {shippingAddresses.length === 0 && (
                        <div className="border-t pt-4 mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Địa chỉ (Khách vãng lai)</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs text-gray-500">Địa chỉ 1</label>
                              <input
                                type="text"
                                value={formData.address_line1}
                                onChange={e => setFormData({...formData, address_line1: e.target.value})}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                                placeholder="Số nhà, đường"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500">Địa chỉ 2 (tùy chọn)</label>
                              <input
                                type="text"
                                value={formData.address_line2}
                                onChange={e => setFormData({...formData, address_line2: e.target.value})}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                                placeholder="Phường/Xã"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-gray-500">Quận/Huyện</label>
                                <input
                                  type="text"
                                  value={formData.city}
                                  onChange={e => setFormData({...formData, city: e.target.value})}
                                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500">Tỉnh/Thành phố</label>
                                <input
                                  type="text"
                                  value={formData.province}
                                  onChange={e => setFormData({...formData, province: e.target.value})}
                                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Shipping Addresses List (Read Only) */}
                      {shippingAddresses.length > 0 && (
                        <div className="border-t pt-4 mt-4">
                           <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                             <MapPin className="w-4 h-4" />
                             Sổ địa chỉ khác ({shippingAddresses.length})
                           </h4>
                           <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                              {shippingAddresses.map((addr: any, idx: number) => (
                                <div key={idx} className="bg-gray-50 p-3 rounded-md text-xs border border-gray-200">
                                   <div className="flex justify-between font-medium text-gray-900 mb-1">
                                      <span>{addr.full_name}</span>
                                      <span className="text-gray-500">{addr.phone}</span>
                                   </div>
                                   <p className="text-gray-600">
                                      {addr.address_line1}, {addr.city}, {addr.province}
                                   </p>
                                </div>
                              ))}
                           </div>
                        </div>
                      )}

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={loading}
                          className="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 sm:ml-3 sm:w-auto disabled:opacity-50"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (customer ? 'Cập nhật' : 'Tạo mới')}
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                          onClick={onClose}
                        >
                          Hủy
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
