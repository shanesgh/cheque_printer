import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserStore {
  firstName: string;
  lastName: string;
  email: string;
  setUserData: (data: { firstName: string; lastName: string; email: string }) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      setUserData: (data) => set(data),
    }),
    {
      name: 'user-store',
    }
  )
);