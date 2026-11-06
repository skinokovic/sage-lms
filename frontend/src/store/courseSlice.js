import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { courseApi } from "../api/courseApi";
import axiosClient from "../api/axiosClient";

const initialState = {
  // Existing admin/instructor course state
  items: [],
  listStatus: "idle",
  listError: null,
  current: null,
  currentStatus: "idle",
  currentError: null,
  saving: false,
  saveError: null,

  // New public course state for Home, Courses and other public pages
  publishedItems: [],
  publishedStatus: "idle",
  publishedError: null,
};

/* ---------------------------------------------------------
   Fetch published courses for public pages
--------------------------------------------------------- */

export const fetchPublishedCourses = createAsyncThunk(
  "courses/fetchPublished",
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.get("/courses/public", {
        params,
      });

      return (data.courses || []).map((course) => ({
        ...course,
        id: course._id || course.id,
        image: course.thumbnail || "",
        instructorName:
          course.instructor?.name || course.instructorName || "SAGE Instructor",
        price: Number(course.price || 0),
        rating: Number(course.rating || 0),
        reviewCount: Number(course.reviewCount || 0),
      }));
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Couldn't load published courses.",
      );
    }
  },
);

/* ---------------------------------------------------------
   Fetch instructor's courses
--------------------------------------------------------- */

export const fetchMyCourses = createAsyncThunk(
  "courses/fetchMine",
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await courseApi.mine(params);
      return data.courses;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Couldn't load your courses.",
      );
    }
  },
);

/* ---------------------------------------------------------
   Fetch all courses for admin
--------------------------------------------------------- */

export const fetchAllCourses = createAsyncThunk(
  "courses/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await courseApi.all(params);
      return data.courses;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Couldn't load courses.",
      );
    }
  },
);

/* ---------------------------------------------------------
   Fetch a single course
--------------------------------------------------------- */

export const fetchCourseById = createAsyncThunk(
  "courses/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await courseApi.getById(id);
      return data.course;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Couldn't load this course.",
      );
    }
  },
);

/* ---------------------------------------------------------
   Create course
--------------------------------------------------------- */

export const createCourse = createAsyncThunk(
  "courses/create",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await courseApi.create(payload);
      return data.course;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Couldn't create the course.",
      );
    }
  },
);

/* ---------------------------------------------------------
   Update course
--------------------------------------------------------- */

export const updateCourse = createAsyncThunk(
  "courses/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const { data } = await courseApi.update(id, payload);
      return data.course;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Couldn't save your changes.",
      );
    }
  },
);

/* ---------------------------------------------------------
   Delete course
--------------------------------------------------------- */

export const deleteCourse = createAsyncThunk(
  "courses/delete",
  async (id, { rejectWithValue }) => {
    try {
      await courseApi.remove(id);
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Couldn't delete the course.",
      );
    }
  },
);

/* ---------------------------------------------------------
   Upload course thumbnail
--------------------------------------------------------- */

export const uploadCourseThumbnail = createAsyncThunk(
  "courses/uploadThumbnail",
  async ({ id, file }, { rejectWithValue }) => {
    try {
      const { data } = await courseApi.uploadThumbnail(id, file);
      return data.course;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Couldn't upload the thumbnail.",
      );
    }
  },
);

/* ---------------------------------------------------------
   Course slice
--------------------------------------------------------- */

