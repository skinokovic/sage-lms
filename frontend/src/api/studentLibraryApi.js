import axiosClient from "./axiosClient";

export const studentLibraryApi = {
  getAll: () => axiosClient.get("/student/library"),
};
