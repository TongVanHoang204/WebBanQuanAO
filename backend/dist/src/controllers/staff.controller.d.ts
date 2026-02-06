import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
/**
 * Get all staff members (non-customer users)
 * GET /api/admin/staff
 */
export declare const getStaffList: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Get staff member by ID
 * GET /api/admin/staff/:id
 */
export declare const getStaffById: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Create new staff member
 * POST /api/admin/staff
 */
export declare const createStaff: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Update staff member
 * PUT /api/admin/staff/:id
 */
export declare const updateStaff: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Delete staff member
 * DELETE /api/admin/staff/:id
 */
export declare const deleteStaff: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get all available roles/permissions
 * GET /api/admin/roles
 */
export declare const getRoles: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Create new role
 * POST /api/admin/roles
 */
export declare const createRole: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Update role
 * PUT /api/admin/roles/:id
 */
export declare const updateRole: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Delete role
 * DELETE /api/admin/roles/:id
 */
export declare const deleteRole: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=staff.controller.d.ts.map