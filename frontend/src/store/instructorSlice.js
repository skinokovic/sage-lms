import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { instructorApi } from "../api/instructorApi";

/*
|--------------------------------------------------------------------------
| FETCH ALL INSTRUCTORS
|--------------------------------------------------------------------------
*/

export const fetchInstructors = createAsyncThunk(
  "instructors/fetchInstructors",
  async (_, { rejectWithValue }) => {
    try {
      const response = await instructorApi.getInstructors();

      return response.data.data || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load instructors.",
      );
    }
  },
);

/*
|--------------------------------------------------------------------------
| FETCH SINGLE INSTRUCTOR
|--------------------------------------------------------------------------
*/

export const fetchInstructor = createAsyncThunk(
  "instructors/fetchInstructor",
  async (id, { rejectWithValue }) => {
    try {
      const response = await instructorApi.getInstructor(id);

      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load instructor.",
      );
    }
  },
);

/*
|--------------------------------------------------------------------------
| CREATE INSTRUCTOR
|--------------------------------------------------------------------------
*/

export const createInstructor = createAsyncThunk(
  "instructors/createInstructor",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await instructorApi.createInstructor(payload);

      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create instructor.",
      );
    }
  },
);

/*
|--------------------------------------------------------------------------
| UPDATE INSTRUCTOR
|--------------------------------------------------------------------------
*/

export const updateInstructor = createAsyncThunk(
  "instructors/updateInstructor",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const response = await instructorApi.updateInstructor(id, payload);

      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update instructor.",
      );
    }
  },
);

/*
|--------------------------------------------------------------------------
| DELETE INSTRUCTOR
|--------------------------------------------------------------------------
*/

export const deleteInstructor = createAsyncThunk(
  "instructors/deleteInstructor",
  async (id, { rejectWithValue }) => {
    try {
      await instructorApi.deleteInstructor(id);

      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to remove instructor.",
      );
    }
  },
);

/*
|--------------------------------------------------------------------------
| UPDATE STATUS
|--------------------------------------------------------------------------
*/

export const updateInstructorStatus = createAsyncThunk(
  "instructors/updateInstructorStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await instructorApi.updateInstructorStatus(id, status);

      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update instructor status.",
      );
    }
  },
);

/*
|--------------------------------------------------------------------------
| INITIAL STATE
|--------------------------------------------------------------------------
*/

const initialState = {
  instructors: [],
  selectedInstructor: null,

  status: "idle",
  actionStatus: "idle",

  error: null,
};

/*
|--------------------------------------------------------------------------
| SLICE
|--------------------------------------------------------------------------
*/

const instructorSlice = createSlice({
  name: "instructors",
  initialState,

  reducers: {
    clearInstructorError: (state) => {
      state.error = null;
    },

    clearSelectedInstructor: (state) => {
      state.selectedInstructor = null;
    },
  },

  extraReducers: (builder) => {
    builder

      /*
       * FETCH
       */

      .addCase(fetchInstructors.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })

      .addCase(fetchInstructors.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.instructors = action.payload;
      })

      .addCase(fetchInstructors.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      /*
       * FETCH ONE
       */

      .addCase(fetchInstructor.pending, (state) => {
        state.actionStatus = "loading";
        state.error = null;
      })

      .addCase(fetchInstructor.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        state.selectedInstructor = action.payload;
      })

      .addCase(fetchInstructor.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.error = action.payload;
      })

      /*
       * CREATE
       */

      .addCase(createInstructor.pending, (state) => {
        state.actionStatus = "loading";
        state.error = null;
      })

      .addCase(createInstructor.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";

        state.instructors.unshift(action.payload);
      })

      .addCase(createInstructor.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.error = action.payload;
      })

      /*
       * UPDATE
       */

      .addCase(updateInstructor.pending, (state) => {
        state.actionStatus = "loading";
        state.error = null;
      })

      .addCase(updateInstructor.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";

        const index = state.instructors.findIndex(
          (instructor) => instructor.id === action.payload.id,
        );

        if (index !== -1) {
          state.instructors[index] = action.payload;
        }

        state.selectedInstructor = action.payload;
      })

      .addCase(updateInstructor.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.error = action.payload;
      })

      /*
       * DELETE
       */

      .addCase(deleteInstructor.pending, (state) => {
        state.actionStatus = "loading";
        state.error = null;
      })

      .addCase(deleteInstructor.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";

        state.instructors = state.instructors.filter(
          (instructor) => instructor.id !== action.payload,
        );
      })

      .addCase(deleteInstructor.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.error = action.payload;
      })

      /*
       * STATUS
       */

      .addCase(updateInstructorStatus.pending, (state) => {
        state.actionStatus = "loading";
        state.error = null;
      })

      .addCase(updateInstructorStatus.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";

        const instructor = state.instructors.find(
          (item) => item.id === action.payload.id,
        );

        if (instructor) {
          instructor.status = action.payload.status;
        }
      })

      .addCase(updateInstructorStatus.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.error = action.payload;
      });
  },
});

export const { clearInstructorError, clearSelectedInstructor } =
  instructorSlice.actions;

export default instructorSlice.reducer;
