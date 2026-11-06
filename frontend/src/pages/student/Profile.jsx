import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  AlertCircle,
  Award,
  BookOpen,
  Camera,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

import axiosClient from "../../api/axiosClient";
import { authApi } from "../../api/authApi";
import { setUser } from "../../store/authSlice";

const formatLearningTime = (minutes) => {
  if (!minutes) return "0h";

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
};

const PasswordInput = ({
  name,
  label,
  placeholder,
  value,
  visible,
  onChange,
  onToggle,
}) => (
  <div>
    <label className="mb-2 block text-sm font-medium text-gray-700">
      {label}
    </label>

    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12 text-sm text-gray-800 outline-none transition focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10"
      />

      <button
        type="button"
        onClick={() => onToggle(name)}
        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 transition hover:text-gray-700"
        aria-label={visible ? `Hide ${label}` : `Show ${label}`}
      >
        {visible ? <EyeOff size={19} /> : <Eye size={19} />}
      </button>
    </div>
  </div>
);

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const fileInputRef = useRef(null);

  const [data, setData] = useState({ profile: null, stats: null });
  const [loadStatus, setLoadStatus] = useState("loading");
  const [loadError, setLoadError] = useState("");

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarBroken, setAvatarBroken] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", location: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [changingPassword, setChangingPassword] = useState(false);

  // Keeps the top bar / sidebar in step with changes made on this page
  const syncAuthUser = (changes) => {
    if (user) dispatch(setUser({ ...user, ...changes }));
  };

  /* --------------------------- load from the database --------------------------- */

  const loadProfile = useCallback(async () => {
    setLoadStatus("loading");
    setLoadError("");

    try {
      const response = await axiosClient.get("/student/profile");
      setData({
        profile: response.data.profile,
        stats: response.data.stats,
      });
      setLoadStatus("succeeded");
    } catch (error) {
      setLoadError(
        error.response?.data?.message || "Couldn't load your profile.",
      );
      setLoadStatus("failed");
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const { profile, stats } = data;

  /* -------------------------------- loading / error -------------------------------- */

  if (loadStatus === "loading" && !profile) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-2xl bg-gray-100 lg:col-span-2" />
          <div className="h-80 animate-pulse rounded-2xl bg-gray-100" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-gray-100">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-[#B00000]">
          <AlertCircle size={30} />
        </div>

        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          Couldn't load your profile
        </h3>

        <p className="mt-2 text-sm text-gray-500">{loadError}</p>

        <button
          type="button"
          onClick={loadProfile}
          className="mt-5 cursor-pointer rounded-xl bg-[#B00000] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
        >
          Try Again
        </button>
      </div>
    );
  }

  /* ---------------------------------- user info ---------------------------------- */

  const displayName = profile.name || "Student";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const avatarSrc = avatarPreview || profile.avatarUrl;
  const showAvatarImage = Boolean(avatarSrc) && !avatarBroken;

  /* ------------------------------------ avatar ------------------------------------ */

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

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

      const response = await axiosClient.patch(
        "/student/profile/avatar",
        formData,
        { headers: { "Content-Type": undefined } },
      );

      setData((current) => ({
        ...current,
        profile: {
          ...current.profile,
          avatarUrl: response.data.avatarUrl,
        },
      }));

      setAvatarPreview(null);
      syncAuthUser({ avatarUrl: response.data.avatarUrl });
      toast.success("Profile photo updated successfully.");
    } catch (error) {
      setAvatarPreview(null);

      toast.error(
        error.response?.data?.message || "Failed to upload profile photo.",
      );
    } finally {
      URL.revokeObjectURL(previewUrl);
      setUploadingAvatar(false);
    }
  };

  /* ------------------------------------ profile ------------------------------------ */

  const handleStartEdit = () => {
    setForm({
      name: profile.name,
      phone: profile.phone,
      location: profile.location,
    });
    setIsEditing(true);
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required.");
      return;
    }

    try {
      setSavingProfile(true);

      const response = await axiosClient.patch("/student/profile", form);

      setData((current) => ({
        ...current,
        profile: response.data.profile,
      }));

      setIsEditing(false);
      syncAuthUser({ name: response.data.profile.name });
      toast.success("Profile updated successfully.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  /* ------------------------------------ password ------------------------------------ */

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswords((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (!passwords.currentPassword) {
      toast.error("Please enter your current password.");
      return;
    }

    if (!passwords.newPassword) {
      toast.error("Please enter a new password.");
      return;
    }

    if (passwords.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    try {
      setChangingPassword(true);

      await authApi.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast.success("Password changed successfully.");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to change password.",
      );
    } finally {
      setChangingPassword(false);
    }
  };

  /* ------------------------------------- render ------------------------------------- */

  const statCards = [
    {
      label: "Courses Enrolled",
      value: stats?.enrolled ?? 0,
      icon: BookOpen,
      iconClass: "bg-blue-50 text-[#1E3A8A]",
    },
    {
      label: "Courses Completed",
      value: stats?.completed ?? 0,
      icon: GraduationCap,
      iconClass: "bg-green-50 text-green-600",
    },
    {
      label: "Certificates Earned",
      value: stats?.certificates ?? 0,
      icon: Award,
      iconClass: "bg-yellow-50 text-yellow-600",
    },
    {
      label: "Learning Time",
      value: formatLearningTime(stats?.learningMinutes),
      icon: Clock3,
      iconClass: "bg-red-50 text-[#B00000]",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* ==========================================
          PROFILE HEADER
      =========================================== */}

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
        <div className="h-32 bg-gradient-to-r from-[#B00000] to-[#8f0000] sm:h-40" />

        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-14 flex flex-col gap-4 sm:-mt-16 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
              {/* AVATAR */}

              <div className="relative shrink-0">
                {showAvatarImage ? (
                  <img
                    src={avatarSrc}
                    alt={displayName}
                    onError={() => setAvatarBroken(true)}
                    className="h-28 w-28 rounded-2xl border-4 border-white bg-white object-cover shadow-lg sm:h-32 sm:w-32"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-2xl border-4 border-white bg-[#B00000] text-3xl font-bold text-white shadow-lg sm:h-32 sm:w-32">
                    {initials}
                  </div>
                )}

                {/* CAMERA BUTTON */}

                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-2 -right-2 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-4 border-white bg-[#B00000] text-white shadow-md transition hover:bg-[#8f0000] disabled:cursor-not-allowed disabled:opacity-70"
                  aria-label="Upload profile photo"
                >
                  {uploadingAvatar ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Camera size={18} />
                  )}
                </button>

                {/* HIDDEN FILE INPUT */}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>

              {/* NAME */}

              <div className="sm:pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {displayName}
                  </h1>

                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                    <CheckCircle2 size={13} />
                    Active
                  </span>
                </div>

                <p className="mt-1 text-sm capitalize text-gray-500">
                  {profile.role}
                </p>
              </div>
            </div>

            {/* EDIT BUTTON */}

            {!isEditing ? (
              <button
                type="button"
                onClick={handleStartEdit}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#B00000] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
              >
                <User size={17} />
                Edit Profile
              </button>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={savingProfile}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                >
                  <X size={17} />
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#B00000] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==========================================
          MAIN CONTENT
      =========================================== */}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ========================================
            LEFT / MAIN COLUMN
        ========================================= */}

        <div className="space-y-6 lg:col-span-2">
          {/* PERSONAL INFORMATION */}

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 sm:p-7">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                Personal Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Manage your personal account information.
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Tip: use the camera button on your photo to change it (JPG, PNG
                or WebP, maximum 5MB).
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {/* NAME */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Full Name
                </label>

                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    name="name"
                    value={isEditing ? form.name : profile.name}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    className={`w-full rounded-xl border px-11 py-3 text-sm outline-none transition ${
                      isEditing
                        ? "border-gray-200 bg-white focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10"
                        : "border-gray-100 bg-gray-50 text-gray-600"
                    }`}
                  />
                </div>
              </div>

              {/* EMAIL */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Email Address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    readOnly
                    className="w-full rounded-xl border border-gray-100 bg-gray-50 px-11 py-3 text-sm text-gray-600 outline-none"
                  />
                </div>
              </div>

              {/* PHONE */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Phone Number
                </label>

                <div className="relative">
                  <Phone
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    name="phone"
                    value={isEditing ? form.phone : profile.phone}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    placeholder="Enter phone number"
                    className={`w-full rounded-xl border px-11 py-3 text-sm outline-none transition ${
                      isEditing
                        ? "border-gray-200 bg-white focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10"
                        : "border-gray-100 bg-gray-50 text-gray-600"
                    }`}
                  />
                </div>
              </div>

              {/* LOCATION */}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Location
                </label>

                <div className="relative">
                  <MapPin
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    name="location"
                    value={isEditing ? form.location : profile.location}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    placeholder="Enter your location"
                    className={`w-full rounded-xl border px-11 py-3 text-sm outline-none transition ${
                      isEditing
                        ? "border-gray-200 bg-white focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10"
                        : "border-gray-100 bg-gray-50 text-gray-600"
                    }`}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* CHANGE PASSWORD */}

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 sm:p-7">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#B00000]">
                <KeyRound size={20} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Change Password
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Keep your account secure by using a strong password.
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-5">
              <PasswordInput
                name="currentPassword"
                label="Current Password"
                placeholder="Enter current password"
                value={passwords.currentPassword}
                visible={showPasswords.currentPassword}
                onChange={handlePasswordChange}
                onToggle={togglePasswordVisibility}
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <PasswordInput
                  name="newPassword"
                  label="New Password"
                  placeholder="Enter new password"
                  value={passwords.newPassword}
                  visible={showPasswords.newPassword}
                  onChange={handlePasswordChange}
                  onToggle={togglePasswordVisibility}
                />

                <PasswordInput
                  name="confirmPassword"
                  label="Confirm New Password"
                  placeholder="Confirm new password"
                  value={passwords.confirmPassword}
                  visible={showPasswords.confirmPassword}
                  onChange={handlePasswordChange}
                  onToggle={togglePasswordVisibility}
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#B00000] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Changing...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={17} />
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* ========================================
            RIGHT COLUMN
        ========================================= */}

        <div className="space-y-6">
          {/* ACCOUNT STATUS */}

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <h2 className="mb-5 text-lg font-bold text-gray-900">
              Account Status
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600">
                    <CheckCircle2 size={18} />
                  </div>

                  <span className="text-sm font-medium text-gray-700">
                    Account
                  </span>
                </div>

                <span className="text-sm font-semibold text-green-600">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#1E3A8A]">
                    <ShieldCheck size={18} />
                  </div>

                  <span className="text-sm font-medium text-gray-700">
                    Role
                  </span>
                </div>

                <span className="text-sm font-semibold capitalize text-gray-900">
                  {profile.role}
                </span>
              </div>
            </div>
          </section>

          {/* LEARNING STATISTICS */}

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
            <h2 className="mb-5 text-lg font-bold text-gray-900">
              Learning Statistics
            </h2>

            <div className="space-y-4">
              {statCards.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.label}
                    className="flex items-center gap-4 rounded-xl border border-gray-100 p-4"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.iconClass}`}
                    >
                      <Icon size={20} />
                    </div>

                    <div>
                      <p className="text-xl font-bold text-gray-900">
                        {stat.value}
                      </p>

                      <p className="text-xs text-gray-500">{stat.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-[11px] leading-4 text-gray-400">
              Learning time is estimated from the lessons you have completed.
            </p>
          </section>

          {/* SECURITY NOTE */}

          <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <div className="flex gap-3">
              <ShieldCheck
                size={20}
                className="mt-0.5 shrink-0 text-[#1E3A8A]"
              />

              <div>
                <h3 className="text-sm font-bold text-[#1E3A8A]">
                  Account Security
                </h3>

                <p className="mt-1 text-xs leading-5 text-blue-800">
                  Never share your password with anyone. Use a unique password
                  that you do not use on other websites.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Profile;
