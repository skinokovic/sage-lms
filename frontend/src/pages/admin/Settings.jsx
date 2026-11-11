import { useEffect, useState } from "react";

import { toast } from "react-toastify";

import {
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  CreditCard,
  Globe,
  KeyRound,
  Lock,
  Mail,
  Save,
  RotateCcw,
  Settings as SettingsIcon,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import AdminProfile from "../../components/admin/AdminProfile";
import { UserRound } from "lucide-react";
import { settingsApi } from "../../api/settingsApi";

const defaultSettings = {
  // ---------------------------------------------------------
  // GENERAL
  // ---------------------------------------------------------
  platformName: "SAGE LMS",
  platformEmail: "admin@sagelms.com",
  supportEmail: "support@sagelms.com",
  phone: "+234 800 000 0000",
  description:
    "A modern learning management platform for students, instructors, and administrators.",

  // ---------------------------------------------------------
  // LOCALIZATION
  // ---------------------------------------------------------
  language: "English",
  timezone: "Africa/Lagos",
  currency: "NGN (₦)",

  // ---------------------------------------------------------
  // NOTIFICATIONS
  // ---------------------------------------------------------
  emailNotifications: true,
  assignmentNotifications: true,
  enrollmentNotifications: true,
  certificateNotifications: true,
  marketingNotifications: false,

  // ---------------------------------------------------------
  // LEARNING
  // ---------------------------------------------------------
  allowStudentRegistration: true,
  requireEmailVerification: true,
  allowInstructorRegistration: false,
  courseApprovalRequired: true,
  assignmentApprovalRequired: false,
  certificateAutoIssue: true,

  // ---------------------------------------------------------
  // SECURITY
  // ---------------------------------------------------------
  twoFactorAuthentication: false,
  sessionTimeout: "30 minutes",
  passwordExpiry: "90 days",

  // ---------------------------------------------------------
  // PAYMENTS
  // ---------------------------------------------------------
  paymentGateway: "Paystack",
  paymentMode: "Test Mode",
  defaultCoursePrice: "50000",
  taxRate: "0",
};

const Settings = () => {
  // ---------------------------------------------------------
  // SETTINGS STATE
  // ---------------------------------------------------------
  const [settings, setSettings] = useState(defaultSettings);

  // Stores the last successfully saved version.
  // Used by the Reset button.
  const [originalSettings, setOriginalSettings] = useState(defaultSettings);

  const [activeSection, setActiveSection] = useState("general");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  // ---------------------------------------------------------
  // LOAD SETTINGS FROM BACKEND
  // ---------------------------------------------------------
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);

        const response = await settingsApi.getSettings();

        const data = response.data?.data;

        if (!data) {
          throw new Error("Settings data was not returned by the server.");
        }

        const loadedSettings = {
          ...defaultSettings,
          ...data,

          // Backend stores these as Numbers.
          // Inputs expect strings.
          defaultCoursePrice: String(
            data.defaultCoursePrice ?? defaultSettings.defaultCoursePrice,
          ),

          taxRate: String(data.taxRate ?? defaultSettings.taxRate),
        };

        setSettings(loadedSettings);

        setOriginalSettings(loadedSettings);
      } catch (error) {
        console.error("Failed to load settings:", error);

        toast.error(
          error.response?.data?.message || "Failed to load platform settings.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // ---------------------------------------------------------
  // UPDATE SETTING
  // ---------------------------------------------------------
  const updateSetting = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ---------------------------------------------------------
  // SAVE SETTINGS
  // ---------------------------------------------------------
  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        ...settings,

        // Convert frontend strings to numbers before
        // sending them to the backend.
        defaultCoursePrice: Number(settings.defaultCoursePrice),

        taxRate: Number(settings.taxRate),
      };

      const response = await settingsApi.updateSettings(payload);

      const savedData = response.data?.data;

      if (!savedData) {
        throw new Error("The server did not return saved settings.");
      }

      // Convert backend numbers back to strings so that
      // the number inputs continue working correctly.
      const savedSettings = {
        ...defaultSettings,
        ...savedData,

        defaultCoursePrice: String(
          savedData.defaultCoursePrice ?? defaultSettings.defaultCoursePrice,
        ),

        taxRate: String(savedData.taxRate ?? defaultSettings.taxRate),
      };

      setSettings(savedSettings);

      setOriginalSettings(savedSettings);

      toast.success(response.data?.message || "Settings saved successfully.");
    } catch (error) {
      console.error("Failed to save settings:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to save settings. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------
  // RESET SETTINGS
  // ---------------------------------------------------------
  const handleReset = () => {
    setSettings({
      ...originalSettings,
    });

    toast.info("Settings have been reset.");
  };

  // ---------------------------------------------------------
  // SIDEBAR ITEMS
  // ---------------------------------------------------------
  const sections = [
    {
      id: "general",
      label: "General",
      description: "Platform information",
      icon: SettingsIcon,
    },
    {
      id: "notifications",
      label: "Notifications",
      description: "Email and alerts",
      icon: Bell,
    },
    {
      id: "learning",
      label: "Learning",
      description: "Course preferences",
      icon: BookOpen,
    },
    {
      id: "security",
      label: "Security",
      description: "Account protection",
      icon: ShieldCheck,
    },
    {
      id: "payments",
      label: "Payments",
      description: "Payment configuration",
      icon: CreditCard,
    },
    {
      id: "localization",
      label: "Localization",
      description: "Language and region",
      icon: Globe,
    },

    {
      id: "profile",
      label: "Admin Profile",
      icon: UserRound,
    },
  ];

  // ---------------------------------------------------------
  // INPUT COMPONENT
  // ---------------------------------------------------------
  const InputField = ({
    label,
    value,
    onChange,
    type = "text",
    placeholder = "",
    description = "",
  }) => {
    return (
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          {label}
        </label>

        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-[#B00000]/10"
        />

        {description && (
          <p className="mt-1.5 text-xs text-gray-400">{description}</p>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------
  // SELECT COMPONENT
  // ---------------------------------------------------------
  const SelectField = ({
    label,
    value,
    onChange,
    options,
    description = "",
  }) => {
    return (
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          {label}
        </label>

        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 pr-10 text-sm text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-[#B00000]/10"
          >
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>

        {description && (
          <p className="mt-1.5 text-xs text-gray-400">{description}</p>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------
  // TOGGLE COMPONENT
  // ---------------------------------------------------------
  const Toggle = ({ label, description, checked, onChange }) => {
    return (
      <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 p-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800">{label}</p>

          {description && (
            <p className="mt-1 max-w-xl text-xs leading-5 text-gray-500">
              {description}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => onChange(!checked)}
          aria-pressed={checked}
          className={`relative mt-0.5 h-6 w-11 shrink-0 cursor-pointer rounded-full transition ${
            checked ? "bg-primary" : "bg-gray-300"
          }`}
        >
          <span
            className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
              checked ? "left-6" : "left-1"
            }`}
          />
        </button>
      </div>
    );
  };

  // ---------------------------------------------------------
  // SECTION HEADER
  // ---------------------------------------------------------
  const SectionHeader = ({ icon: Icon, title, description }) => {
    return (
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
          <Icon className="h-5 w-5 text-primary" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>

          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------
  // GENERAL SETTINGS
  // ---------------------------------------------------------
  const GeneralSettings = () => (
    <div>
      <SectionHeader
        icon={SettingsIcon}
        title="General Settings"
        description="Manage your platform identity and contact information."
      />

      <div className="space-y-6">
        <div className="grid gap-5 md:grid-cols-2">
          <InputField
            label="Platform Name"
            value={settings.platformName}
            onChange={(value) => updateSetting("platformName", value)}
            placeholder="Enter platform name"
          />

          <InputField
            label="Platform Email"
            value={settings.platformEmail}
            onChange={(value) => updateSetting("platformEmail", value)}
            type="email"
            placeholder="admin@example.com"
          />

          <InputField
            label="Support Email"
            value={settings.supportEmail}
            onChange={(value) => updateSetting("supportEmail", value)}
            type="email"
            placeholder="support@example.com"
          />

          <InputField
            label="Phone Number"
            value={settings.phone}
            onChange={(value) => updateSetting("phone", value)}
            placeholder="+234..."
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Platform Description
          </label>

          <textarea
            value={settings.description}
            onChange={(e) => updateSetting("description", e.target.value)}
            rows={4}
            className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-[#B00000]/10"
          />

          <p className="mt-1.5 text-xs text-gray-400">
            A short description of your learning platform.
          </p>
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------
  // NOTIFICATION SETTINGS
  // ---------------------------------------------------------
  const NotificationSettings = () => (
    <div>
      <SectionHeader
        icon={Bell}
        title="Notification Settings"
        description="Choose which notifications the platform should send."
      />

      <div className="space-y-3">
        <Toggle
          label="Email Notifications"
          description="Send important platform updates to users by email."
          checked={settings.emailNotifications}
          onChange={(value) => updateSetting("emailNotifications", value)}
        />

        <Toggle
          label="Assignment Notifications"
          description="Notify students when assignments are created, updated, or graded."
          checked={settings.assignmentNotifications}
          onChange={(value) => updateSetting("assignmentNotifications", value)}
        />

        <Toggle
          label="Enrollment Notifications"
          description="Notify students and instructors about new course enrollments."
          checked={settings.enrollmentNotifications}
          onChange={(value) => updateSetting("enrollmentNotifications", value)}
        />

        <Toggle
          label="Certificate Notifications"
          description="Notify students when certificates become available."
          checked={settings.certificateNotifications}
          onChange={(value) => updateSetting("certificateNotifications", value)}
        />

        <Toggle
          label="Marketing Notifications"
          description="Send promotional announcements and platform marketing emails."
          checked={settings.marketingNotifications}
          onChange={(value) => updateSetting("marketingNotifications", value)}
        />
      </div>
    </div>
  );

  // ---------------------------------------------------------
  // LEARNING SETTINGS
  // ---------------------------------------------------------
  const LearningSettings = () => (
    <div>
      <SectionHeader
        icon={BookOpen}
        title="Learning Settings"
        description="Configure how courses, assignments, and certificates work."
      />

      <div className="space-y-3">
        <Toggle
          label="Allow Student Registration"
          description="Allow new students to create accounts without administrator intervention."
          checked={settings.allowStudentRegistration}
          onChange={(value) => updateSetting("allowStudentRegistration", value)}
        />

        <Toggle
          label="Require Email Verification"
          description="Students must verify their email address before accessing the platform."
          checked={settings.requireEmailVerification}
          onChange={(value) => updateSetting("requireEmailVerification", value)}
        />

        <Toggle
          label="Allow Instructor Registration"
          description="Allow users to register as instructors."
          checked={settings.allowInstructorRegistration}
          onChange={(value) =>
            updateSetting("allowInstructorRegistration", value)
          }
        />

        <Toggle
          label="Course Approval Required"
          description="Courses created by instructors must be approved by an administrator before publication."
          checked={settings.courseApprovalRequired}
          onChange={(value) => updateSetting("courseApprovalRequired", value)}
        />

        <Toggle
          label="Assignment Approval Required"
          description="Require administrator approval before instructor assignments are published."
          checked={settings.assignmentApprovalRequired}
          onChange={(value) =>
            updateSetting("assignmentApprovalRequired", value)
          }
        />

        <Toggle
          label="Automatically Issue Certificates"
          description="Automatically generate certificates when students satisfy course completion requirements."
          checked={settings.certificateAutoIssue}
          onChange={(value) => updateSetting("certificateAutoIssue", value)}
        />
      </div>
    </div>
  );

  // ---------------------------------------------------------
  // SECURITY SETTINGS
  // ---------------------------------------------------------
  const SecuritySettings = () => (
    <div>
      <SectionHeader
        icon={ShieldCheck}
        title="Security Settings"
        description="Manage authentication and account security."
      />

      <div className="space-y-6">
        <Toggle
          label="Two-Factor Authentication"
          description="Require an additional verification step when administrators sign in."
          checked={settings.twoFactorAuthentication}
          onChange={(value) => updateSetting("twoFactorAuthentication", value)}
        />

        <div className="grid gap-5 md:grid-cols-2">
          <SelectField
            label="Session Timeout"
            value={settings.sessionTimeout}
            onChange={(value) => updateSetting("sessionTimeout", value)}
            options={[
              "15 minutes",
              "30 minutes",
              "1 hour",
              "2 hours",
              "4 hours",
            ]}
          />

          <SelectField
            label="Password Expiry"
            value={settings.passwordExpiry}
            onChange={(value) => updateSetting("passwordExpiry", value)}
            options={["30 days", "60 days", "90 days", "180 days", "Never"]}
          />
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />

            <div>
              <p className="text-sm font-semibold text-blue-900">
                Security recommendation
              </p>

              <p className="mt-1 text-xs leading-5 text-blue-700">
                Enable two-factor authentication for administrator accounts when
                your authentication backend is ready.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------
  // PAYMENT SETTINGS
  // ---------------------------------------------------------
  const PaymentSettings = () => (
    <div>
      <SectionHeader
        icon={CreditCard}
        title="Payment Settings"
        description="Configure how students pay for courses."
      />

      <div className="space-y-6">
        <div className="grid gap-5 md:grid-cols-2">
          <SelectField
            label="Payment Gateway"
            value={settings.paymentGateway}
            onChange={(value) => updateSetting("paymentGateway", value)}
            options={["Paystack", "Flutterwave", "Stripe"]}
          />

          <SelectField
            label="Payment Mode"
            value={settings.paymentMode}
            onChange={(value) => updateSetting("paymentMode", value)}
            options={["Test Mode", "Live Mode"]}
          />

          <InputField
            label="Default Course Price"
            value={settings.defaultCoursePrice}
            onChange={(value) => updateSetting("defaultCoursePrice", value)}
            type="number"
            description="Default price in Nigerian Naira."
          />

          <InputField
            label="Tax Rate (%)"
            value={settings.taxRate}
            onChange={(value) => updateSetting("taxRate", value)}
            type="number"
            description="Set to 0 if tax is not applied."
          />
        </div>

        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-start gap-3">
            <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-yellow-700" />

            <div>
              <p className="text-sm font-semibold text-yellow-900">
                Payment configuration
              </p>

              <p className="mt-1 text-xs leading-5 text-yellow-700">
                These payment preferences are stored in the backend. Payment
                provider API keys and secret credentials should be configured
                securely on the server and should not be stored in the frontend.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------
  // LOCALIZATION SETTINGS
  // ---------------------------------------------------------
  const LocalizationSettings = () => (
    <div>
      <SectionHeader
        icon={Globe}
        title="Localization"
        description="Configure the platform's language, timezone, and currency."
      />

      <div className="grid gap-5 md:grid-cols-2">
        <SelectField
          label="Language"
          value={settings.language}
          onChange={(value) => updateSetting("language", value)}
          options={["English", "French", "Spanish"]}
        />

        <SelectField
          label="Timezone"
          value={settings.timezone}
          onChange={(value) => updateSetting("timezone", value)}
          options={["Africa/Lagos", "UTC", "Europe/London", "America/New_York"]}
        />

        <SelectField
          label="Currency"
          value={settings.currency}
          onChange={(value) => updateSetting("currency", value)}
          options={["NGN (₦)", "USD ($)", "GBP (£)", "EUR (€)"]}
        />
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-start gap-3">
          <Globe className="mt-0.5 h-5 w-5 shrink-0 text-gray-600" />

          <div>
            <p className="text-sm font-semibold text-gray-800">
              Current regional configuration
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Your platform is currently configured for Nigeria, using West
              Africa Time and Nigerian Naira.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------
  // RENDER ACTIVE SECTION
  // ---------------------------------------------------------
  const renderActiveSection = () => {
    switch (activeSection) {
      case "notifications":
        return <NotificationSettings />;

      case "learning":
        return <LearningSettings />;

      case "security":
        return <SecuritySettings />;

      case "payments":
        return <PaymentSettings />;

      case "localization":
        return <LocalizationSettings />;

      case "profile":
        return <AdminProfile />;

      case "general":
        return <GeneralSettings />;

      case "profile":
      default:
        return <AdminProfile />;
    }
  };

  // ---------------------------------------------------------
  // LOADING STATE
  // ---------------------------------------------------------
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 animate-pulse rounded-xl bg-gray-200" />

          <div className="space-y-2">
            <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />

            <div className="h-4 w-64 animate-pulse rounded bg-gray-100" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="h-80 animate-pulse rounded-2xl bg-gray-100" />

          <div className="min-h-125 animate-pulse rounded-2xl bg-gray-100" />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // PAGE
  // ---------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary">
              <SettingsIcon className="h-5 w-5 text-white" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

              <p className="text-sm text-gray-500">
                Manage your LMS platform configuration.
              </p>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition hover:bg-[#900000] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />

            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* SETTINGS LAYOUT */}
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* SETTINGS NAVIGATION */}
        <div className="h-fit rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="mb-3 px-3 py-2">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Configuration
            </p>
          </div>

          <div className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;

              const active = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                    active
                      ? "bg-red-50 text-primary"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 ${
                      active ? "text-primary" : "text-gray-400"
                    }`}
                  />

                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{section.label}</p>

                    <p
                      className={`mt-0.5 text-xs ${
                        active ? "text-red-400" : "text-gray-400"
                      }`}
                    >
                      {section.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* SETTINGS CONTENT */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          {renderActiveSection()}

          {/* MOBILE SAVE BUTTON */}
          <div className="mt-8 flex flex-col gap-3 border-t border-gray-100 pt-6 sm:hidden">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition hover:bg-[#900000] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />

              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Changes
            </button>
          </div>
        </div>
      </div>

      {/* SECURITY / ACCOUNT INFO */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* ADMIN SECURITY */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <KeyRound className="h-5 w-5 text-secondary" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Administrator Security
              </h3>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Manage your administrator account security and authentication
                preferences.
              </p>

              <button
                type="button"
                onClick={() =>
                  toast.info(
                    "Administrator security management will be connected to the backend separately.",
                  )
                }
                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-secondary hover:underline"
              >
                Manage Security
              </button>
            </div>
          </div>
        </div>

        {/* USER REGISTRATION */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
              <UserPlus className="h-5 w-5 text-green-600" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-900">
                User Registration
              </h3>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Control whether students and instructors can create accounts on
                the platform.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {settings.allowStudentRegistration && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1.5 text-xs font-semibold text-green-700">
                    <Check className="h-3 w-3" />
                    Students
                  </span>
                )}

                {settings.allowInstructorRegistration && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700">
                    <Check className="h-3 w-3" />
                    Instructors
                  </span>
                )}

                {!settings.allowStudentRegistration &&
                  !settings.allowInstructorRegistration && (
                    <span className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-500">
                      Registration disabled
                    </span>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BACKEND STATUS */}
      <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">
        <Check className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />

        <div>
          <p className="text-sm font-semibold text-green-800">
            Settings connected
          </p>

          <p className="mt-1 text-xs leading-5 text-green-700">
            Platform settings are loaded from and saved to the backend database.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
