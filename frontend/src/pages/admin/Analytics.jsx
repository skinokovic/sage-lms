import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

import {
  Activity,
  ArrowDown,
  ArrowUp,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Download,
  GraduationCap,
  TrendingUp,
  Users,
  Award,
  Clock3,
  Target,
  FileSpreadsheet,
  FileText,
  RefreshCw,
} from "lucide-react";

import { fetchAnalytics } from "../../store/analyticsSlice";

const Analytics = () => {
  const dispatch = useDispatch();

  const {
    data: analyticsData,
    status,
    error,
  } = useSelector((state) => state.analytics);

  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [exportOpen, setExportOpen] = useState(false);

  const exportRef = useRef(null);

  // ---------------------------------------------------------
  // DATE RANGE
  // ---------------------------------------------------------

  const rangeMap = {
    "Last 7 Days": "7d",
    "Last 30 Days": "30d",
    "Last 90 Days": "90d",
    "This Year": "1y",
  };

  const apiRange = rangeMap[dateRange] || "30d";

  // ---------------------------------------------------------
  // FETCH ANALYTICS
  // ---------------------------------------------------------

  useEffect(() => {
    dispatch(fetchAnalytics(apiRange));
  }, [dispatch, apiRange]);

  // ---------------------------------------------------------
  // CLOSE EXPORT MENU WHEN CLICKING OUTSIDE
  // ---------------------------------------------------------

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setExportOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ---------------------------------------------------------
  // SAFE NUMBER HELPER
  // ---------------------------------------------------------

  const safeNumber = (value, fallback = 0) => {
    const number = Number(value);

    return Number.isFinite(number) ? number : fallback;
  };

  // ---------------------------------------------------------
  // REAL BACKEND DATA
  // ---------------------------------------------------------

  const summary = analyticsData?.summary || {};

  const changes = analyticsData?.changes || {};

  const totalStudents = safeNumber(summary.totalStudents);

  const activeStudents = safeNumber(summary.activeStudents);

  const totalCourses = safeNumber(summary.totalCourses);

  const publishedCourses = safeNumber(summary.publishedCourses);

  const totalInstructors = safeNumber(summary.totalInstructors);

  const totalEnrollments = safeNumber(summary.totalEnrollments);

  const completedEnrollments = safeNumber(summary.completedEnrollments);

  const completionRate = safeNumber(summary.completionRate);

  const averageScore = safeNumber(summary.averageScore);

  const totalRevenue = safeNumber(summary.totalRevenue);

  const certificatesIssued = safeNumber(summary.certificatesIssued);

  // ---------------------------------------------------------
  // CHANGE VALUES
  // ---------------------------------------------------------

  const enrollmentChange = safeNumber(changes.enrollments);

  const activeStudentChange = safeNumber(changes.activeStudents);

  // ---------------------------------------------------------
  // ENROLLMENT DATA
  // ---------------------------------------------------------

  const currentEnrollmentData = useMemo(() => {
    const data = analyticsData?.enrollmentData;

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((item) => ({
      label: item.label || item.period || item.date || "",
      value: safeNumber(item.value ?? item.enrollments ?? item.count),
    }));
  }, [analyticsData]);

  // ---------------------------------------------------------
  // ACTIVITY DATA
  // ---------------------------------------------------------

  const activityData = useMemo(() => {
    const backendActivity = analyticsData?.activityData;

    if (Array.isArray(backendActivity) && backendActivity.length > 0) {
      return backendActivity.map((item) => ({
        label: item.label || item.name || "Activity",
        value: safeNumber(item.value),
        percentage: Math.min(100, Math.max(0, safeNumber(item.percentage))),
      }));
    }

    // Fallback derived from real summary data.
    const activePercentage =
      totalStudents > 0
        ? Math.round((activeStudents / totalStudents) * 100)
        : 0;

    return [
      {
        label: "Active Students",
        value: activeStudents,
        percentage: activePercentage,
      },
      {
        label: "Course Completion",
        value: Math.round(completionRate),
        percentage: Math.round(completionRate),
      },
      {
        label: "Assignment Submission",
        value: safeNumber(analyticsData?.totals?.assignmentSubmissions),
        percentage: 0,
      },
      {
        label: "Certificate Completion",
        value: certificatesIssued,
        percentage: 0,
      },
    ];
  }, [
    analyticsData,
    totalStudents,
    activeStudents,
    completionRate,
    certificatesIssued,
  ]);

  // ---------------------------------------------------------
  // COURSE PERFORMANCE
  // ---------------------------------------------------------

  const coursePerformance = useMemo(() => {
    const courses = analyticsData?.coursePerformance;

    if (!Array.isArray(courses)) {
      return [];
    }

    return courses.map((course) => ({
      id: course.id || course._id,
      name: course.name || course.title || "Untitled Course",

      students: safeNumber(course.students ?? course.enrollments),

      completion: Math.min(100, Math.max(0, safeNumber(course.completion))),

      averageScore: Math.min(100, Math.max(0, safeNumber(course.averageScore))),

      engagement: Math.min(
        100,
        Math.max(0, safeNumber(course.engagement ?? course.completion)),
      ),
    }));
  }, [analyticsData]);

  // ---------------------------------------------------------
  // REVENUE DATA
  // ---------------------------------------------------------

  const revenueData = useMemo(() => {
    const data = analyticsData?.revenueData;

    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((item) => ({
      label: item.label || item.period || item.month || "",

      value: safeNumber(item.value ?? item.revenue),
    }));
  }, [analyticsData]);

  // ---------------------------------------------------------
  // LEARNING INSIGHTS
  // ---------------------------------------------------------

  const totalCourseStudents = useMemo(() => {
    return coursePerformance.reduce(
      (total, course) => total + safeNumber(course.students),
      0,
    );
  }, [coursePerformance]);

  const assignmentSubmissions = safeNumber(
    analyticsData?.totals?.assignmentSubmissions,
  );

  const certificateCompletions = safeNumber(
    analyticsData?.totals?.certificateCompletions ?? certificatesIssued,
  );

  const averageLearningTime =
    analyticsData?.learningInsights?.averageLearningTime ||
    analyticsData?.activitySummary?.averageLearningTime ||
    "Not available";

  const assignmentSuccess = analyticsData?.learningInsights?.assignmentSuccess;

  // ---------------------------------------------------------
  // CALCULATED DISPLAY VALUES
  // ---------------------------------------------------------

  const maxEnrollment =
    currentEnrollmentData.length > 0
      ? Math.max(...currentEnrollmentData.map((item) => item.value))
      : 0;

  const maxRevenue =
    revenueData.length > 0
      ? Math.max(...revenueData.map((item) => item.value))
      : 0;

  // ---------------------------------------------------------
  // EXPORT HELPERS
  // ---------------------------------------------------------

  const generatedDate = new Date();

  const formattedDate = generatedDate.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const fileDate = generatedDate.toISOString().split("T")[0];

  const formatCurrency = (value) => `₦${Number(value).toLocaleString("en-NG")}`;

  // ---------------------------------------------------------
  // CSV DATA
  // ---------------------------------------------------------

  const getCsvRows = () => {
    const rows = [];

    rows.push(["SAGE LMS ANALYTICS REPORT"]);

    rows.push(["Date Range", dateRange]);

    rows.push(["Generated On", formattedDate]);

    rows.push([]);

    rows.push(["MAIN STATISTICS"]);

    rows.push(["Metric", "Value", "Change"]);

    rows.push([
      "Total Enrollments",
      totalEnrollments,
      `${enrollmentChange >= 0 ? "+" : ""}${enrollmentChange}%`,
    ]);

    rows.push([
      "Active Students",
      activeStudents,
      `${activeStudentChange >= 0 ? "+" : ""}${activeStudentChange}%`,
    ]);

    rows.push(["Completion Rate", `${completionRate}%`, ""]);

    rows.push(["Average Score", `${averageScore}%`, ""]);

    rows.push([]);

    rows.push(["ENROLLMENT TRENDS"]);

    rows.push(["Period", "Enrollments"]);

    currentEnrollmentData.forEach((item) => {
      rows.push([item.label, item.value]);
    });

    rows.push([]);

    rows.push(["STUDENT ACTIVITY"]);

    rows.push(["Activity", "Value", "Percentage"]);

    activityData.forEach((item) => {
      rows.push([
        item.label,
        item.value,
        item.percentage ? `${item.percentage}%` : "",
      ]);
    });

    rows.push([]);

    rows.push(["COURSE PERFORMANCE"]);

    rows.push([
      "Course",
      "Students",
      "Completion",
      "Average Score",
      "Engagement",
    ]);

    coursePerformance.forEach((course) => {
      rows.push([
        course.name,
        course.students,
        `${course.completion}%`,
        `${course.averageScore}%`,
        `${course.engagement}%`,
      ]);
    });

    rows.push([]);

    rows.push(["REVENUE OVERVIEW"]);

    rows.push(["Period", "Revenue (NGN)"]);

    revenueData.forEach((item) => {
      rows.push([item.label, item.value]);
    });

    rows.push([]);

    rows.push(["REVENUE SUMMARY"]);

    rows.push(["Total Revenue", totalRevenue]);

    rows.push([]);

    rows.push(["LEARNING INSIGHTS"]);

    rows.push(["Metric", "Value"]);

    rows.push(["Average Learning Time", averageLearningTime]);

    rows.push(["Course Completion", `${completionRate}%`]);

    rows.push(["Certificates Issued", certificatesIssued]);

    rows.push(["Assignment Submissions", assignmentSubmissions]);

    rows.push([
      "Assignment Success",
      assignmentSuccess !== undefined
        ? `${assignmentSuccess}%`
        : "Not available",
    ]);

    return rows;
  };

  // ---------------------------------------------------------
  // EXPORT CSV
  // ---------------------------------------------------------

  const exportCSV = () => {
    try {
      const rows = getCsvRows();

      const csvContent = rows
        .map((row) =>
          row
            .map((cell) => {
              const value = cell ?? "";

              return `"${String(value).replace(/"/g, '""')}"`;
            })
            .join(","),
        )
        .join("\n");

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = `sage-lms-analytics-${fileDate}.csv`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      setExportOpen(false);

      toast.success("Analytics CSV exported successfully.");
    } catch (error) {
      console.error("CSV export failed:", error);

      toast.error("Unable to export CSV report.");
    }
  };

  // ---------------------------------------------------------
  // EXPORT EXCEL
  // ---------------------------------------------------------
  // Existing Excel workbook structure preserved.
  // Only the data source has changed from mock data
  // to Redux/backend analytics data.
  // ---------------------------------------------------------

  const exportExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // -----------------------------------------------------
      // SUMMARY SHEET
      // -----------------------------------------------------

      const summaryRows = [
        ["SAGE LMS ANALYTICS REPORT"],
        [],
        ["Report Information"],
        ["Date Range", dateRange],
        ["Generated On", formattedDate],
        [],
        ["Main Statistics"],
        ["Metric", "Value", "Change"],
        [
          "Total Enrollments",
          totalEnrollments,
          `${enrollmentChange >= 0 ? "+" : ""}${enrollmentChange}%`,
        ],
        [
          "Active Students",
          activeStudents,
          `${activeStudentChange >= 0 ? "+" : ""}${activeStudentChange}%`,
        ],
        ["Completion Rate", `${completionRate}%`, ""],
        ["Average Score", `${averageScore}%`, ""],
        [],
        ["Revenue"],
        ["Total Revenue", totalRevenue],
        [],
        ["Learning Insights"],
        ["Average Learning Time", averageLearningTime],
        ["Course Completion", `${completionRate}%`],
        ["Certificates Issued", certificatesIssued],
        ["Assignment Submissions", assignmentSubmissions],
        [
          "Assignment Success",
          assignmentSuccess !== undefined
            ? `${assignmentSuccess}%`
            : "Not available",
        ],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);

      summarySheet["!cols"] = [{ wch: 32 }, { wch: 24 }, { wch: 18 }];

      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      // -----------------------------------------------------
      // ENROLLMENT SHEET
      // -----------------------------------------------------

      const enrollmentRows = [
        ["Period", "Enrollments"],
        ...currentEnrollmentData.map((item) => [item.label, item.value]),
      ];

      const enrollmentSheet = XLSX.utils.aoa_to_sheet(enrollmentRows);

      enrollmentSheet["!cols"] = [{ wch: 18 }, { wch: 18 }];

      XLSX.utils.book_append_sheet(workbook, enrollmentSheet, "Enrollments");

      // -----------------------------------------------------
      // ACTIVITY SHEET
      // -----------------------------------------------------

      const activityRows = [
        ["Activity", "Value", "Percentage"],
        ...activityData.map((item) => [
          item.label,
          item.value,
          item.percentage ? `${item.percentage}%` : "",
        ]),
      ];

      const activitySheet = XLSX.utils.aoa_to_sheet(activityRows);

      activitySheet["!cols"] = [{ wch: 28 }, { wch: 18 }, { wch: 18 }];

      XLSX.utils.book_append_sheet(workbook, activitySheet, "Student Activity");

      // -----------------------------------------------------
      // COURSE PERFORMANCE SHEET
      // -----------------------------------------------------

      const courseRows = [
        ["Course", "Students", "Completion", "Average Score", "Engagement"],
        ...coursePerformance.map((course) => [
          course.name,
          course.students,
          `${course.completion}%`,
          `${course.averageScore}%`,
          `${course.engagement}%`,
        ]),
      ];

      const courseSheet = XLSX.utils.aoa_to_sheet(courseRows);

      courseSheet["!cols"] = [
        { wch: 38 },
        { wch: 14 },
        { wch: 16 },
        { wch: 18 },
        { wch: 16 },
      ];

      XLSX.utils.book_append_sheet(workbook, courseSheet, "Course Performance");

      // -----------------------------------------------------
      // REVENUE SHEET
      // -----------------------------------------------------

      const revenueRows = [
        ["Period", "Revenue (NGN)"],
        ...revenueData.map((item) => [item.label, item.value]),
        [],
        ["Total Revenue", totalRevenue],
      ];

      const revenueSheet = XLSX.utils.aoa_to_sheet(revenueRows);

      revenueSheet["!cols"] = [{ wch: 18 }, { wch: 22 }];

      XLSX.utils.book_append_sheet(workbook, revenueSheet, "Revenue");

      // -----------------------------------------------------
      // SAVE WORKBOOK
      // -----------------------------------------------------

      XLSX.writeFile(workbook, `sage-lms-analytics-${fileDate}.xlsx`, {
        compression: true,
      });

      setExportOpen(false);

      toast.success("Analytics Excel report exported successfully.");
    } catch (error) {
      console.error("Excel export failed:", error);

      toast.error("Unable to export Excel report.");
    }
  };

  // ---------------------------------------------------------
  // EXPORT PDF
  // ---------------------------------------------------------

  const exportPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // -----------------------------------------------------
      // HEADER
      // -----------------------------------------------------

      doc.setFillColor(176, 0, 0);

      doc.rect(0, 0, 210, 12, "F");

      doc.setTextColor(255, 255, 255);

      doc.setFontSize(16);

      doc.setFont("helvetica", "bold");

      doc.text("SAGE LMS", 14, 8);

      doc.setTextColor(31, 41, 55);

      doc.setFontSize(20);

      doc.setFont("helvetica", "bold");

      doc.text("Analytics Report", 14, 25);

      doc.setFontSize(10);

      doc.setFont("helvetica", "normal");

      doc.setTextColor(107, 114, 128);

      doc.text(`Date Range: ${dateRange}`, 14, 32);

      doc.text(`Generated: ${formattedDate}`, 14, 38);

      // -----------------------------------------------------
      // MAIN STATISTICS
      // -----------------------------------------------------

      autoTable(doc, {
        startY: 46,

        head: [["Metric", "Value", "Change"]],

        body: [
          [
            "Total Enrollments",
            totalEnrollments.toLocaleString(),
            `${enrollmentChange >= 0 ? "+" : ""}${enrollmentChange}%`,
          ],
          [
            "Active Students",
            activeStudents.toLocaleString(),
            `${activeStudentChange >= 0 ? "+" : ""}${activeStudentChange}%`,
          ],
          ["Completion Rate", `${completionRate}%`, ""],
          ["Average Score", `${averageScore}%`, ""],
        ],

        theme: "grid",

        headStyles: {
          fillColor: [176, 0, 0],

          textColor: [255, 255, 255],

          fontStyle: "bold",
        },

        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
      });

      // -----------------------------------------------------
      // ENROLLMENT TRENDS
      // -----------------------------------------------------

      let currentY = doc.lastAutoTable.finalY + 12;

      doc.setFontSize(14);

      doc.setFont("helvetica", "bold");

      doc.setTextColor(31, 41, 55);

      doc.text("Enrollment Trends", 14, currentY);

      autoTable(doc, {
        startY: currentY + 5,

        head: [["Period", "Enrollments"]],

        body: currentEnrollmentData.map((item) => [item.label, item.value]),

        theme: "striped",

        headStyles: {
          fillColor: [30, 58, 138],

          textColor: [255, 255, 255],
        },

        styles: {
          fontSize: 9,
        },
      });

      // -----------------------------------------------------
      // COURSE PERFORMANCE
      // -----------------------------------------------------

      currentY = doc.lastAutoTable.finalY + 12;

      doc.setFontSize(14);

      doc.setFont("helvetica", "bold");

      doc.text("Course Performance", 14, currentY);

      autoTable(doc, {
        startY: currentY + 5,

        head: [["Course", "Students", "Completion", "Score", "Engagement"]],

        body: coursePerformance.map((course) => [
          course.name,
          course.students,
          `${course.completion}%`,
          `${course.averageScore}%`,
          `${course.engagement}%`,
        ]),

        theme: "grid",

        headStyles: {
          fillColor: [176, 0, 0],

          textColor: [255, 255, 255],
        },

        styles: {
          fontSize: 8,
          cellPadding: 2.5,
        },

        columnStyles: {
          0: {
            cellWidth: 65,
          },

          1: {
            cellWidth: 22,
          },

          2: {
            cellWidth: 25,
          },

          3: {
            cellWidth: 22,
          },

          4: {
            cellWidth: 25,
          },
        },
      });

      // -----------------------------------------------------
      // REVENUE
      // -----------------------------------------------------

      currentY = doc.lastAutoTable.finalY + 12;

      doc.setFontSize(14);

      doc.setFont("helvetica", "bold");

      doc.text("Revenue Overview", 14, currentY);

      autoTable(doc, {
        startY: currentY + 5,

        head: [["Period", "Revenue"]],

        body: revenueData.map((item) => [
          item.label,
          formatCurrency(item.value),
        ]),

        foot: [["Total Revenue", formatCurrency(totalRevenue)]],

        theme: "grid",

        headStyles: {
          fillColor: [30, 58, 138],

          textColor: [255, 255, 255],
        },

        footStyles: {
          fillColor: [243, 244, 246],

          textColor: [31, 41, 55],

          fontStyle: "bold",
        },

        styles: {
          fontSize: 9,
        },
      });

      // -----------------------------------------------------
      // LEARNING INSIGHTS
      // -----------------------------------------------------

      currentY = doc.lastAutoTable.finalY + 12;

      doc.setFontSize(14);

      doc.setFont("helvetica", "bold");

      doc.text("Learning Insights", 14, currentY);

      autoTable(doc, {
        startY: currentY + 5,

        head: [["Metric", "Value"]],

        body: [
          ["Average Learning Time", averageLearningTime],

          ["Course Completion", `${completionRate}%`],

          ["Certificates Issued", certificatesIssued],

          ["Assignment Submissions", assignmentSubmissions],

          [
            "Assignment Success",
            assignmentSuccess !== undefined
              ? `${assignmentSuccess}%`
              : "Not available",
          ],
        ],

        theme: "striped",

        headStyles: {
          fillColor: [176, 0, 0],

          textColor: [255, 255, 255],
        },

        styles: {
          fontSize: 9,
        },
      });

      // -----------------------------------------------------
      // FOOTER ON EVERY PAGE
      // -----------------------------------------------------

      const pageCount = doc.internal.getNumberOfPages();

      for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page);

        const pageHeight = doc.internal.pageSize.getHeight();

        doc.setFontSize(8);

        doc.setFont("helvetica", "normal");

        doc.setTextColor(156, 163, 175);

        doc.text(
          `SAGE LMS Analytics Report • Page ${page} of ${pageCount}`,
          14,
          pageHeight - 8,
        );
      }

      // -----------------------------------------------------
      // SAVE PDF
      // -----------------------------------------------------

      doc.save(`sage-lms-analytics-${fileDate}.pdf`);

      setExportOpen(false);

      toast.success("Analytics PDF exported successfully.");
    } catch (error) {
      console.error("PDF export failed:", error);

      toast.error("Unable to export PDF report.");
    }
  };

  // ---------------------------------------------------------
  // ACTIONS
  // ---------------------------------------------------------

  const handleDateChange = (event) => {
    setDateRange(event.target.value);
  };

  const handleRetry = () => {
    dispatch(fetchAnalytics(apiRange));
  };

  // ---------------------------------------------------------
  // STAT CARD
  // ---------------------------------------------------------

  const StatCard = ({
    title,
    value,
    change,
    description,
    icon: Icon,
    iconBg,
    iconColor,
    positive = true,
  }) => {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>

            <h3 className="mt-2 text-2xl font-bold text-gray-900">{value}</h3>
          </div>

          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}
          >
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>

        {change !== null && change !== undefined && change !== "" && (
          <div className="mt-4 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold ${
                positive ? "text-green-600" : "text-red-600"
              }`}
            >
              {positive ? (
                <ArrowUp className="h-3.5 w-3.5" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5" />
              )}

              {change}
            </span>

            <span className="text-xs text-gray-400">{description}</span>
          </div>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------
  // LOADING STATE
  // ---------------------------------------------------------

  if (status === "loading" && !analyticsData) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#B00000]">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>

              <p className="text-sm text-gray-500">
                Loading platform analytics...
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-2xl bg-gray-100"
            />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="h-96 animate-pulse rounded-2xl bg-gray-100 xl:col-span-2" />

          <div className="h-96 animate-pulse rounded-2xl bg-gray-100" />
        </div>

        <div className="h-80 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  // ---------------------------------------------------------
  // ERROR STATE
  // ---------------------------------------------------------

  if (status === "failed" && !analyticsData) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <BarChart3 className="h-7 w-7 text-[#B00000]" />
          </div>

          <h2 className="mt-5 text-lg font-bold text-gray-900">
            Unable to load analytics
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            {error || "Something went wrong while loading the analytics data."}
          </p>

          <button
            type="button"
            onClick={handleRetry}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#B00000] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#900000]"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // PAGE
  // ---------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#B00000]">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>

              <p className="text-sm text-gray-500">
                Monitor platform performance and learning activity.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {/* DATE RANGE */}

          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <select
              value={dateRange}
              onChange={handleDateChange}
              className="h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-sm font-medium text-gray-700 outline-none transition focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10 sm:w-44"
            >
              <option>Last 7 Days</option>

              <option>Last 30 Days</option>

              <option>Last 90 Days</option>

              <option>This Year</option>
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          {/* EXPORT */}

          <div ref={exportRef} className="relative">
            <button
              type="button"
              onClick={() => setExportOpen((prev) => !prev)}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#B00000] px-5 text-sm font-semibold text-white transition hover:bg-[#900000] sm:w-auto"
            >
              <Download className="h-4 w-4" />
              Export Report
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  exportOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {exportOpen && (
              <div className="absolute right-0 z-50 mt-2 w-full min-w-[230px] overflow-hidden rounded-xl border border-gray-200 bg-white p-2 shadow-xl sm:w-[250px]">
                <div className="px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Export Format
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Download the current analytics report.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={exportCSV}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-gray-50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
                    <FileText className="h-4 w-4 text-green-600" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Export as CSV
                    </p>

                    <p className="text-xs text-gray-500">
                      Simple spreadsheet data
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={exportExcel}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-gray-50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Export as Excel
                    </p>

                    <p className="text-xs text-gray-500">
                      Multi-sheet XLSX workbook
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={exportPDF}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-gray-50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
                    <FileText className="h-4 w-4 text-[#B00000]" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Export as PDF
                    </p>

                    <p className="text-xs text-gray-500">
                      Printable analytics report
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* REFRESHING INDICATOR */}

      {status === "loading" && analyticsData && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Updating analytics...
        </div>
      )}

      {/* MAIN STATS */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Enrollments"
          value={totalEnrollments.toLocaleString()}
          change={`${enrollmentChange >= 0 ? "+" : ""}${enrollmentChange}%`}
          description="vs previous period"
          icon={BookOpen}
          iconBg="bg-red-50"
          iconColor="text-[#B00000]"
          positive={enrollmentChange >= 0}
        />

        <StatCard
          title="Active Students"
          value={activeStudents.toLocaleString()}
          change={`${activeStudentChange >= 0 ? "+" : ""}${activeStudentChange}%`}
          description="vs previous period"
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-[#1E3A8A]"
          positive={activeStudentChange >= 0}
        />

        <StatCard
          title="Completion Rate"
          value={`${completionRate}%`}
          change={null}
          description=""
          icon={CheckCircle2}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />

        <StatCard
          title="Average Score"
          value={`${averageScore}%`}
          change={null}
          description=""
          icon={GraduationCap}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* ENROLLMENT + ACTIVITY */}

      <div className="grid gap-6 xl:grid-cols-3">
        {/* ENROLLMENT CHART */}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Enrollment Trends
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Student enrollments during the selected period.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
              <span className="h-2.5 w-2.5 rounded-full bg-[#B00000]" />
              Enrollments
            </div>
          </div>

          <div className="mt-8">
            {currentEnrollmentData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                No enrollment data available for this period.
              </div>
            ) : (
              <div className="flex h-64 items-end gap-2 overflow-x-auto sm:gap-4">
                {currentEnrollmentData.map((item) => {
                  const height =
                    maxEnrollment > 0
                      ? Math.max((item.value / maxEnrollment) * 100, 8)
                      : 8;

                  return (
                    <div
                      key={`${item.label}-${item.value}`}
                      className="flex min-w-[32px] flex-1 flex-col items-center justify-end gap-2"
                    >
                      <div className="group relative flex h-52 w-full items-end justify-center">
                        <div
                          className="w-full max-w-12 rounded-t-lg bg-[#B00000] transition-all duration-300 hover:bg-[#900000]"
                          style={{
                            height: `${height}%`,
                          }}
                        >
                          <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 rounded-lg bg-gray-900 px-2 py-1 text-xs font-semibold text-white group-hover:block">
                            {item.value}
                          </div>
                        </div>
                      </div>

                      <span className="whitespace-nowrap text-[10px] font-medium text-gray-400 sm:text-xs">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
            <div>
              <p className="text-xs text-gray-400">Period</p>

              <p className="mt-1 flex items-center gap-1 text-sm font-bold text-gray-900">
                <CalendarDays className="h-4 w-4" />
                {dateRange}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-gray-400">Peak enrollment</p>

              <p className="mt-1 text-sm font-bold text-gray-900">
                {maxEnrollment.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* STUDENT ACTIVITY */}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#B00000]" />

              <h2 className="text-lg font-bold text-gray-900">
                Student Activity
              </h2>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Current learning activity across the platform.
            </p>
          </div>

          <div className="mt-6 space-y-6">
            {activityData.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-gray-600">
                    {item.label}
                  </span>

                  <span className="text-sm font-bold text-gray-900">
                    {item.value.toLocaleString()}
                    {item.label !== "Active Students" && item.percentage > 0
                      ? "%"
                      : ""}
                  </span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-[#B00000] transition-all duration-500"
                    style={{
                      width: `${Math.min(100, item.percentage)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-500">Active students</p>

            <div className="mt-2 flex items-end justify-between gap-4">
              <p className="text-2xl font-bold text-gray-900">
                {activeStudents.toLocaleString()}
              </p>

              <span
                className={`flex items-center gap-1 text-xs font-semibold ${
                  activeStudentChange >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {activeStudentChange >= 0 ? (
                  <ArrowUp className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDown className="h-3.5 w-3.5" />
                )}
                {Math.abs(activeStudentChange)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* COURSE PERFORMANCE */}

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Course Performance
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Compare course completion, scores, and engagement.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">
            <Target className="h-4 w-4" />
            {totalCourseStudents.toLocaleString()} enrollments
          </div>
        </div>

        {coursePerformance.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            No course performance data available.
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-y border-gray-100 bg-gray-50/70">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Course
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Students
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Completion
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Avg. Score
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Engagement
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {coursePerformance.map((course) => (
                    <tr
                      key={course.id || course.name}
                      className="border-b border-gray-100 last:border-b-0"
                    >
                      <td className="px-5 py-4">
                        <p className="max-w-[280px] text-sm font-semibold text-gray-900">
                          {course.name}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-gray-600">
                        {course.students.toLocaleString()}
                      </td>

                      <td className="px-5 py-4">
                        <div className="w-36">
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="text-gray-400">Progress</span>

                            <span className="font-semibold text-gray-700">
                              {course.completion}%
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-green-500"
                              style={{
                                width: `${course.completion}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700">
                          {course.averageScore}%
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-[#B00000]"
                              style={{
                                width: `${course.engagement}%`,
                              }}
                            />
                          </div>

                          <span className="text-xs font-semibold text-gray-600">
                            {course.engagement}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}

            <div className="space-y-3 p-4 md:hidden">
              {coursePerformance.map((course) => (
                <div
                  key={course.id || course.name}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">
                        {course.name}
                      </h3>

                      <p className="mt-1 text-xs text-gray-500">
                        {course.students.toLocaleString()} students
                      </p>
                    </div>

                    <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                      {course.averageScore}%
                    </span>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-gray-500">Completion</span>

                        <span className="font-semibold text-gray-700">
                          {course.completion}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-green-500"
                          style={{
                            width: `${course.completion}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-gray-500">Engagement</span>

                        <span className="font-semibold text-gray-700">
                          {course.engagement}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-[#B00000]"
                          style={{
                            width: `${course.engagement}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* BOTTOM ANALYTICS */}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* REVENUE */}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Revenue Overview
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Successful payment revenue during the selected period.
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </div>

          <div className="mt-6">
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(totalRevenue)}
            </p>
          </div>

          <div className="mt-8">
            {revenueData.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-gray-400">
                No revenue data available.
              </div>
            ) : (
              <div className="flex h-48 items-end gap-2 sm:gap-4">
                {revenueData.map((item) => {
                  const height =
                    maxRevenue > 0
                      ? Math.max((item.value / maxRevenue) * 100, 10)
                      : 10;

                  return (
                    <div
                      key={`${item.label}-${item.value}`}
                      className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
                    >
                      <div className="relative flex h-full w-full items-end justify-center">
                        <div
                          className="w-full max-w-12 rounded-t-lg bg-[#1E3A8A] transition-all duration-300 hover:bg-[#162f70]"
                          style={{
                            height: `${height}%`,
                          }}
                        >
                          <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1 text-xs font-semibold text-white group-hover:block">
                            {formatCurrency(item.value)}
                          </div>
                        </div>
                      </div>

                      <span className="text-xs font-medium text-gray-400">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* LEARNING INSIGHTS */}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-[#B00000]" />

              <h2 className="text-lg font-bold text-gray-900">
                Learning Insights
              </h2>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Key indicators from student learning activity.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {/* LEARNING TIME */}

            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                  <Clock3 className="h-5 w-5 text-[#B00000]" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Avg. Learning Time
                  </p>

                  <p className="text-xs text-gray-500">Per active student</p>
                </div>
              </div>

              <span className="text-sm font-bold text-gray-900">
                {averageLearningTime}
              </span>
            </div>

            {/* COURSE COMPLETION */}

            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <CheckCircle2 className="h-5 w-5 text-[#1E3A8A]" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Course Completion
                  </p>

                  <p className="text-xs text-gray-500">
                    Students completing courses
                  </p>
                </div>
              </div>

              <span className="text-sm font-bold text-gray-900">
                {completionRate}%
              </span>
            </div>

            {/* CERTIFICATES */}

            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                  <GraduationCap className="h-5 w-5 text-green-600" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Certificates Issued
                  </p>

                  <p className="text-xs text-gray-500">
                    Successfully completed
                  </p>
                </div>
              </div>

              <span className="text-sm font-bold text-gray-900">
                {certificateCompletions.toLocaleString()}
              </span>
            </div>

            {/* ASSIGNMENTS */}

            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                  <Target className="h-5 w-5 text-purple-600" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Assignment Activity
                  </p>

                  <p className="text-xs text-gray-500">Total submissions</p>
                </div>
              </div>

              <span className="text-sm font-bold text-gray-900">
                {assignmentSubmissions.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SUMMARY BANNER */}

      <div className="rounded-2xl bg-[#1E3A8A] p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />

              <h2 className="text-lg font-bold">Platform Performance</h2>
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              Current platform performance based on students, courses,
              enrollments, learning progress, assignments, certificates, and
              successful payments recorded in SAGE LMS.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-white/10 px-4 py-3">
              <p className="text-xs text-blue-100">Students</p>

              <p className="mt-1 text-lg font-bold">
                {totalStudents.toLocaleString()}
              </p>
            </div>

            <div className="rounded-xl bg-white/10 px-4 py-3">
              <p className="text-xs text-blue-100">Courses</p>

              <p className="mt-1 text-lg font-bold">
                {totalCourses.toLocaleString()}
              </p>
            </div>

            <div className="rounded-xl bg-white/10 px-4 py-3">
              <p className="text-xs text-blue-100">Completion</p>

              <p className="mt-1 text-lg font-bold">{completionRate}%</p>
            </div>

            <div className="rounded-xl bg-white/10 px-4 py-3">
              <p className="text-xs text-blue-100">Score</p>

              <p className="mt-1 text-lg font-bold">{averageScore}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
