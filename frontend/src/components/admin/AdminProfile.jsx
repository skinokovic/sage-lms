import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  Camera,
  UserRound,
  Mail,
  Phone,
  MapPin,
  LockKeyhole,
  Save,
  LoaderCircle,
  Eye,
  EyeOff,
} from "lucide-react";

import { authApi } from "../../api/authApi";
import { setUser } from "../../store/authSlice";

const AdminProfile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    location: user?.location || "",
    avatarUrl: user?.avatarUrl || "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await authApi.me();
        const currentUser = response.data?.user;

        if (currentUser) {
          setProfile({
            name: currentUser.name || "",
            email: currentUser.email || "",
            phone: currentUser.phone || "",
            location: currentUser.location || "",
            avatarUrl: currentUser.avatarUrl || "",
          });

          dispatch(setUser({ ...user, ...currentUser }));
        }
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            "Unable to load administrator profile.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
    // Load the authenticated administrator once when this page mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a JPG, PNG or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5MB or smaller.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleAvatarUpload = async () => {
    if (!selectedFile) {
      toast.info("Please select a profile photo first.");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", selectedFile);

    setUploading(true);

    try {
      const response = await authApi.uploadMyAvatar(formData);
      const updatedUser = response.data?.user;

      if (updatedUser) {
        dispatch(setUser({ ...user, ...updatedUser }));

        setProfile((previous) => ({
          ...previous,
          avatarUrl: updatedUser.avatarUrl || "",
        }));
      }

      setSelectedFile(null);
      setPreviewUrl("");
      if (fileInputRef.current) fileInputRef.current.value = "";

      toast.success("Profile photo updated successfully.");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to upload profile photo.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();

    if (!profile.name.trim()) {
      toast.error("Administrator name is required.");
      return;
    }

    setSaving(true);

    try {
      const response = await authApi.updateMyProfile({
        name: profile.name.trim(),
        phone: profile.phone.trim(),
        location: profile.location.trim(),
      });

      const updatedUser = response.data?.user;

      if (updatedUser) {
        dispatch(setUser({ ...user, ...updatedUser }));

        setProfile((previous) => ({
          ...previous,
          name: updatedUser.name || "",
          email: updatedUser.email || previous.email,
          phone: updatedUser.phone || "",
          location: updatedUser.location || "",
          avatarUrl: updatedUser.avatarUrl || previous.avatarUrl,
        }));
      }

      toast.success("Administrator profile updated successfully.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();

    if (!passwords.currentPassword || !passwords.newPassword) {
      toast.error("Please complete the password fields.");
      return;
    }

    if (passwords.newPassword.length < 8) {
      toast.error("New password must contain at least 8 characters.");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }

    setChangingPassword(true);

    try {
      await authApi.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast.success(
        "Password changed. You may need to sign in again when your current session expires.",
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to change password.",
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-red-200";

  const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <LoaderCircle className="h-7 w-7 animate-spin text-blue-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile information */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Administrator Profile
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your administrator information and profile photo.
          </p>
        </div>

        <div className="mb-7 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-gray-100 bg-gray-100">
              {previewUrl || profile.avatarUrl ? (
                <img
                  src={previewUrl || profile.avatarUrl}
                  alt="Administrator"
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound className="h-12 w-12 text-gray-400" />
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-white shadow hover:bg-primary/70 cursor-pointer"
              title="Choose profile photo"
            >
              <Camera size={16} />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <div>
            <p className="font-semibold text-gray-900">
              {profile.name || "Administrator"}
            </p>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <p className="mt-1 text-xs text-gray-400">
              JPG, PNG or WebP. Maximum size: 5MB.
            </p>

            {selectedFile && (
              <button
                type="button"
                onClick={handleAvatarUpload}
                disabled={uploading}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/70 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Camera size={16} />
                )}
                {uploading ? "Uploading..." : "Upload Photo"}
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>Full Name</label>
              <div className="relative">
                <UserRound
                  size={17}
                  className="absolute left-3 top-3 text-gray-400"
                />
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleProfileChange}
                  className={`${inputClass} pl-10`}
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Email Address</label>
              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-3 top-3 text-gray-400"
                />
                <input
                  type="email"
                  value={profile.email}
                  readOnly
                  className={`${inputClass} cursor-not-allowed bg-gray-100 pl-10`}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Email changes are disabled until email verification is
                implemented.
              </p>
            </div>

            <div>
              <label className={labelClass}>Phone Number</label>
              <div className="relative">
                <Phone
                  size={17}
                  className="absolute left-3 top-3 text-gray-400"
                />
                <input
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleProfileChange}
                  placeholder="Enter phone number"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Location</label>
              <div className="relative">
                <MapPin
                  size={17}
                  className="absolute left-3 top-3 text-gray-400"
                />
                <input
                  type="text"
                  name="location"
                  value={profile.location}
                  onChange={handleProfileChange}
                  placeholder="City, State, Country"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t border-gray-100 pt-5">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/70 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </section>

      {/* Change password */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-3 text-blue-700">
            <LockKeyhole size={21} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Change Password
            </h2>
            <p className="text-sm text-gray-500">
              Update your administrator account password.
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-5">
          {[
            {
              name: "currentPassword",
              label: "Current Password",
              placeholder: "Enter current password",
            },
            {
              name: "newPassword",
              label: "New Password",
              placeholder: "Enter new password",
            },
            {
              name: "confirmPassword",
              label: "Confirm New Password",
              placeholder: "Confirm new password",
            },
          ].map((field) => (
            <div key={field.name}>
              <label className={labelClass}>{field.label}</label>
              <div className="relative">
                <input
                  type={showPasswords ? "text" : "password"}
                  value={passwords[field.name]}
                  onChange={(event) =>
                    setPasswords((previous) => ({
                      ...previous,
                      [field.name]: event.target.value,
                    }))
                  }
                  placeholder={field.placeholder}
                  className={`${inputClass} pr-12`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords((previous) => !previous)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-700"
                  aria-label={
                    showPasswords ? "Hide passwords" : "Show passwords"
                  }
                >
                  {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          ))}

          <div className="flex justify-end border-t border-gray-100 pt-5">
            <button
              type="submit"
              disabled={changingPassword}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {changingPassword ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <LockKeyhole size={17} />
              )}
              {changingPassword ? "Updating..." : "Change Password"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default AdminProfile;
