import axiosClient from "./axiosClient";

export const adminBankTransferApi = {
  list: (params) => axiosClient.get("/admin/bank-transfers", { params }),
  approve: (id, payload) =>
    axiosClient.post(`/admin/bank-transfers/${id}/approve`, payload),
  reject: (id, payload) =>
    axiosClient.post(`/admin/bank-transfers/${id}/reject`, payload),
};
