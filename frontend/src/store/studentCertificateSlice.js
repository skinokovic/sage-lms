import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { certificatesApi } from "../api/certificatesApi";

const initialState = { items: [], status: "idle", error: null };

export const fetchMyCertificates = createAsyncThunk(
  "studentCertificates/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await certificatesApi.getMine();
      return data.certificates;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Couldn't load your certificates.",
      );
    }
  },
);

const studentCertificateSlice = createSlice({
  name: "studentCertificates",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyCertificates.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchMyCertificates.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchMyCertificates.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.items = [];
      });
  },
});

export default studentCertificateSlice.reducer;
