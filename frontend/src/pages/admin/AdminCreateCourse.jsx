import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
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

import CourseForm from "../../components/admin/CourseForm";
import { createCourse, uploadCourseThumbnail } from "../../store/courseSlice";
const AdminCreateCourse = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleCreateCourse = async (courseData) => {
    const { thumbnail, ...payload } = courseData;

    let newCourse;

    try {
      newCourse = await dispatch(createCourse(payload)).unwrap();
    } catch (error) {
      console.error("Create course error:", error);
      toast.error(error || "Unable to create course. Please try again.");
      return;
    }

    if (thumbnail instanceof File) {
      try {
        await dispatch(
          uploadCourseThumbnail({ id: newCourse.id, file: thumbnail }),
        ).unwrap();
      } catch (error) {
        console.error("Thumbnail upload error:", error);
        toast.error(
          "Course created, but the thumbnail couldn't be uploaded. You can add it from the Edit page.",
        );
      }
    }

    toast.success("Course created. Let's build your curriculum.");
    navigate(`/dashboard/admin/courses/${newCourse.id}/builder`);
  };

  const handleCancel = () => {
    navigate("/dashboard/admin/courses");
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
          className="mb-4 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-primary"
        >
          <ArrowLeft size={17} />
          Back to Courses
        </button>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
              <span>Admin</span>
              <span>/</span>
              <span>Courses</span>
              <span>/</span>
              <span className="font-medium text-gray-700">Create Course</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Create New Course
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
              Create a new learning experience. Add the course information,
              learning objectives, prerequisites and publishing settings below.
            </p>
          </div>

          <div className="hidden items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm lg:flex">
            <BookOpen size={20} className="text-primary" />

            <div>
              <p className="text-xs text-gray-500">Course creation</p>

              <p className="text-sm font-semibold text-gray-900">
                Admin Workspace
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <CourseForm
            submitLabel="Create Course"
            onSubmit={handleCreateCourse}
            onCancel={handleCancel}
          />
        </div>

        <aside className="hidden space-y-6 xl:block">
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

export default AdminCreateCourse;
