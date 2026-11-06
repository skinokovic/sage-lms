import InstructorApplication from "../models/InstructorApplication.js";
import User from "../models/User.js";

const getUserId = (req) => req.user?._id || req.user?.id || req.user?.userId;

const requireAdmin = async (req, res) => {
  const userId = getUserId(req);

  if (!userId) {
    res.status(401).json({ message: "Authentication required." });
    return false;
  }

  const currentUser = req.user?.role
    ? req.user
    : await User.findById(userId).select("role");

  if (currentUser?.role !== "admin") {
    res.status(403).json({ message: "Admin access required." });
    return false;
  }

  return true;
};

const normalizeUrl = (value = "") => value.trim();

const validateApplication = (body) => {
  const required = [
    "professionalTitle",
    "expertise",
    "courseCategory",
    "teachingExperience",
    "motivation",
  ];

  for (const field of required) {
    if (!String(body[field] || "").trim()) {
      return `${field} is required.`;
    }
  }

  const years = Number(body.yearsOfExperience);
  if (!Number.isFinite(years) || years < 0 || years > 80) {
    return "Years of experience must be between 0 and 80.";
  }

  if (body.linkedinUrl && !/^https?:\/\//i.test(body.linkedinUrl)) {
    return "LinkedIn URL must start with http:// or https://.";
  }

  if (body.websiteUrl && !/^https?:\/\//i.test(body.websiteUrl)) {
    return "Website URL must start with http:// or https://.";
  }

  return null;
};

export const createApplication = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (req.user?.role !== "student") {
      return res.status(400).json({
        message: "Only student accounts can apply to become instructors.",
      });
    }

    const validationError = validateApplication(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const existing = await InstructorApplication.findOne({ user: userId }).sort(
      {
        createdAt: -1,
      },
    );

    if (
      existing &&
      ["pending", "under_review", "approved"].includes(existing.status)
    ) {
      return res.status(409).json({
        message:
          existing.status === "approved"
            ? "You are already an approved instructor."
            : "You already have an instructor application under review.",
        application: existing,
      });
    }

    const payload = {
      user: userId,
      professionalTitle: String(req.body.professionalTitle).trim(),
      expertise: String(req.body.expertise).trim(),
      yearsOfExperience: Number(req.body.yearsOfExperience),
      organization: String(req.body.organization || "").trim(),
      courseCategory: String(req.body.courseCategory).trim(),
      teachingExperience: String(req.body.teachingExperience).trim(),
      motivation: String(req.body.motivation).trim(),
      linkedinUrl: normalizeUrl(req.body.linkedinUrl || ""),
      websiteUrl: normalizeUrl(req.body.websiteUrl || ""),
      status: "pending",
      adminNotes: "",
      reviewedBy: undefined,
      reviewedAt: undefined,
    };

    let application;

    if (existing?.status === "rejected") {
      Object.assign(existing, payload);
      application = await existing.save();
    } else {
      application = await InstructorApplication.create(payload);
    }

    return res.status(201).json({
      message: "Instructor application submitted successfully.",
      application,
    });
  } catch (error) {
    console.error("createApplication error:", error);
    return res.status(500).json({ message: "Unable to submit application." });
  }
};

export const getMyApplication = async (req, res) => {
  try {
    const userId = getUserId(req);
    const application = await InstructorApplication.findOne({ user: userId })
      .sort({ createdAt: -1 })
      .populate("reviewedBy", "name email");

    if (!application) {
      return res
        .status(404)
        .json({ message: "No instructor application found." });
    }

    return res.json({ application });
  } catch (error) {
    console.error("getMyApplication error:", error);
    return res.status(500).json({ message: "Unable to load application." });
  }
};

