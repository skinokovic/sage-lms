import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { instructorProfileApi } from "../api/instructorProfileApi";

const initialState = {
  profile: null,
  stats: null,
  courses: [],
  totalCourses: 0,
  status: "idle",
  error: null,
  saving: false,
};

export const fetchInstructorProfile = createAsyncThunk(
  "instructorProfile/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await instructorProfileApi.get();
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Couldn't load your profile.",
      );
    }
  },
);

export const saveInstructorProfile = createAsyncThunk(
  "instructorProfile/save",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await instructorProfileApi.update(payload);
      return data.profile;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Couldn't save your profile.",
      );
    }
  },
);

const instructorProfileSlice = createSlice({
  name: "instructorProfile",
  initialState,
  reducers: {
    setAvatarUrl(state, action) {
      if (state.profile) state.profile.avatarUrl = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInstructorProfile.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchInstructorProfile.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.profile = action.payload.profile;
        state.stats = action.payload.stats;
        state.courses = action.payload.courses;
        state.totalCourses = action.payload.totalCourses;
      })
      .addCase(fetchInstructorProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      .addCase(saveInstructorProfile.pending, (state) => {
        state.saving = true;
      })
      .addCase(saveInstructorProfile.fulfilled, (state, action) => {
        state.saving = false;
        state.profile = action.payload;
      })
      .addCase(saveInstructorProfile.rejected, (state) => {
        state.saving = false;
      });
  },
});

export const { setAvatarUrl } = instructorProfileSlice.actions;
export default instructorProfileSlice.reducer;
