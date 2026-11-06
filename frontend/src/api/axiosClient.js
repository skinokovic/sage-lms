import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";

const axiosClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("sage_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Lets the store register a logout callback without a circular import.
let onAuthFailure = () => {};
export const setAuthFailureHandler = (fn) => {
  onAuthFailure = fn;
};

let isRefreshing = false;
let waiting = [];

const flushWaiting = (error, token) => {
  waiting.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token),
  );
  waiting = [];
};

const AUTH_PATHS = ["/auth/login", "/auth/signup", "/auth/refresh"];

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const isAuthPath = AUTH_PATHS.some((p) => original?.url?.includes(p));

    if (status !== 401 || !original || original._retry || isAuthPath) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("sage_refresh_token");
    if (!refreshToken) {
      onAuthFailure();
      return Promise.reject(error);
    }

    // If a refresh is already running, wait for it instead of starting another.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        waiting.push({ resolve, reject });
      }).then((token) => {
        original._retry = true;
        original.headers.Authorization = `Bearer ${token}`;
        return axiosClient(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      // Plain axios here so this call doesn't go through the interceptors.
      const { data } = await axios.post(`${baseURL}/auth/refresh`, {
        refreshToken,
      });
      localStorage.setItem("sage_token", data.accessToken);
      flushWaiting(null, data.accessToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return axiosClient(original);
    } catch (refreshError) {
      flushWaiting(refreshError, null);
      onAuthFailure();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default axiosClient;
