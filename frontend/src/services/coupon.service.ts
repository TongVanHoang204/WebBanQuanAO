import api from './api';

export const couponService = {
    getCoupons: async (params?: { page?: number; limit?: number; query?: string }) => {
        return api.get('/admin/coupons', { params });
    },
    getCoupon: async (id: number | string) => {
        return api.get(`/admin/coupons/${id}`);
    },
    createCoupon: async (data: any) => {
        return api.post('/admin/coupons', data);
    },
    updateCoupon: async (id: number | string, data: any) => {
        return api.put(`/admin/coupons/${id}`, data);
    },
    deleteCoupon: async (id: number | string) => {
        return api.delete(`/admin/coupons/${id}`);
    }
};
