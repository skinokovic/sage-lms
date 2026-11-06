import axiosClient from "./axiosClient";

export const studentGradesApi = {
  getAll: () => axiosClient.get("/student/grades"),
};
