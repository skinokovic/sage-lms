import axiosClient from "./axiosClient";

export const subscriberAdminApi = {
  list: (params) => axiosClient.get("/subscribers", { params }),
  remove: (id) => axiosClient.delete(`/subscribers/${id}`),
};

export const contactAdminApi = {
  list: (params) => axiosClient.get("/contact", { params }),
  setStatus: (id, status) => axiosClient.patch(`/contact/${id}`, { status }),
  remove: (id) => axiosClient.delete(`/contact/${id}`),
};
