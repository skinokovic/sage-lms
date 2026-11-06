import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { studentApi } from "../api/studentApi";

const initialState = {
  items: [],
  listStatus: "idle",
  listError: null,

  current: null,
  currentStatus: "idle",
  currentError: null,

  saving: false,
  saveError: null,
};

export const fetchStudents = createAsyncThunk(
  "adminStudents/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await studentApi.getAll();
      return data.students;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Couldn't load students.",
      );
    }
  },
);

export const fetchStudentById = createAsyncThunk(
  "adminStudents/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await studentApi.getById(id);
      return data.student;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Couldn't load this student.",
      );
    }
  },
);

export const updateStudent = createAsyncThunk(
  "adminStudents/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const { data } = await studentApi.update(id, payload);
      return data.student;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Couldn't save changes.",
      );
    }
  },
);

export const removeStudent = createAsyncThunk(
  "adminStudents/remove",
  async (id, { rejectWithValue }) => {
    try {
      await studentApi.remove(id);
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Couldn't remove student.",
      );
    }
  },
);

const adminStudentSlice = createSlice({
  name: "adminStudents",

  initialState,

  reducers: {
    clearCurrentStudent(state) {
      state.current = null;
      state.currentStatus = "idle";
      state.currentError = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchStudents.pending, (state) => {
        state.listStatus = "loading";
        state.listError = null;
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.listStatus = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.listStatus = "failed";
        state.listError = action.payload;
      })

      .addCase(fetchStudentById.pending, (state) => {
        state.currentStatus = "loading";
        state.currentError = null;
      })
      .addCase(fetchStudentById.fulfilled, (state, action) => {
        state.currentStatus = "succeeded";
        state.current = action.payload;
      })
      .addCase(fetchStudentById.rejected, (state, action) => {
        state.currentStatus = "failed";
        state.currentError = action.payload;
        state.current = null;
      })

      .addCase(updateStudent.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })
      .addCase(updateStudent.fulfilled, (state, action) => {
        state.saving = false;
        state.current = action.payload;
        state.items = state.items.map((student) =>
          student.id === action.payload.id ? action.payload : student,
        );
      })
      .addCase(updateStudent.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.payload;
      })

      .addCase(removeStudent.fulfilled, (state, action) => {
        state.items = state.items.map((student) =>
          student.id === action.payload
            ? { ...student, status: "Inactive", isActive: false }
            : student,
        );

        if (state.current?.id === action.payload) {
          state.current = {
            ...state.current,
            status: "Inactive",
            isActive: false,
          };
        }
      });
  },
});

export const { clearCurrentStudent } = adminStudentSlice.actions;
export default adminStudentSlice.reducer;
