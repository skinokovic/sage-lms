import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { studentAssignmentsApi } from "../api/studentAssignmentsApi";

const initialState = {
  items: [],
  listStatus: "idle",
  listError: null,

  current: null,
  currentStatus: "idle",
  currentError: null,

  submitting: false,
  submitError: null,
};

const errorMessage = (err, fallback) => err.response?.data?.message || fallback;

export const fetchMyAssignments = createAsyncThunk(
  "studentAssignments/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await studentAssignmentsApi.getAll();
      return data.assignments;
    } catch (err) {
      return rejectWithValue(errorMessage(err, "Couldn't load assignments."));
    }
  },
);

export const fetchMyAssignmentById = createAsyncThunk(
  "studentAssignments/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await studentAssignmentsApi.getById(id);
      return data.assignment;
    } catch (err) {
      return rejectWithValue(
        errorMessage(err, "Couldn't load this assignment."),
      );
    }
  },
);

export const submitMyAssignment = createAsyncThunk(
  "studentAssignments/submit",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const { data } = await studentAssignmentsApi.submit(id, formData);
      return data.assignment;
    } catch (err) {
      return rejectWithValue(errorMessage(err, "Couldn't submit your work."));
    }
  },
);

const studentAssignmentSlice = createSlice({
  name: "studentAssignments",
  initialState,
  reducers: {
    clearCurrentAssignment(state) {
      state.current = null;
      state.currentStatus = "idle";
      state.currentError = null;
      state.submitError = null;
    },
    clearSubmitError(state) {
      state.submitError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyAssignments.pending, (state) => {
        state.listStatus = "loading";
        state.listError = null;
      })
      .addCase(fetchMyAssignments.fulfilled, (state, action) => {
        state.listStatus = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchMyAssignments.rejected, (state, action) => {
        state.listStatus = "failed";
        state.listError = action.payload;
        state.items = [];
      })

      .addCase(fetchMyAssignmentById.pending, (state) => {
        state.currentStatus = "loading";
        state.currentError = null;
      })
      .addCase(fetchMyAssignmentById.fulfilled, (state, action) => {
        state.currentStatus = "succeeded";
        state.current = action.payload;
      })
      .addCase(fetchMyAssignmentById.rejected, (state, action) => {
        state.currentStatus = "failed";
        state.currentError = action.payload;
        state.current = null;
      })

      .addCase(submitMyAssignment.pending, (state) => {
        state.submitting = true;
        state.submitError = null;
      })
      .addCase(submitMyAssignment.fulfilled, (state, action) => {
        state.submitting = false;
        state.current = action.payload;
        state.items = state.items.map((item) =>
          item.id === action.payload.id ? { ...item, ...action.payload } : item,
        );
      })
      .addCase(submitMyAssignment.rejected, (state, action) => {
        state.submitting = false;
        state.submitError = action.payload;
      });
  },
});

export const { clearCurrentAssignment, clearSubmitError } =
  studentAssignmentSlice.actions;
export default studentAssignmentSlice.reducer;
