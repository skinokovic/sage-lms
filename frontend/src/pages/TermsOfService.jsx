import { Link } from "react-router-dom";
import {
  FileText,
  ShieldCheck,
  UserCheck,
  BookOpen,
  CreditCard,
  AlertTriangle,
  Mail,
  ChevronRight,
  ArrowUp,
} from "lucide-react";
import PublicHeader from "../components/PublicHeader";

const TermsOfService = () => {
  const lastUpdated = "October 2, 2026";

  const sections = [
    {
      id: "acceptance",
      title: "1. Acceptance of Terms",
    },
    {
      id: "eligibility",
      title: "2. Eligibility and Accounts",
    },
    {
      id: "platform",
      title: "3. Use of the Platform",
    },
    {
      id: "courses",
      title: "4. Courses and Learning Content",
    },
    {
      id: "instructors",
      title: "5. Instructor Responsibilities",
    },
    {
      id: "assignments",
      title: "6. Assignments and Assessments",
    },
    {
      id: "payments",
      title: "7. Fees and Payments",
    },
    {
      id: "intellectual-property",
      title: "8. Intellectual Property",
    },
    {
      id: "user-content",
      title: "9. User Content",
    },
    {
      id: "prohibited",
      title: "10. Prohibited Activities",
    },
    {
      id: "suspension",
      title: "11. Suspension and Termination",
    },
    {
      id: "availability",
      title: "12. Platform Availability",
    },
    {
      id: "disclaimer",
      title: "13. Disclaimer",
    },
    {
      id: "liability",
      title: "14. Limitation of Liability",
    },
    {
      id: "changes",
      title: "15. Changes to These Terms",
    },
    {
      id: "law",
      title: "16. Governing Law",
    },
    {
      id: "contact",
      title: "17. Contact Us",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* =========================
          HEADER
      ========================== */}
      <PublicHeader />

      {/* =========================
          HERO
      ========================== */}
      <section className="bg-gradient-to-br from-[#B00000] via-[#8f0000] to-[#5f0000] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm mb-6">
              <FileText size={16} />
              Legal Terms
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Terms of Service
            </h1>

            <p className="mt-5 text-red-100 text-base sm:text-lg leading-8">
              These Terms of Service govern your access to and use of the SAGE
              LMS platform, courses, learning resources and related services.
            </p>

            <div className="mt-6 text-sm text-red-200">
              Last Updated: {lastUpdated}
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          CONTENT
      ========================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10">
          {/* TOC */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4">On this page</h2>

              <nav className="space-y-1.5">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-[#B00000] hover:bg-red-50 transition"
                  >
                    <ChevronRight size={14} />
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Terms */}
          <article className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 sm:p-8 lg:p-10">
            {/* Acceptance */}
            <section id="acceptance" className="scroll-mt-24">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-red-50 flex items-center justify-center">
                  <FileText size={22} className="text-[#B00000]" />
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  1. Acceptance of Terms
                </h2>
              </div>

              <p className="text-sm sm:text-base leading-7 text-gray-600">
                By accessing or using SAGE LMS ("SAGE", "we", "us" or "our"),
                you agree to be bound by these Terms of Service and our Privacy
                Policy.
              </p>

              <p className="mt-4 text-sm sm:text-base leading-7 text-gray-600">
                If you do not agree with these Terms, you should not access or
                use the platform.
              </p>
            </section>

            <hr className="my-10 border-gray-200" />

            {/* Eligibility */}
            <section id="eligibility" className="scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                2. Eligibility and Accounts
              </h2>

              <p className="text-sm sm:text-base leading-7 text-gray-600">
                You must provide accurate and reasonably complete information
                when creating or using an account.
              </p>

              <ul className="mt-4 space-y-3 text-sm sm:text-base leading-7 text-gray-600 list-disc pl-6">
                <li>
                  You are responsible for maintaining the confidentiality of
                  your login credentials.
                </li>

                <li>You must not knowingly provide false information.</li>

                <li>
                  You must promptly notify us if you suspect unauthorized access
                  to your account.
                </li>

                <li>
                  Accounts may be subject to institutional, school or
                  administrator controls.
                </li>
              </ul>
            </section>

            <hr className="my-10 border-gray-200" />

            {/* Platform */}
            <section id="platform" className="scroll-mt-24">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-blue-50 flex items-center justify-center">
                  <BookOpen size={22} className="text-[#1E3A8A]" />
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  3. Use of the Platform
                </h2>
              </div>

              <p className="text-sm sm:text-base leading-7 text-gray-600">
                SAGE provides tools for online education, course management,
                learning activities, assessments, communication and related
                educational services.
              </p>

              <p className="mt-4 text-sm sm:text-base leading-7 text-gray-600">
                You agree to use the platform only for lawful educational and
                legitimate purposes.
              </p>
            </section>

            <hr className="my-10 border-gray-200" />

            {/* Courses */}
            <section id="courses" className="scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                4. Courses and Learning Content
              </h2>

              <p className="text-sm sm:text-base leading-7 text-gray-600">
                Courses, lessons, videos, documents, assessments and other
                educational resources available through SAGE may be provided by
                SAGE, instructors, institutions or other authorized content
                providers.
              </p>

              <p className="mt-4 text-sm sm:text-base leading-7 text-gray-600">
                Access to particular courses or resources may be subject to
                enrollment requirements, payment, institutional authorization or
                other conditions.
              </p>
            </section>

            <hr className="my-10 border-gray-200" />

            {/* Instructors */}
            <section id="instructors" className="scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                5. Instructor Responsibilities
              </h2>

              <p className="text-sm sm:text-base leading-7 text-gray-600">
                Instructors and authorized content creators are responsible for
                ensuring that content they upload or publish is accurate to the
                best of their knowledge, appropriate for the intended learners
                and lawful.
              </p>

              <p className="mt-4 text-sm sm:text-base leading-7 text-gray-600">
                Instructors must not upload content that infringes third-party
                rights or violates applicable law or institutional policies.
              </p>
            </section>

            <hr className="my-10 border-gray-200" />

            {/* Assignments */}
            <section id="assignments" className="scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                6. Assignments and Assessments
              </h2>

              <p className="text-sm sm:text-base leading-7 text-gray-600">
                Assignments, examinations, assessments, grades and completion
                requirements may be established by instructors or authorized
                institutions.
              </p>

              <p className="mt-4 text-sm sm:text-base leading-7 text-gray-600">
                Users must submit their own work unless collaboration is
                expressly permitted by the relevant course or instructor.
              </p>
            </section>

            <hr className="my-10 border-gray-200" />

            {/* Payments */}
            <section id="payments" className="scroll-mt-24">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-green-50 flex items-center justify-center">
                  <CreditCard size={22} className="text-green-600" />
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  7. Fees and Payments
                </h2>
              </div>

              <p className="text-sm sm:text-base leading-7 text-gray-600">
                Where courses or services require payment, applicable prices and
                payment terms will be presented before purchase.
              </p>

              <p className="mt-4 text-sm sm:text-base leading-7 text-gray-600">
                Payments may be processed through authorized third-party payment
                providers. Additional payment-provider terms may apply.
              </p>

              <p className="mt-4 text-sm sm:text-base leading-7 text-gray-600">
                Refunds, cancellations and payment disputes will be handled
                according to the applicable purchase or institutional terms
                communicated at the time of transaction.
              </p>
            </section>

            <hr className="my-10 border-gray-200" />

            {/* IP */}
            <section id="intellectual-property" className="scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                8. Intellectual Property
              </h2>

              <p className="text-sm sm:text-base leading-7 text-gray-600">
                Unless otherwise stated, SAGE and its licensors retain rights in
                the platform, software, branding, designs, interfaces,
                documentation and original materials provided by SAGE.
              </p>

              <p className="mt-4 text-sm sm:text-base leading-7 text-gray-600">
                You may not reproduce, distribute, modify, sell, publicly
                display or commercially exploit SAGE-owned materials without
                appropriate authorization.
              </p>
            </section>

            <hr className="my-10 border-gray-200" />

            {/* User content */}
            <section id="user-content" className="scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                9. User Content
              </h2>

              <p className="text-sm sm:text-base leading-7 text-gray-600">
                Users may submit information, assignments, comments, profile
                information, documents or other content through the platform.
              </p>

              <p className="mt-4 text-sm sm:text-base leading-7 text-gray-600">
                You retain rights you have in your content, subject to the
                rights and permissions necessary for SAGE to operate the
                platform and provide the relevant services.
              </p>

              <p className="mt-4 text-sm sm:text-base leading-7 text-gray-600">
                You are responsible for ensuring that content you submit does
                not violate applicable law or third-party rights.
              </p>
            </section>

            <hr className="my-10 border-gray-200" />

            {/* Prohibited */}
            <section id="prohibited" className="scroll-mt-24">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-amber-50 flex items-center justify-center">
                  <AlertTriangle size={22} className="text-amber-600" />
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  10. Prohibited Activities
                </h2>
              </div>

              <p className="text-sm sm:text-base leading-7 text-gray-600">
                You must not use SAGE LMS to:
              </p>

              <ul className="mt-4 space-y-3 text-sm sm:text-base leading-7 text-gray-600 list-disc pl-6">
                <li>Break or attempt to break applicable laws.</li>
                <li>Access another user's account without authorization.</li>
                <li>
                  Interfere with the operation or security of the platform.
                </li>
                <li>Upload malicious software or harmful code.</li>
                <li>Attempt to gain unauthorized access to systems or data.</li>
                <li>Infringe intellectual property or privacy rights.</li>
                <li>
                  Submit fraudulent or intentionally misleading information.
                </li>
                <li>
                  Use the platform for unauthorized commercial activities.
                </li>
                <li>Harass, threaten or abuse other users.</li>
              </ul>
            </section>

            <hr className="my-10 border-gray-200" />

            {/* Suspension */}
            <section id="suspension" className="scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                11. Suspension and Termination
              </h2>

              <p className="text-sm sm:text-base leading-7 text-gray-600">
                We may suspend or terminate access to an account where
                reasonably necessary to protect the platform, its users, our
                services or to comply with applicable law or contractual
                obligations.
              </p>

              <p className="mt-4 text-sm sm:text-base leading-7 text-gray-600">
                Where appropriate, we may provide notice and an opportunity to
                address the relevant issue, subject to security, legal or
                operational requirements.
              </p>
            </section>

            <hr className="my-10 border-gray-200" />

            {/* Availability */}
            <section id="availability" className="scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                12. Platform Availability
              </h2>

              <p className="text-sm sm:text-base leading-7 text-gray-600">
                We aim to keep SAGE LMS reliable and accessible, but
                uninterrupted availability cannot be guaranteed.
              </p>

              <p className="mt-4 text-sm sm:text-base leading-7 text-gray-600">
                The platform may occasionally be unavailable because of
                maintenance, upgrades, technical problems, security incidents,
                infrastructure failures or circumstances outside our reasonable
                control.
              </p>
            </section>

            <hr className="my-10 border-gray-200" />

            {/* Disclaimer */}
            <section id="disclaimer" className="scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                13. Disclaimer
              </h2>

              <p className="text-sm sm:text-base leading-7 text-gray-600">
                SAGE LMS is provided for educational and learning-management
                purposes. We do not guarantee that all course content will be
                complete, current, error-free or suitable for every particular
                purpose.
              </p>

              <p className="mt-4 text-sm sm:text-base leading-7 text-gray-600">
                Educational content should not automatically be treated as
                professional, legal, medical, financial or other specialist
                advice.
              </p>
            </section>

            <hr className="my-10 border-gray-200" />

            {/* Liability */}
            <section id="liability" className="scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                14. Limitation of Liability
              </h2>

              <p className="text-sm sm:text-base leading-7 text-gray-600">
                To the extent permitted by applicable law, SAGE and its
                authorized personnel will not be responsible for indirect,
                incidental, special or consequential losses arising from use of
                the platform.
              </p>

              <p className="mt-4 text-sm sm:text-base leading-7 text-gray-600">
                Nothing in these Terms is intended to exclude or limit liability
                that cannot lawfully be excluded or limited under applicable
                law.
              </p>
            </section>

            <hr className="my-10 border-gray-200" />

            {/* Changes */}
            <section id="changes" className="scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                15. Changes to These Terms
              </h2>

              <p className="text-sm sm:text-base leading-7 text-gray-600">
                We may update these Terms from time to time to reflect changes
                to our services, business practices or applicable legal
                requirements.
              </p>

              <p className="mt-4 text-sm sm:text-base leading-7 text-gray-600">
                Updated Terms will be published on the platform and will
                identify the applicable effective or updated date.
              </p>
            </section>

            <hr className="my-10 border-gray-200" />

            {/* Law */}
            <section id="law" className="scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                16. Governing Law
              </h2>

              <p className="text-sm sm:text-base leading-7 text-gray-600">
                These Terms shall be interpreted in accordance with the laws
                applicable in the Federal Republic of Nigeria, subject to any
                mandatory legal rights and requirements that apply to the
                relevant user or transaction.
              </p>
            </section>

            <hr className="my-10 border-gray-200" />

            {/* Contact */}
            <section id="contact" className="scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                17. Contact Us
              </h2>

              <p className="text-sm sm:text-base leading-7 text-gray-600">
                If you have questions about these Terms or need assistance
                concerning your account, contact:
              </p>

              <div className="mt-5 rounded-xl bg-gray-50 border border-gray-200 p-5">
                <div className="flex items-start gap-3">
                  <Mail size={20} className="text-[#B00000] mt-1" />

                  <div className="text-sm leading-6">
                    <p className="font-semibold text-gray-900">SAGE LMS</p>

                    <p className="text-gray-600">Legal / Support Enquiries</p>

                    <p className="text-gray-600">Email: support@sagelms.com</p>

                    <p className="text-gray-600">
                      Address: Lagos State, Nigeria
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-10 pt-6 border-t border-gray-200">
              <a
                href="#top"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#B00000] hover:underline"
              >
                <ArrowUp size={16} />
                Back to top
              </a>
            </div>
          </article>
        </div>
      </main>

      {/* =========================
          FOOTER
      ========================== */}
      <footer className="bg-[#111827] text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <Link to="/" className="inline-flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-[#B00000] flex items-center justify-center">
                  <span className="text-white font-bold">S</span>
                </div>

                <span className="text-xl font-bold text-white">
                  SAGE
                  <span className="text-[#ef4444]">LMS</span>
                </span>
              </Link>

              <p className="mt-4 text-sm leading-6 text-gray-400">
                A modern learning platform designed to connect learners,
                instructors and educational communities.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white">Platform</h3>

              <div className="mt-4 space-y-3 text-sm">
                <Link to="/" className="block hover:text-white">
                  Home
                </Link>

                <Link to="/courses" className="block hover:text-white">
                  Courses
                </Link>

                <Link to="/create-account" className="block hover:text-white">
                  Create Account
                </Link>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white">Legal</h3>

              <div className="mt-4 space-y-3 text-sm">
                <Link to="/privacy-policy" className="block hover:text-white">
                  Privacy Policy
                </Link>

                <Link to="/terms-of-service" className="block text-white">
                  Terms of Service
                </Link>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white">Contact</h3>

              <p className="mt-4 text-sm leading-6 text-gray-400">
                For support and legal enquiries:
              </p>

              <a
                href="mailto:support@sagelms.com"
                className="mt-2 inline-block text-sm text-gray-300 hover:text-white"
              >
                support@sagelmscom
              </a>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row justify-between gap-3 text-xs text-gray-500">
            <p>© {new Date().getFullYear()} SAGE LMS. All rights reserved.</p>

            <p>Nigeria</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsOfService;
