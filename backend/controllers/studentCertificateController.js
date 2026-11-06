import asyncHandler from "express-async-handler";
import Course from "../models/Course.js";
import Certificate from "../models/Certificate.js";
import InstructorSignature from "../models/InstructorSignature.js";
import Progress from "../models/Progress.js";
import { getEnrolledCourseIds } from "../utils/studentEnrollments.js";
import {
  displayName,
  issueCertificatesForStudent,
  lessonIdsOf,
} from "../utils/issueCertificates.js";

// GET /api/student/certificates
export const getStudentCertificates = asyncHandler(async (req, res) => {
  await issueCertificatesForStudent(req.user);

  const [courseIds, certificates] = await Promise.all([
    getEnrolledCourseIds(req.user),
    Certificate.find({ userId: req.user._id }).sort({ issuedAt: -1 }).lean(),
  ]);

  // Certificates issued before the instructor signed get the signature now,
  // and keep it from then on.
  const unsigned = certificates.filter(
    (cert) => !cert.signatureUrl && cert.instructorId,
  );

  if (unsigned.length > 0) {
    const signatures = await InstructorSignature.find({
      user: { $in: unsigned.map((cert) => cert.instructorId) },
    }).lean();
    const signatureById = new Map(
      signatures.map((item) => [String(item.user), item.url]),
    );

    await Promise.all(
      unsigned.map(async (cert) => {
        const url = signatureById.get(String(cert.instructorId));
        if (!url) return;

        cert.signatureUrl = url;
        await Certificate.updateOne(
          { _id: cert._id, signatureUrl: "" },
          { $set: { signatureUrl: url } },
        );
      }),
    );
  }

  const allCourseIds = [
    ...new Set([
      ...courseIds,
      ...certificates.map((cert) => String(cert.courseId)),
    ]),
  ];

  const [courses, doneRows] = await Promise.all([
    Course.find({ _id: { $in: allCourseIds } })
      .select("title category duration instructor modules.lessons._id")
      .populate("instructor", "name firstName lastName")
      .lean(),
    Progress.find({
      userId: req.user._id,
      courseId: { $in: courseIds },
      completed: true,
    })
      .select("courseId lessonId")
      .lean(),
  ]);

  const courseById = new Map(
    courses.map((course) => [String(course._id), course]),
  );

  const earned = certificates.map((cert) => {
    const course = courseById.get(String(cert.courseId));

    return {
      id: String(cert._id),
      courseId: String(cert.courseId),
      certificateCode: cert.certificateCode,
      title: cert.courseTitle || course?.title || "Course",
      category: course?.category || "General",
      instructor:
        cert.instructorName || displayName(course?.instructor) || "Instructor",
      studentName: cert.studentName || displayName(req.user),
      issueDate: cert.issuedAt,
      duration: course?.duration || "Self-paced",
      totalLessons: cert.totalLessons || 0,
      signatureUrl: cert.signatureUrl || "",
      signed: Boolean(cert.signatureUrl),
      status: "Earned",
      completion: 100,
    };
  });

  const certifiedCourseIds = new Set(
    certificates.map((cert) => String(cert.courseId)),
  );

  const doneByCourse = new Map();
  doneRows.forEach((row) => {
    const key = String(row.courseId);
    const set = doneByCourse.get(key) || new Set();
    set.add(String(row.lessonId));
    doneByCourse.set(key, set);
  });

  const inProgress = courseIds
    .filter((id) => !certifiedCourseIds.has(id) && courseById.has(id))
    .map((id) => {
      const course = courseById.get(id);
      const lessonIds = lessonIdsOf(course);
      const done = doneByCourse.get(id) || new Set();
      const completedCount = lessonIds.filter((lid) => done.has(lid)).length;

      return {
        id,
        courseId: id,
        title: course.title,
        category: course.category || "General",
        instructor: displayName(course.instructor) || "Instructor",
        duration: course.duration || "Self-paced",
        status: "In Progress",
        completion: lessonIds.length
          ? Math.round((completedCount / lessonIds.length) * 100)
          : 0,
      };
    });

  res.json({ success: true, certificates: [...earned, ...inProgress] });
});
