// backend/src/services/userService.ts
import { User, IUser } from '../models/User';

interface ListParams { page: number; limit: number; q?: string; role?: string }

export const userService = {
  async listUsers({ page, limit, q, role }: ListParams): Promise<{ users: Partial<IUser & { id: string }>[]; totalCount: number; page: number; limit: number }> {
    const filter: any = {};
    if (q) {
      filter.email = { $regex: q, $options: 'i' };
    }
    if (role) {
      filter.$or = [{ role }, { roles: role }];
    }

    const [users, totalCount] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    const mapped = users.map((u: any) => ({ ...u, id: u._id?.toString?.() }));
    return { users: mapped, totalCount, page, limit };
  },

  async createUser(payload: Partial<IUser>): Promise<any> {
    const created = await User.create(payload as any);
    const obj: any = created.toObject();
    delete obj.password;
    obj.id = obj._id?.toString?.();
    return obj;
  },

  async updateUser(id: string, payload: Partial<IUser>): Promise<any | null> {
    const updated = await User.findByIdAndUpdate(id, payload, { new: true }).select('-password').lean();
    return updated ? { ...updated, id } : null;
  },

  async deleteUser(id: string): Promise<void> {
    await User.findByIdAndDelete(id);
  },

  async updateUserRole(id: string, role: string): Promise<any | null> {
    const updated = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-password').lean();
    return updated ? { ...updated, id } : null;
  },
};