const courseSlice = createSlice({
  name: "courses",
  initialState,

  reducers: {
    clearCurrentCourse(state) {
      state.current = null;
      state.currentStatus = "idle";
      state.currentError = null;
    },

    clearCourseErrors(state) {
      state.listError = null;
      state.currentError = null;
      state.saveError = null;
      state.publishedError = null;
    },

    setCurrentCourse(state, action) {
      state.current = action.payload;
    },

    clearPublishedCourses(state) {
      state.publishedItems = [];
      state.publishedStatus = "idle";
      state.publishedError = null;
    },

    invalidatePublishedCourses(state) {
      state.publishedStatus = "idle";
    },
  },

  extraReducers: (builder) => {
    builder

      /* Public published courses */

      .addCase(fetchPublishedCourses.pending, (state) => {
        state.publishedStatus = "loading";
        state.publishedError = null;
      })

      .addCase(fetchPublishedCourses.fulfilled, (state, action) => {
        state.publishedStatus = "succeeded";
        state.publishedItems = action.payload;
        state.publishedError = null;
      })

      .addCase(fetchPublishedCourses.rejected, (state, action) => {
        state.publishedStatus = "failed";
        state.publishedError =
          action.payload || "Couldn't load published courses.";
      })

      /* Instructor course list */

      .addCase(fetchMyCourses.pending, (state) => {
        state.listStatus = "loading";
        state.listError = null;
      })

      .addCase(fetchMyCourses.fulfilled, (state, action) => {
        state.listStatus = "succeeded";
        state.items = action.payload;
      })

      .addCase(fetchMyCourses.rejected, (state, action) => {
        state.listStatus = "failed";
        state.listError = action.payload;
      })

      /* Admin course list */

      .addCase(fetchAllCourses.pending, (state) => {
        state.listStatus = "loading";
        state.listError = null;
      })

      .addCase(fetchAllCourses.fulfilled, (state, action) => {
        state.listStatus = "succeeded";
        state.items = action.payload;
      })

      .addCase(fetchAllCourses.rejected, (state, action) => {
        state.listStatus = "failed";
        state.listError = action.payload;
      })

      /* Single course */

      .addCase(fetchCourseById.pending, (state) => {
        state.currentStatus = "loading";
        state.currentError = null;
      })

      .addCase(fetchCourseById.fulfilled, (state, action) => {
        state.currentStatus = "succeeded";
        state.current = action.payload;
      })

      .addCase(fetchCourseById.rejected, (state, action) => {
        state.currentStatus = "failed";
        state.currentError = action.payload;
        state.current = null;
      })

      /* Create */

      .addCase(createCourse.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })

      .addCase(createCourse.fulfilled, (state, action) => {
        state.saving = false;
        state.items = [action.payload, ...state.items];
        state.current = action.payload;
        state.publishedStatus = "idle";
      })

      .addCase(createCourse.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.payload;
      })

      /* Update */

      .addCase(updateCourse.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })

      .addCase(updateCourse.fulfilled, (state, action) => {
        state.saving = false;
        state.current = action.payload;

        const updatedId = action.payload.id || action.payload._id;

        state.items = state.items.map((course) =>
          (course.id || course._id) === updatedId ? action.payload : course,
        );

        state.publishedStatus = "idle";
      })

      .addCase(updateCourse.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.payload;
      })

      /* Delete */

      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (course) => (course.id || course._id) !== action.payload,
        );

        state.publishedItems = state.publishedItems.filter(
          (course) => (course.id || course._id) !== action.payload,
        );

        state.publishedStatus = "idle";
      })

      .addCase(deleteCourse.rejected, (state, action) => {
        state.listError = action.payload;
      })

      /* Thumbnail upload */

      .addCase(uploadCourseThumbnail.pending, (state) => {
        state.saving = true;
        state.saveError = null;
      })

      .addCase(uploadCourseThumbnail.fulfilled, (state, action) => {
        state.saving = false;
        state.current = action.payload;

        const updatedId = action.payload.id || action.payload._id;

        state.items = state.items.map((course) =>
          (course.id || course._id) === updatedId ? action.payload : course,
        );

        state.publishedStatus = "idle";
      })

      .addCase(uploadCourseThumbnail.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.payload;
      });
  },
});

export const {
  clearCurrentCourse,
  clearCourseErrors,
  setCurrentCourse,
  clearPublishedCourses,
  invalidatePublishedCourses,
} = courseSlice.actions;

export default courseSlice.reducer;
