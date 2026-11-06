import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authApi } from "../api/authApi";

const storedToken = localStorage.getItem("sage_token");

const initialState = {
  user: null,
  token: storedToken || null,
  status: storedToken ? "checking" : "idle",
  error: null,
};

/*
|--------------------------------------------------------------------------
| Initialize Authentication
|--------------------------------------------------------------------------
| Runs when the application starts.
|
| If a token exists in localStorage, we ask the backend:
|
| "Who does this token belong to?"
|
| This restores the user after a browser refresh.
|--------------------------------------------------------------------------
*/
export const initializeAuth = createAsyncThunk(
  "auth/initialize",
  async (_, { rejectWithValue }) => {
    const token = localStorage.getItem("sage_token");

    if (!token) {
      return null;
    }

    try {
      const { data } = await authApi.me();

      return data;
    } catch (err) {
      // A 401 here means /auth/me failed AND the refresh attempt failed too.
      if (err.response?.status === 401) {
        localStorage.removeItem("sage_token");
        localStorage.removeItem("sage_refresh_token");
      }
      return rejectWithValue(
        err.response?.data?.message || "Authentication expired.",
      );
    }
  },
);

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/
export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await authApi.login(credentials);

      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ||
          "Couldn't log in. Check your details and try again.",
      );
    }
  },
);

/*
|--------------------------------------------------------------------------
| Register
|--------------------------------------------------------------------------
*/
export const registerUser = createAsyncThunk(
  "auth/register",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await authApi.register(payload);

      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ||
          "Couldn't create your account. Please try again.",
      );
    }
  },
);

export const googleLogin = createAsyncThunk(
  "auth/googleLogin",
  async (accessToken, { rejectWithValue }) => {
    try {
      const { data } = await authApi.googleLogin(accessToken);

      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Couldn't sign in with Google.",
      );
    }
  },
);

export const facebookLogin = createAsyncThunk(
  "auth/facebookLogin",
  async (accessToken, { rejectWithValue }) => {
    try {
      const { data } = await authApi.facebookLogin(accessToken);

      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Couldn't sign in with Facebook.",
      );
    }
  },
);

/*
|--------------------------------------------------------------------------
| Auth Slice
|--------------------------------------------------------------------------
*/
const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.status = "idle";
      state.error = null;

      localStorage.removeItem("sage_token");
      localStorage.removeItem("sage_refresh_token");
    },

    clearAuthError(state) {
      state.error = null;
    },

    setUser(state, action) {
      state.user = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder

      /*
      |--------------------------------------------------------------------------
      | Initialize Auth
      |--------------------------------------------------------------------------
      */
      .addCase(initializeAuth.pending, (state) => {
        state.status = "checking";
        state.error = null;
      })

      .addCase(initializeAuth.fulfilled, (state, action) => {
        if (!action.payload) {
          state.user = null;
          state.token = null;
          state.status = "idle";
          return;
        }

        state.user = action.payload.user;
        state.status = "succeeded";
      })

      .addCase(initializeAuth.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.status = "idle";
      })

      /*
      |--------------------------------------------------------------------------
      | Login
      |--------------------------------------------------------------------------
      */
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })

      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";

        state.user = action.payload.user;

        /*
        IMPORTANT:
        Backend returns accessToken, NOT token.
        */
        state.token = action.payload.accessToken;
        localStorage.setItem("sage_refresh_token", action.payload.refreshToken);
        localStorage.setItem("sage_token", action.payload.accessToken);
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      /*
      |--------------------------------------------------------------------------
      | Register
      |--------------------------------------------------------------------------
      */
      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })

      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = "succeeded";

        state.user = action.payload.user;

        state.token = action.payload.accessToken;
        localStorage.setItem("sage_refresh_token", action.payload.refreshToken);
        localStorage.setItem("sage_token", action.payload.accessToken);
      })

      .addCase(registerUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      .addCase(googleLogin.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })

      .addCase(googleLogin.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        localStorage.setItem("sage_refresh_token", action.payload.refreshToken);
        localStorage.setItem("sage_token", action.payload.accessToken);
      })

      .addCase(googleLogin.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      .addCase(facebookLogin.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })

      .addCase(facebookLogin.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        localStorage.setItem("sage_refresh_token", action.payload.refreshToken);
        localStorage.setItem("sage_token", action.payload.accessToken);
      })

      .addCase(facebookLogin.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { logout, clearAuthError, setUser } = authSlice.actions;

export default authSlice.reducer;
