import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { studentCoursesApi } from "../api/studentCoursesApi";

const initialState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchMyCourses = createAsyncThunk(
  "studentCourses/fetchMine",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await studentCoursesApi.getMyCourses();
      return data.courses;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Couldn't load your courses.",
      );
    }
  },
);

const studentCourseSlice = createSlice({
  name: "studentCourses",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyCourses.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchMyCourses.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchMyCourses.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.items = [];
      });
  },
});

export default studentCourseSlice.reducer;
