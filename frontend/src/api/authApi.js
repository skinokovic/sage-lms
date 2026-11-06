import axiosClient from "./axiosClient";

// These paths assume your Express routes are mounted at /api/auth/*
// (adjust to match your backend's actual route names).
export const authApi = {
  login: (credentials) => axiosClient.post("/auth/login", credentials),
  register: (payload) => axiosClient.post("/auth/signup", payload),

  googleLogin: (accessToken) =>
    axiosClient.post("/auth/google", { accessToken }),
  facebookLogin: (accessToken) =>
    axiosClient.post("/auth/facebook", { accessToken }),

  me: () => axiosClient.get("/auth/me"),
  forgotPassword: (email) =>
    axiosClient.post("/auth/forgot-password", { email }),

  resetPassword: (token, password) =>
    axiosClient.post("/auth/reset-password", {
      token,
      password,
    }),

  createStudent: (payload) => axiosClient.post("/admin/students", payload),

  createInstructor: (payload) =>
    axiosClient.post("/admin/instructors", payload),

  changePassword: (payload) =>
    axiosClient.patch("/auth/change-password", payload),
};
