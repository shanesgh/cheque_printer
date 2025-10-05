import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserType, UserRole } from '@/types/user';

interface UserStore {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  userId: number;
  permissions: string[];
  signatureImage?: string;
  users: UserType[];
  setUserData: (data: { firstName: string; lastName: string; email: string }) => void;
  setRole: (role: UserRole) => void;
  setSignatureImage: (signature: string | undefined) => void;
  setUsers: (users: UserType[]) => void;
  addUser: (user: UserType) => void;
  updateUser: (userId: number, updates: Partial<UserType>) => void;
  deleteUser: (userId: number) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      role: UserRole.Admin,
      userId: 1,
      permissions: ['all'],
      signatureImage: undefined,
      users: [],
      setUserData: (data) => set(data),
      setRole: (role) => set({ role }),
      setSignatureImage: (signature) => set({ signatureImage: signature }),
      setUsers: (users) => set({ users }),
      addUser: (user) => set((state) => ({ users: [...state.users, user] })),
      updateUser: (userId, updates) =>
        set((state) => ({
          users: state.users.map((user) =>
            user.user_id === userId ? { ...user, ...updates } : user
          ),
        })),
      deleteUser: (userId) =>
        set((state) => ({
          users: state.users.filter((user) => user.user_id !== userId),
        })),
    }),
    {
      name: 'user-store',
    }
  )
);