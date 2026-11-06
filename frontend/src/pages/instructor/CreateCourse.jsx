import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileText,
  Layers3,
  Lightbulb,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";

import CourseForm from "../../components/instructor/CourseForm";
import { courseApi } from "../../api/courseApi";

// The course builder still reads these keys, so a copy of the new course
// (with its real database id) is kept there until the builder uses the API.
const saveLocalCopy = (course) => {
  try {
    localStorage.setItem(
      `sage_instructor_course_${course.id}`,
      JSON.stringify({ ...course, modules: course.modules || [] }),
    );

    const existing = JSON.parse(
      localStorage.getItem("sage_instructor_courses") || "[]",
    );

    localStorage.setItem(
      "sage_instructor_courses",
      JSON.stringify([
        course,
        ...(Array.isArray(existing) ? existing : []).filter(
          (item) => item.id !== course.id,
        ),
      ]),
    );
  } catch {
    // Storage can be full or blocked; the course is already saved on the server.
  }
};

const CreateCourse = () => {
  const navigate = useNavigate();

  const handleCreateCourse = async (courseData) => {
    // `thumbnail` is a File and `status` is not accepted on create, so both
    // are handled in separate requests after the course exists.
    const { thumbnail, status, ...payload } = courseData;

    try {
      // 1. Create the course (always starts as a Draft on the server)
      const { data } = await courseApi.create(payload);
      let course = data.course;
      const courseId = course.id || course._id;

      // 2. Upload the thumbnail, if one was chosen
      if (thumbnail instanceof File) {
        try {
          const response = await courseApi.uploadThumbnail(courseId, thumbnail);
          course = response.data.course || course;
        } catch (error) {
          console.error("Thumbnail upload error:", error);
          toast.warning(
            "Course created, but the thumbnail couldn't be uploaded. You can add it later by editing the course.",
          );
        }
      }

      // 3. Publish right away only if the instructor chose "Published"
      if (status === "Published") {
        try {
          const response = await courseApi.update(courseId, {
            status: "Published",
          });
          course = response.data.course || course;
        } catch (error) {
          console.error("Publish error:", error);
          toast.warning(
            "Course created as a draft. It couldn't be published yet, so you can publish it later.",
          );
        }
      }

      saveLocalCopy({ ...course, id: courseId });

      toast.success("Course created. Let's build your curriculum.");
      navigate(`/dashboard/instructor/courses/${courseId}/builder`);
    } catch (error) {
      console.error("Create course error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to create course. Please try again.",
      );
    }
  };

  const handleCancel = () => {
    navigate("/dashboard/instructor/courses");
  };

  return (
    <div className="mx-auto max-w-7xl">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div className="mb-6">
        <button
          type="button"
          onClick={handleCancel}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-primary"
        >
          <ArrowLeft size={17} />
          Back to My Courses
        </button>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
              <span>Instructor</span>
              <span>/</span>
              <span>My Courses</span>
              <span>/</span>
              <span className="font-medium text-gray-700">Create Course</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Create New Course
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
              Create a new learning experience for your students. Add the course
              information, learning objectives, prerequisites and publishing
              settings below.
            </p>
          </div>

          <div className="hidden items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm lg:flex">
            <BookOpen size={20} className="text-primary" />

            <div>
              <p className="text-xs text-gray-500">Course creation</p>

              <p className="text-sm font-semibold text-gray-900">
                Instructor Workspace
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* FORM */}

        <div>
          <CourseForm
            submitLabel="Create Course"
            onSubmit={handleCreateCourse}
            onCancel={handleCancel}
          />
        </div>

        {/* ===================================================
            SIDEBAR
        ==================================================== */}

        <aside className="hidden space-y-6 xl:block">
          {/* Course creation tips */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600">
                <Lightbulb size={20} />
              </div>

              <div>
                <h2 className="text-sm font-bold text-gray-900">Course Tips</h2>

                <p className="text-xs text-gray-500">
                  Make your course effective
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <Tip
                icon={CheckCircle2}
                title="Use a clear title"
                description="Choose a title that immediately tells students what they will learn."
              />

              <Tip
                icon={FileText}
                title="Write a useful description"
                description="Explain the course content, outcomes and what students can expect."
              />

              <Tip
                icon={Layers3}
                title="Add measurable objectives"
                description="Use objectives that describe practical skills students can gain."
              />

              <Tip
                icon={Users}
                title="Think about your students"
                description="Set the appropriate level and prerequisites for your target learners."
              />
            </div>
          </div>

          {/* Course workflow */}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900">Course Workflow</h2>

            <div className="mt-5 space-y-5">
              <WorkflowStep
                number="01"
                title="Course Information"
                description="Basic course details"
                active
              />

              <WorkflowStep
                number="02"
                title="Course Content"
                description="Add modules and lessons"
              />

              <WorkflowStep
                number="03"
                title="Review & Publish"
                description="Review before publishing"
              />
            </div>
          </div>

          {/* Future content note */}

          <div className="rounded-2xl bg-secondary p-5 text-white shadow-sm">
            <BookOpen size={24} />

            <h2 className="mt-4 text-base font-bold">What's next?</h2>

            <p className="mt-2 text-sm leading-6 text-blue-100">
              After creating the course, you'll be able to add modules, lessons,
              videos, resources, quizzes and assignments.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

/* ============================================================
   SMALL UI HELPERS
============================================================ */

const Tip = ({ icon: Icon, title, description }) => {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 shrink-0 text-primary">
        <Icon size={18} />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>

        <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
      </div>
    </div>
  );
};

const WorkflowStep = ({ number, title, description, active = false }) => {
  return (
    <div className="flex gap-3">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          active ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
        }`}
      >
        {number}
      </div>

      <div>
        <h3
          className={`text-sm font-semibold ${
            active ? "text-gray-900" : "text-gray-600"
          }`}
        >
          {title}
        </h3>

        <p className="mt-1 text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
};

export default CreateCourse;
