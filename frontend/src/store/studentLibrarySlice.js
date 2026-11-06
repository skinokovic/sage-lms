import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { studentLibraryApi } from "../api/studentLibraryApi";

const initialState = { items: [], status: "idle", error: null };

export const fetchLibraryCourses = createAsyncThunk(
  "studentLibrary/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await studentLibraryApi.getAll();
      return data.courses;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Couldn't load the course library.",
      );
    }
  },
);

const studentLibrarySlice = createSlice({
  name: "studentLibrary",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLibraryCourses.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchLibraryCourses.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchLibraryCourses.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.items = [];
      });
  },
});

export default studentLibrarySlice.reducer;
