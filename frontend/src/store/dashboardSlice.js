import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { dashboardApi } from "../api/dashboardApi";

export const fetchAdminDashboard = createAsyncThunk(
  "dashboard/fetchAdminDashboard",
  async (months = 6, { rejectWithValue }) => {
    try {
      const response = await dashboardApi.getDashboard(months);
      return response.data?.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to load dashboard",
      );
    }
  },
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: { data: null, status: "idle", error: null },
  reducers: {
    clearDashboard: (state) => {
      state.data = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminDashboard.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchAdminDashboard.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to load dashboard";
      });
  },
});

export const { clearDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;
