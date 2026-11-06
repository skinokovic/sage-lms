import crypto from "crypto";
import Course from "../models/Course.js";
import Certificate from "../models/Certificate.js";
import InstructorSignature from "../models/InstructorSignature.js";
import Progress from "../models/Progress.js";
import User from "../models/User.js";
import { getEnrolledCourseIds } from "./studentEnrollments.js";

const makeCode = () =>
  `SAGE-${new Date().getFullYear()}-${crypto
    .randomBytes(5)
    .toString("hex")
    .toUpperCase()}`;

export const displayName = (user) =>
  user?.name ||
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
  "";

export const lessonIdsOf = (course) =>
  (course.modules || []).flatMap((courseModule) =>
    (courseModule.lessons || []).map((lesson) => String(lesson._id)),
  );

// Issues a certificate for every enrolled course the student has fully completed.
export const issueCertificatesForStudent = async (student) => {
  const courseIds = await getEnrolledCourseIds(student);
  if (courseIds.length === 0) return;

  const [courses, existing, doneRows] = await Promise.all([
    Course.find({ _id: { $in: courseIds }, status: { $ne: "Draft" } })
      .select("title instructor modules.lessons._id")
      .lean(),
    Certificate.find({ userId: student._id, courseId: { $in: courseIds } })
      .select("courseId")
      .lean(),
    Progress.find({
      userId: student._id,
      courseId: { $in: courseIds },
      completed: true,
    })
      .select("courseId lessonId completedAt")
      .lean(),
  ]);

  const certified = new Set(existing.map((item) => String(item.courseId)));

  const doneByCourse = new Map();
  doneRows.forEach((row) => {
    const key = String(row.courseId);
    const entry = doneByCourse.get(key) || { ids: new Set(), last: null };
    entry.ids.add(String(row.lessonId));
    if (row.completedAt && (!entry.last || row.completedAt > entry.last)) {
      entry.last = row.completedAt;
    }
    doneByCourse.set(key, entry);
  });

  const eligible = courses.filter((course) => {
    const key = String(course._id);
    if (certified.has(key)) return false;

    const lessonIds = lessonIdsOf(course);
    const entry = doneByCourse.get(key);
    return (
      lessonIds.length > 0 &&
      entry &&
      lessonIds.every((id) => entry.ids.has(id))
    );
  });

  if (eligible.length === 0) return;

  const instructorIds = [
    ...new Set(eligible.map((course) => String(course.instructor))),
  ];

  const [instructors, signatures] = await Promise.all([
    User.find({ _id: { $in: instructorIds } })
      .select("name firstName lastName")
      .lean(),
    InstructorSignature.find({ user: { $in: instructorIds } }).lean(),
  ]);

  const nameById = new Map(
    instructors.map((user) => [String(user._id), displayName(user)]),
  );
  const signatureById = new Map(
    signatures.map((item) => [String(item.user), item.url]),
  );

  for (const course of eligible) {
    const instructorKey = String(course.instructor);
    const entry = doneByCourse.get(String(course._id));

    const base = {
      userId: student._id,
      courseId: course._id,
      instructorId: course.instructor,
      studentName: displayName(student),
      courseTitle: course.title,
      instructorName: nameById.get(instructorKey) || "",
      signatureUrl: signatureById.get(instructorKey) || "",
      totalLessons: lessonIdsOf(course).length,
      issuedAt: entry?.last || new Date(),
    };

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await Certificate.create({ ...base, certificateCode: makeCode() });
        break;
      } catch (error) {
        if (error.code !== 11000) throw error;
        // Duplicate code → retry. Duplicate user+course → already issued.
        if (!error.keyPattern?.certificateCode) break;
      }
    }
  }
};
