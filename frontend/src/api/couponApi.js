import axiosClient from "./axiosClient";

// Student / visitor side
export const couponApi = {
  // items: [{ courseId }]
  validate: (code, items) =>
    axiosClient.post("/coupons/validate", { code, items }),
};

// Admin side
export const couponAdminApi = {
  list: (params) => axiosClient.get("/admin/coupons", { params }),
  create: (payload) => axiosClient.post("/admin/coupons", payload),
  update: (id, payload) => axiosClient.patch(`/admin/coupons/${id}`, payload),
  setStatus: (id, isActive) =>
    axiosClient.patch(`/admin/coupons/${id}/status`, { isActive }),
  remove: (id) => axiosClient.delete(`/admin/coupons/${id}`),
  redemptions: (id) => axiosClient.get(`/admin/coupons/${id}/redemptions`),
};
