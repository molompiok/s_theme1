import { create } from "zustand";
import { combine, createJSONStorage, persist } from "zustand/middleware";
import { api } from "../api";

type User = {
  id: string;
  email: string;
  full_name: string;
  photo: string[];
} | null;

export const useAuthStore = create(
  persist(
    combine(
      {
        user: null as User,
        fetchUser: () => Promise<void>,
        logout: () => Promise<void>,
      },
      (set) => ({
        fetchUser: async () => {
          try {
            const { data } = await api.get("/me");
            set({ user: data.user });
          } catch (error) {
            set({ user: null });
          }
        },

        logout: async () => {
          await api.post("/logout");
          set({ user: null });
        },
      })
    ),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