export const listApplications = async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;

    const { status, search } = req.query;
    const filter = {};

    if (
      status &&
      ["pending", "under_review", "approved", "rejected"].includes(status)
    ) {
      filter.status = status;
    }

    let applications = await InstructorApplication.find(filter)
      .populate("user", "name email role avatarUrl createdAt")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 });

    if (search?.trim()) {
      const query = search.trim().toLowerCase();
      applications = applications.filter((application) =>
        [
          application.user?.name,
          application.user?.email,
          application.expertise,
          application.professionalTitle,
          application.courseCategory,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query),
      );
    }

    return res.json({ applications });
  } catch (error) {
    console.error("listApplications error:", error);
    return res
      .status(500)
      .json({ message: "Unable to load instructor applications." });
  }
};

export const getApplicationById = async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;

    const application = await InstructorApplication.findById(req.params.id)
      .populate("user", "name email role avatarUrl phone createdAt")
      .populate("reviewedBy", "name email");

    if (!application) {
      return res
        .status(404)
        .json({ message: "Instructor application not found." });
    }

    return res.json({ application });
  } catch (error) {
    console.error("getApplicationById error:", error);
    return res.status(500).json({ message: "Unable to load application." });
  }
};

export const markUnderReview = async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;

    const application = await InstructorApplication.findById(req.params.id);

    if (!application) {
      return res
        .status(404)
        .json({ message: "Instructor application not found." });
    }

    if (application.status === "approved") {
      return res
        .status(400)
        .json({
          message: "An approved application cannot be moved back to review.",
        });
    }

    application.status = "under_review";
    application.reviewedBy = getUserId(req);
    application.reviewedAt = new Date();

    await application.save();

    return res.json({
      message: "Application marked as under review.",
      application,
    });
  } catch (error) {
    console.error("markUnderReview error:", error);
    return res.status(500).json({ message: "Unable to update application." });
  }
};

export const approveApplication = async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;

    const application = await InstructorApplication.findById(req.params.id);

    if (!application) {
      return res
        .status(404)
        .json({ message: "Instructor application not found." });
    }

    if (application.status === "approved") {
      return res
        .status(400)
        .json({ message: "Application is already approved." });
    }

    const user = await User.findById(application.user);

    if (!user) {
      return res
        .status(404)
        .json({ message: "Applicant user account not found." });
    }

    if (user.role === "admin") {
      return res
        .status(400)
        .json({
          message: "An admin account cannot be converted through this flow.",
        });
    }

    user.role = "instructor";
    await user.save();

    application.status = "approved";
    application.adminNotes = String(req.body.adminNotes || "").trim();
    application.reviewedBy = getUserId(req);
    application.reviewedAt = new Date();
    await application.save();

    const populated = await InstructorApplication.findById(application._id)
      .populate("user", "name email role avatarUrl")
      .populate("reviewedBy", "name email");

    return res.json({
      message: "Application approved and user converted to instructor.",
      application: populated,
    });
  } catch (error) {
    console.error("approveApplication error:", error);
    return res.status(500).json({ message: "Unable to approve application." });
  }
};

export const rejectApplication = async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;

    const notes = String(req.body.adminNotes || "").trim();

    if (!notes) {
      return res
        .status(400)
        .json({ message: "A rejection reason is required." });
    }

    const application = await InstructorApplication.findById(req.params.id);

    if (!application) {
      return res
        .status(404)
        .json({ message: "Instructor application not found." });
    }

    if (application.status === "approved") {
      return res
        .status(400)
        .json({ message: "An approved application cannot be rejected." });
    }

    application.status = "rejected";
    application.adminNotes = notes;
    application.reviewedBy = getUserId(req);
    application.reviewedAt = new Date();
    await application.save();

    const populated = await InstructorApplication.findById(application._id)
      .populate("user", "name email role avatarUrl")
      .populate("reviewedBy", "name email");

    return res.json({
      message: "Instructor application rejected.",
      application: populated,
    });
  } catch (error) {
    console.error("rejectApplication error:", error);
    return res.status(500).json({ message: "Unable to reject application." });
  }
};
