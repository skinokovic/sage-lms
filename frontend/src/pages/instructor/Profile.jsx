import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  AlertCircle,
  Award,
  BookOpen,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Star,
  User,
  Users,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

import {
  fetchInstructorProfile,
  saveInstructorProfile,
  setAvatarUrl,
} from "../../store/instructorProfileSlice";
import { instructorProfileApi } from "../../api/instructorProfileApi";
import { authApi } from "../../api/authApi";
import { setUser } from "../../store/authSlice";
import SignatureManager from "../../components/certificate/SignatureManager";

const show = (value) => value || "Not set";

const PasswordField = ({
  label,
  value,
  onChange,
  showPassword,
  setShowPassword,
  placeholder,
}) => (
  <div>
    <label className="mb-2 block text-xs font-semibold text-gray-700">
      {label}
    </label>

    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-11 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-50"
      />

      <button
        type="button"
        onClick={() => setShowPassword((current) => !current)}
        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 transition hover:text-gray-700"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  </div>
);

const Profile = () => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const { user } = useSelector((state) => state.auth);
  const { profile, stats, courses, totalCourses, status, error, saving } =
    useSelector((state) => state.instructorProfile);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarBroken, setAvatarBroken] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    dispatch(fetchInstructorProfile());
  }, [dispatch]);

  // Keeps the top bar / sidebar in step with changes made on this page
  const syncAuthUser = (changes) => {
    if (user) dispatch(setUser({ ...user, ...changes }));
  };

  /* ---------------------------- Loading / Error --------------------------- */

  if (!profile && (status === "idle" || status === "loading")) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="h-52 animate-pulse rounded-2xl bg-gray-100" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-36 animate-pulse rounded-2xl bg-gray-100"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="h-72 animate-pulse rounded-2xl bg-gray-100 xl:col-span-2" />
          <div className="h-72 animate-pulse rounded-2xl bg-gray-100" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-[#B00000]">
          <AlertCircle size={30} />
        </div>

        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          Couldn't load your profile
        </h3>

        <p className="mt-2 text-sm text-gray-500">{error}</p>

        <button
          type="button"
          onClick={() => dispatch(fetchInstructorProfile())}
          className="mt-5 cursor-pointer rounded-xl bg-[#B00000] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
        >
          Try Again
        </button>
      </div>
    );
  }

  /* ------------------------------- Derived -------------------------------- */

  const teachingStats = [
    {
      label: "Courses Taught",
      value: stats?.courses ?? 0,
      icon: BookOpen,
      description: "Across the platform",
    },
    {
      label: "Students",
      value: stats?.students ?? 0,
      icon: Users,
      description: "Enrolled in your courses",
    },
    {
      label: "Assignments",
      value: stats?.assignments ?? 0,
      icon: GraduationCap,
      description: "Created for students",
    },
    {
      label: "Average Rating",
      value: stats?.rating ?? "—",
      icon: Star,
      description: "Student feedback",
    },
  ];

  const initials = (profile.name || "?")
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const avatarSrc = avatarPreview || profile.avatarUrl;
  const showAvatarImage = Boolean(avatarSrc) && !avatarBroken;

  /* -------------------------------- Avatar -------------------------------- */

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Please select a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setAvatarBroken(false);

    try {
      setUploadingAvatar(true);

      const formData = new FormData();
      formData.append("avatar", file);

      const { data } = await instructorProfileApi.uploadAvatar(formData);

      dispatch(setAvatarUrl(data.avatarUrl));
      syncAuthUser({ avatarUrl: data.avatarUrl });
      setAvatarPreview(null);
      toast.success("Profile photo updated successfully.");
    } catch (uploadError) {
      setAvatarPreview(null);

      toast.error(
        uploadError.response?.data?.message ||
          "Failed to upload profile photo.",
      );
    } finally {
      URL.revokeObjectURL(previewUrl);
      setUploadingAvatar(false);
    }
  };

  /* ------------------------------- Handlers ------------------------------- */

  const handleEdit = () => {
    setEditForm(profile);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditForm(null);
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    if (!editForm.name.trim()) {
      toast.error("Name is required.");
      return;
    }

    if (!editForm.email.trim()) {
      toast.error("Email address is required.");
      return;
    }

    try {
      const saved = await dispatch(saveInstructorProfile(editForm)).unwrap();

      syncAuthUser({ name: saved.name, email: saved.email });
      setIsEditing(false);
      setEditForm(null);
      toast.success("Profile updated successfully.");
    } catch (message) {
      toast.error(message || "Couldn't save your profile.");
    }
  };

  const handleChange = (field, value) => {
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      toast.error("Please complete all password fields.");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    try {
      setChangingPassword(true);

      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast.success("Password updated successfully.");
    } catch (passwordError) {
      toast.error(
        passwordError.response?.data?.message || "Failed to update password.",
      );
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      {/* PROFILE HERO */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="h-32 bg-[#1E3A8A] sm:h-40" />

        <div className="px-5 pb-6 sm:px-7">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-start">
              {/* AVATAR */}
              <div className="relative shrink-0">
                {showAvatarImage ? (
                  <img
                    src={avatarSrc}
                    alt={profile.name}
                    onError={() => setAvatarBroken(true)}
                    className="h-24 w-24 rounded-2xl border-4 border-white bg-white object-cover shadow-md sm:h-28 sm:w-28"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-gray-100 text-2xl font-bold text-[#1E3A8A] shadow-md sm:h-28 sm:w-28 sm:text-3xl">
                    {initials}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-2 -right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-4 border-white bg-[#B00000] text-white shadow-md transition hover:bg-[#8f0000] disabled:cursor-not-allowed disabled:opacity-70"
                  aria-label="Upload profile photo"
                >
                  {uploadingAvatar ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Camera size={16} />
                  )}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>

              {/* NAME — starts below the blue banner */}
              <div className="sm:pt-16">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile.name}
                  </h1>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      profile.status === "Active"
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    <CheckCircle2 size={13} />
                    {profile.status}
                  </span>
                </div>

                <p className="mt-1 text-sm font-medium text-[#1E3A8A]">
                  Instructor
                </p>

                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  {show(profile.specialization)}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Photo: JPG, PNG or WebP, up to 5MB
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleEdit}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#B00000] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000] lg:self-end"
            >
              <Edit3 size={17} />
              Edit Profile
            </button>
          </div>
        </div>
      </section>

      {/* TEACHING STATS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {teachingStats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#1E3A8A]">
                  <Icon size={21} />
                </div>

                {stat.label === "Average Rating" && (
                  <Star size={17} className="fill-current text-amber-400" />
                )}
              </div>

              <p className="mt-5 text-sm font-medium text-gray-500">
                {stat.label}
              </p>

              <p className="mt-1 text-2xl font-bold text-gray-900">
                {stat.value}
              </p>

              <p className="mt-1 text-xs text-gray-400">{stat.description}</p>
            </div>
          );
        })}
      </section>

      {/* PROFILE INFORMATION + ABOUT */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Personal Information
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Your instructor account information
              </p>
            </div>

            <User size={21} className="text-[#1E3A8A]" />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-gray-400">Full Name</p>

              <div className="mt-2 flex items-center gap-2">
                <User size={16} className="text-gray-400" />
                <p className="text-sm font-semibold text-gray-800">
                  {profile.name}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400">Email Address</p>

              <div className="mt-2 flex items-center gap-2">
                <Mail size={16} className="text-gray-400" />
                <p className="break-all text-sm font-semibold text-gray-800">
                  {profile.email}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400">Phone Number</p>

              <div className="mt-2 flex items-center gap-2">
                <Phone size={16} className="text-gray-400" />
                <p className="text-sm font-semibold text-gray-800">
                  {show(profile.phone)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400">Location</p>

              <div className="mt-2 flex items-center gap-2">
                <MapPin size={16} className="text-gray-400" />
                <p className="text-sm font-semibold text-gray-800">
                  {show(profile.location)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400">
                Specialization
              </p>

              <div className="mt-2 flex items-start gap-2">
                <BriefcaseBusiness
                  size={16}
                  className="mt-0.5 shrink-0 text-gray-400"
                />
                <p className="text-sm font-semibold text-gray-800">
                  {show(profile.specialization)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400">Experience</p>

              <div className="mt-2 flex items-center gap-2">
                <Award size={16} className="text-gray-400" />
                <p className="text-sm font-semibold text-gray-800">
                  {show(profile.experience)}
                </p>
              </div>
            </div>

            <div className="md:col-span-2">
              <p className="text-xs font-medium text-gray-400">Qualification</p>

              <div className="mt-2 flex items-start gap-2">
                <GraduationCap
                  size={16}
                  className="mt-0.5 shrink-0 text-gray-400"
                />
                <p className="text-sm font-semibold text-gray-800">
                  {show(profile.qualification)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">About Me</h2>

              <p className="mt-1 text-xs text-gray-500">Instructor biography</p>
            </div>

            <BriefcaseBusiness size={21} className="text-[#B00000]" />
          </div>

          <p className="mt-6 whitespace-pre-line text-sm leading-7 text-gray-600">
            {profile.bio || "You haven't added a biography yet."}
          </p>

          <div className="mt-6 rounded-xl bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={19}
                className="mt-0.5 shrink-0 text-[#1E3A8A]"
              />

              <div>
                <p className="text-sm font-bold text-gray-800">
                  Instructor Account
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-600">
                  Your instructor profile is active and available for teaching
                  activities on the platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COURSES */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Courses I Teach</h2>

            <p className="mt-1 text-xs text-gray-500">
              Overview of your current courses
            </p>
          </div>

          <span className="text-xs font-semibold text-[#1E3A8A]">
            {courses.length} of {totalCourses} courses shown
          </span>
        </div>

        {courses.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className="rounded-xl border border-gray-200 p-4 transition hover:border-blue-200 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1E3A8A]">
                    <BookOpen size={18} />
                  </div>

                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                      course.status === "Published"
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {course.status}
                  </span>
                </div>

                <h3 className="mt-4 min-h-[48px] font-bold text-gray-900">
                  {course.title}
                </h3>

                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-gray-500">
                    <Users size={13} />
                    {course.students}
                  </span>

                  <span className="flex items-center gap-1 font-semibold text-gray-700">
                    <Star size={13} className="fill-current text-amber-400" />
                    {course.rating > 0 ? course.rating : "—"}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Completion</span>

                    <span className="font-semibold text-gray-700">
                      {course.completion}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-[#1E3A8A]"
                      style={{
                        width: `${course.completion}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-xl bg-gray-50 p-8 text-center text-sm text-gray-500">
            You haven't created any courses yet.
          </div>
        )}
      </section>

      {/* CERTIFICATE SIGNATURE */}
      <SignatureManager />

      {/* SECURITY / PASSWORD */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#B00000]">
            <ShieldCheck size={21} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900">Security</h2>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Keep your instructor account secure by regularly updating your
              password.
            </p>
          </div>
        </div>

        <form
          onSubmit={handlePasswordSubmit}
          className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3"
        >
          <PasswordField
            label="Current Password"
            value={passwordForm.currentPassword}
            onChange={(value) => handlePasswordChange("currentPassword", value)}
            showPassword={showCurrentPassword}
            setShowPassword={setShowCurrentPassword}
            placeholder="Enter current password"
          />

          <PasswordField
            label="New Password"
            value={passwordForm.newPassword}
            onChange={(value) => handlePasswordChange("newPassword", value)}
            showPassword={showNewPassword}
            setShowPassword={setShowNewPassword}
            placeholder="Enter new password"
          />

          <PasswordField
            label="Confirm New Password"
            value={passwordForm.confirmPassword}
            onChange={(value) => handlePasswordChange("confirmPassword", value)}
            showPassword={showConfirmPassword}
            setShowPassword={setShowConfirmPassword}
            placeholder="Confirm new password"
          />

          <div className="md:col-span-3">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-700">
                Password requirements
              </p>

              <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-gray-500 sm:grid-cols-2">
                <span>• At least 8 characters</span>
                <span>• Avoid easily guessed passwords</span>
                <span>• Use a combination of characters</span>
                <span>• Do not reuse old passwords</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row md:col-span-3 md:justify-end">
            <button
              type="submit"
              disabled={changingPassword}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#162d6b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {changingPassword ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}
              {changingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </section>

      {/* EDIT PROFILE MODAL */}
      {isEditing && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Edit Profile
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Update your instructor information.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCancelEdit}
                className="cursor-pointer rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-gray-700">
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-gray-700">
                    Email Address
                  </label>

                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-gray-700">
                    Phone Number
                  </label>

                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-gray-700">
                    Location
                  </label>

                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-gray-700">
                    Specialization
                  </label>

                  <input
                    type="text"
                    value={editForm.specialization}
                    onChange={(e) =>
                      handleChange("specialization", e.target.value)
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#1E3A8A]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-gray-700">
                    Experience
                  </label>

                  <input
                    type="text"
                    value={editForm.experience}
                    onChange={(e) => handleChange("experience", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#1E3A8A]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs font-semibold text-gray-700">
                    Qualification
                  </label>

                  <input
                    type="text"
                    value={editForm.qualification}
                    onChange={(e) =>
                      handleChange("qualification", e.target.value)
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#1E3A8A]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs font-semibold text-gray-700">
                    Bio
                  </label>

                  <textarea
                    rows={5}
                    maxLength={1000}
                    value={editForm.bio}
                    onChange={(e) => handleChange("bio", e.target.value)}
                    className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm leading-6 outline-none focus:border-[#1E3A8A]"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                >
                  <X size={17} />
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#B00000] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Save size={17} />
                  )}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
