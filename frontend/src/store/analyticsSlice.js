import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { analyticsApi } from "../api/analyticsApi";

export const fetchAnalytics = createAsyncThunk(
  "analytics/fetchAnalytics",
  async (range = "30d", { rejectWithValue }) => {
    try {
      const response = await analyticsApi.getAnalytics(range);

      return response.data?.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to load analytics",
      );
    }
  },
);

const initialState = {
  data: null,
  status: "idle",
  error: null,
};

const analyticsSlice = createSlice({
  name: "analytics",

  initialState,

  reducers: {
    clearAnalytics: (state) => {
      state.data = null;
      state.status = "idle";
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder

      .addCase(fetchAnalytics.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })

      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
        state.error = null;
      })

      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to load analytics";
      });
  },
});

export const { clearAnalytics } = analyticsSlice.actions;

export default analyticsSlice.reducer;
