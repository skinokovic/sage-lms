import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { studentGradesApi } from "../api/studentGradesApi";

const initialState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchMyGrades = createAsyncThunk(
  "studentGrades/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await studentGradesApi.getAll();
      return data.grades;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Couldn't load your grades.",
      );
    }
  },
);

const studentGradeSlice = createSlice({
  name: "studentGrades",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyGrades.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchMyGrades.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchMyGrades.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.items = [];
      });
  },
});

export default studentGradeSlice.reducer;
