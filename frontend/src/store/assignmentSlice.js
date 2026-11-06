import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { assignmentApi } from "../api/assignmentApi";

const initialState = {
  assignments: [],
  selectedAssignment: null,
  status: "idle",
  actionStatus: "idle",
  error: null,
};

export const fetchAssignments = createAsyncThunk(
  "assignments/fetchAssignments",
  async (_, { rejectWithValue }) => {
    try {
      const response = await assignmentApi.getAssignments();
      return response.data?.data || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to load assignments",
      );
    }
  },
);

export const fetchAssignment = createAsyncThunk(
  "assignments/fetchAssignment",
  async (id, { rejectWithValue }) => {
    try {
      const response = await assignmentApi.getAssignment(id);
      return response.data?.data || null;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to load assignment",
      );
    }
  },
);

export const createAssignment = createAsyncThunk(
  "assignments/createAssignment",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await assignmentApi.createAssignment(payload);
      return response.data?.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to create assignment",
      );
    }
  },
);

export const updateAssignment = createAsyncThunk(
  "assignments/updateAssignment",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await assignmentApi.updateAssignment(id, payload);
      return response.data?.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to update assignment",
      );
    }
  },
);

export const deleteAssignment = createAsyncThunk(
  "assignments/deleteAssignment",
  async (id, { rejectWithValue }) => {
    try {
      await assignmentApi.deleteAssignment(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete assignment",
      );
    }
  },
);

export const updateAssignmentStatus = createAsyncThunk(
  "assignments/updateAssignmentStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await assignmentApi.updateAssignmentStatus(id, status);

      return response.data?.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to update assignment status",
      );
    }
  },
);

const assignmentSlice = createSlice({
  name: "assignments",

  initialState,

  reducers: {
    clearSelectedAssignment: (state) => {
      state.selectedAssignment = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // FETCH ALL
      .addCase(fetchAssignments.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })

      .addCase(fetchAssignments.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.assignments = action.payload;
      })

      .addCase(fetchAssignments.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // FETCH ONE
      .addCase(fetchAssignment.pending, (state) => {
        state.actionStatus = "loading";
        state.error = null;
      })

      .addCase(fetchAssignment.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        state.selectedAssignment = action.payload;
      })

      .addCase(fetchAssignment.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.error = action.payload;
      })

      // CREATE
      .addCase(createAssignment.pending, (state) => {
        state.actionStatus = "loading";
        state.error = null;
      })

      .addCase(createAssignment.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        state.assignments.unshift(action.payload);
      })

      .addCase(createAssignment.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.error = action.payload;
      })

      // UPDATE
      .addCase(updateAssignment.pending, (state) => {
        state.actionStatus = "loading";
        state.error = null;
      })

      .addCase(updateAssignment.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";

        const index = state.assignments.findIndex(
          (item) => item.id === action.payload.id,
        );

        if (index !== -1) {
          state.assignments[index] = action.payload;
        }

        state.selectedAssignment = action.payload;
      })

      .addCase(updateAssignment.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.error = action.payload;
      })

      // DELETE
      .addCase(deleteAssignment.pending, (state) => {
        state.actionStatus = "loading";
        state.error = null;
      })

      .addCase(deleteAssignment.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";

        state.assignments = state.assignments.filter(
          (item) => item.id !== action.payload,
        );
      })

      .addCase(deleteAssignment.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.error = action.payload;
      })

      // STATUS
      .addCase(updateAssignmentStatus.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";

        const index = state.assignments.findIndex(
          (item) => item.id === action.payload.id,
        );

        if (index !== -1) {
          state.assignments[index] = action.payload;
        }

        if (state.selectedAssignment?.id === action.payload.id) {
          state.selectedAssignment = action.payload;
        }
      })

      .addCase(updateAssignmentStatus.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.error = action.payload;
      });
  },
});

export const { clearSelectedAssignment } = assignmentSlice.actions;

export default assignmentSlice.reducer;
