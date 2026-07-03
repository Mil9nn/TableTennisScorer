import { axiosInstance } from "@/lib/axiosInstance";
import { LoginForm, RegisterForm } from "@/types/auth.d";
import { User } from "@/types/user.type";
import { AxiosError } from "axios";
import { Alert } from "react-native";
import { create } from "zustand";
import { useEffect } from "react";

interface AuthState {
  authLoading: boolean;
  authResolved: boolean;
  pendingVerificationEmail: string | null;
  setPendingVerificationEmail: (email: string | null) => void;
  fetchUser: () => Promise<void>;
  login: (credentials: LoginForm) => Promise<void>;
  register: (data: RegisterForm) => Promise<{ requiresVerification?: boolean; message?: string }>;
  logout: () => Promise<void>;
  deleteAccount: (data: {
    confirmation: "DELETE";
    password?: string;
  }) => Promise<void>;
  user: User | null;
  setUser: (user: User | null) => void;
}

export const useAuthInitialization = () => {
  const fetchUser = useAuthStore((state) => state.fetchUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);
};

export const useAuthStore = create<AuthState>((set) => ({
  authLoading: true,
  authResolved: false,
  pendingVerificationEmail: null,
  setPendingVerificationEmail: (email) => set({ pendingVerificationEmail: email }),
  user: null,
  setUser: (user) => set({ user }),

  async fetchUser() {
    set({ authLoading: true });
    try {
      const response = await axiosInstance.get("auth/me");
      const userData = response.data?.user;
      if (userData) {
        set({ user: userData, authResolved: true });
      } else {
        set({ user: null, authResolved: true });
      }
    } catch (error: any) {
      const status = error?.response?.status;
      if (status !== 401) {
        console.error("[useAuthStore] Fetch user error:", {
          message: error?.message,
          status,
        });
      }
      if (status === 401) {
        set({ user: null, authResolved: true });
      } else {
        set({ authResolved: false });
      }
    } finally {
      set({ authLoading: false });
    }
  },

  async login({ email, password }) {
    set({ authLoading: true });
    try {
      const response = await axiosInstance.post("auth/login", { email, password });
      if (response.data.user) {
        set({ user: response.data.user, authResolved: true });
      }
    } catch (error: AxiosError | any) {
      const status = error?.response?.status;
      const message =
        error?.response?.data?.message || "Login failed. Please try again.";

      if (status === 403 && error?.response?.data?.requiresVerification) {
        throw error;
      }

      if (status === 429) {
        Alert.alert("Too many attempts", "Please wait a few minutes and try again.");
      } else if (status !== 403) {
        Alert.alert("Login failed", message);
      }

      throw error;
    } finally {
      set({ authLoading: false });
    }
  },

  async register(data) {
    set({ authLoading: true });
    try {
      const response = await axiosInstance.post("auth/register", data);
      if (response.data.requiresVerification) {
        set({
          pendingVerificationEmail: data.email.trim().toLowerCase(),
        });
      }
      return response.data;
    } catch (error: AxiosError | any) {
      const status = error?.response?.status;
      const message =
        error?.response?.data?.message || "Registration failed. Please try again.";

      if (status === 400 && error?.response?.data?.errors?.length) {
        const firstError = error.response.data.errors[0]?.message;
        Alert.alert("Validation error", firstError || message);
      } else {
        Alert.alert("Registration failed", message);
      }
      throw error;
    } finally {
      set({ authLoading: false });
    }
  },

  async logout() {
    set({ authLoading: true });
    try {
      await axiosInstance.post("auth/logout");
      set({ user: null, authResolved: true, pendingVerificationEmail: null });
    } catch (error) {
      console.error("Logout error:", error);
      set({ user: null, authResolved: true, pendingVerificationEmail: null });
    } finally {
      set({ authLoading: false });
    }
  },

  async deleteAccount({ confirmation, password }) {
    await axiosInstance.post("auth/delete-account", {
      confirmation,
      password: password || undefined,
    });
    set({ user: null, authResolved: true, pendingVerificationEmail: null });
  },
}));
