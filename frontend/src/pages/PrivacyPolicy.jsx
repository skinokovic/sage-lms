import { Link } from "react-router-dom";
import {
  ShieldCheck,
  LockKeyhole,
  Database,
  UserCheck,
  Mail,
  ChevronRight,
  ArrowUp,
} from "lucide-react";
import PublicHeader from "../components/PublicHeader";

const PrivacyPolicy = () => {
  const lastUpdated = "October 2, 2026";

  const sections = [
    {
      id: "introduction",
      title: "1. Introduction",
    },
    {
      id: "information-we-collect",
      title: "2. Information We Collect",
    },
    {
      id: "how-we-use",
      title: "3. How We Use Your Information",
    },
    {
      id: "legal-basis",
      title: "4. Legal Basis for Processing",
    },
    {
      id: "sharing",
      title: "5. How We Share Information",
    },
    {
      id: "cookies",
      title: "6. Cookies and Similar Technologies",
    },
    {
      id: "retention",
      title: "7. Data Retention",
    },
    {
      id: "security",
      title: "8. Data Security",
    },
    {
      id: "rights",
      title: "9. Your Privacy Rights",
    },
    {
      id: "children",
      title: "10. Children and Learners",
    },
    {
      id: "transfers",
      title: "11. International Data Transfers",
    },
    {
      id: "third-party",
      title: "12. Third-Party Services",
    },
    {
      id: "changes",
      title: "13. Changes to This Policy",
    },
    {
      id: "contact",
      title: "14. Contact Us",
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
      <section className="bg-gradient-to-br from-[#1E3A8A] via-[#172f70] to-[#102354] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm mb-6">
              <ShieldCheck size={16} />
              Privacy & Data Protection
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Privacy Policy
            </h1>

            <p className="mt-5 text-blue-100 text-base sm:text-lg leading-8">
              This Privacy Policy explains how SAGE LMS collects, uses,
              protects, stores and manages personal information when you use our
              learning platform and related services.
            </p>

            <div className="mt-6 text-sm text-blue-200">
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
          {/* Table of contents */}
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
                    <span>{section.title}</span>
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Policy */}
          <article className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 sm:p-8 lg:p-10">
            {/* Introduction */}
            <section id="introduction" className="scroll-mt-24">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-red-50 flex items-center justify-center">
                  <ShieldCheck size={22} className="text-[#B00000]" />
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    1. Introduction
                  </h2>
                </div>
              </div>

              <div className="space-y-4 text-sm sm:text-base leading-7 text-gray-600">
                <p>
                  SAGE LMS ("SAGE", "we", "us" or "our") respects your privacy
                  and is committed to protecting your personal information.
                </p>

                <p>
                  This Privacy Policy applies to information collected through
                  the SAGE LMS website, applications, learning management
                  platform, student and instructor accounts, and related
                  services.
                </p>

                <p>
                  This policy is intended to explain our practices in relation
                  to the collection and processing of personal data and should
                  be read together with our Terms of Service.
                </p>
              </div>
            </section>

            <hr className="my-10 border-gray-200" />

            {/* Information */}
            <section id="information-we-collect" className="scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                2. Information We Collect
              </h2>

              <p className="text-sm sm:text-base leading-7 text-gray-600 mb-5">
                Depending on how you use SAGE LMS, we may collect the following
                categories of information:
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  {
                    title: "Account Information",
                    text: "Name, email address, phone number, account role and authentication information.",
                  },
                  {
                    title: "Learning Information",
                    text: "Courses enrolled in, course progress, grades, assignments, certificates and learning activity.",
                  },
                  {
                    title: "Profile Information",
                    text: "Profile photograph, biography and other information you choose to provide.",
                  },
                  {
                    title: "Technical Information",
                    text: "IP address, browser type, device information, operating system, logs and usage information.",
                  },
                  {
                    title: "Communication Information",
                    text: "Information you provide when contacting us or communicating through platform features.",
                  },
                  {
                    title: "Payment Information",
                    text: "Where applicable, transaction and payment-related information required to process purchases. Payment credentials may be handled by authorized payment providers.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border border-gray-200 p-5"
                  >
                    <h3 className="font-semibold text-gray-900">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <hr className="my-10 border-gray-200" />

            {/* How we use */}
            <section id="how-we-use" className="scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                3. How We Use Your Information
              </h2>

              <p className="text-sm sm:text-base leading-7 text-gray-600">
                We may use personal information to:
              </p>

              <ul className="mt-4 space-y-3 text-sm sm:text-base leading-7 text-gray-600 list-disc pl-6">
                <li>Create and manage user accounts.</li>
                <li>Provide access to courses and learning resources.</li>
                <li>Track learning progress and course completion.</li>
                <li>Process and manage assignments and assessments.</li>
                <li>Issue and verify certificates where applicable.</li>
                <li>Process payments and transactions where applicable.</li>
                <li>Provide customer support.</li>
                <li>Communicate important account and service information.</li>
                <li>Improve the performance and functionality of SAGE LMS.</li>
                <li>
                  Detect, prevent and investigate fraud, abuse and security
                  incidents.
                </li>
                <li>Meet applicable legal and regulatory obligations.</li>
              </ul>
            </section>

            <hr className="my-10 border-gray-200" />

            {/* Legal basis */}
            <section id="legal-basis" className="scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                4. Legal Basis for Processing
              </h2>

              <p className="text-sm sm:text-base leading-7 text-gray-600">
                Where applicable, we process personal data on a lawful basis
                recognized under Nigerian data protection law. Depending on the
                circumstances, this may include consent, performance of a
                contract, compliance with a legal obligation, protection of
                vital interests, or another lawful basis permitted by applicable
                law.
              </p>

              <p className="mt-4 text-sm sm:text-base leading-7 text-gray-600">
                Where processing is based on consent, you may withdraw that
                consent subject to applicable legal and contractual limitations.
              </p>
            </section>

            <hr className="my-10 border-gray-200" />

            {/* Sharing */}
            <section id="sharing" className="scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                5. How We Share Information
              </h2>

              <p className="text-sm sm:text-base leading-7 text-gray-600">
                We do not sell personal information as a business practice. We
                may disclose information where reasonably necessary to provide
                our services or meet legal obligations.
              </p>

              <ul className="mt-4 space-y-3 text-sm sm:text-base leading-7 text-gray-600 list-disc pl-6">
                <li>Authorized service providers and technology partners.</li>
                <li>Payment processors where transactions are supported.</li>
                <li>Cloud hosting and infrastructure providers.</li>
                <li>Professional advisers where appropriate.</li>
                <li>Government authorities where required by law.</li>
                <li>
                  Relevant parties in connection with fraud, security or legal
                  investigations.
                </li>
              </ul>

              <p className="mt-4 text-sm sm:text-base leading-7 text-gray-600">
                Third parties receiving personal information are expected to
                process it in accordance with applicable contractual, security
                and privacy requirements.
              </p>
            </section>

            <hr className="my-10 border-gray-200" />

            {/* Cookies */}
            <section id="cookies" className="scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                6. Cookies and Similar Technologies
              </h2>

              <p className="text-sm sm:text-base leading-7 text-gray-600">
                SAGE LMS may use cookies and similar technologies to maintain
                sessions, remember preferences, understand platform usage and
                improve security and performance.
              </p>

              <p className="mt-4 text-sm sm:text-base leading-7 text-gray-600">
                Where required, we will provide appropriate notice and choices
                concerning cookies and similar technologies.
              </p>
            </section>

            <hr className="my-10 border-gray-200" />

            {/* Retention */}
            <section id="retention" className="scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                7. Data Retention
              </h2>

              <p className="text-sm sm:text-base leading-7 text-gray-600">
                We retain personal information only for as long as reasonably
                necessary for the purposes for which it was collected, including
                providing services, maintaining academic records, resolving
                disputes, enforcing agreements and complying with applicable
                legal obligations.
              </p>

              <p className="mt-4 text-sm sm:text-base leading-7 text-gray-600">
                Retention periods may vary depending on the type of information
                and the purpose for which it is processed.
              </p>
            </section>

            <hr className="my-10 border-gray-200" />

            {/* Security */}
            <section id="security" className="scroll-mt-24">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-blue-50 flex items-center justify-center">
                  <LockKeyhole size={22} className="text-[#1E3A8A]" />
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  8. Data Security
                </h2>
              </div>

              <p className="text-sm sm:text-base leading-7 text-gray-600">
                We use reasonable technical and organizational measures designed
                to protect personal information against unauthorized access,
                loss, misuse, alteration or disclosure.
              </p>

              <p className="mt-4 text-sm sm:text-base leading-7 text-gray-600">
                These measures may include access controls, authentication
                mechanisms, encryption where appropriate, secure development
                practices, monitoring and administrative safeguards.
              </p>

              <p className="mt-4 text-sm sm:text-base leading-7 text-gray-600">
                However, no method of transmission or storage can be guaranteed
                to be completely secure.
              </p>
            </section>

            <hr className="my-10 border-gray-200" />

            {/* Rights */}
            <section id="rights" className="scroll-mt-24">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-green-50 flex items-center justify-center">
                  <UserCheck size={22} className="text-green-600" />
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  9. Your Privacy Rights
                </h2>
              </div>

              <p className="text-sm sm:text-base leading-7 text-gray-600">
                Subject to applicable law and any relevant limitations, you may
                have rights concerning your personal data, including rights to:
              </p>

              <ul className="mt-4 space-y-3 text-sm sm:text-base leading-7 text-gray-600 list-disc pl-6">
                <li>
                  Request access to personal information we hold about you.
                </li>
                <li>
                  Request correction of inaccurate or incomplete information.
                </li>
                <li>
                  Request deletion of personal information in appropriate
                  circumstances.
                </li>
                <li>Object to or request restriction of certain processing.</li>
                <li>Withdraw consent where processing is based on consent.</li>
                <li>
                  Request information concerning certain processing activities.
                </li>
              </ul>

              <p className="mt-4 text-sm sm:text-base leading-7 text-gray-600">
                Requests should be sent using the contact details provided
                below. We may need to verify your identity before responding.
              </p>
            </section>

            <hr className="my-10 border-gray-200" />

            {/* Children */}
            <section id="children" className="scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                10. Children and Learners
              </h2>

              <p className="text-sm sm:text-base leading-7 text-gray-600">
                SAGE LMS may be used in educational environments involving
                learners of different ages. Where the platform is used by
                children or other persons requiring parental or institutional
                authorization, the relevant parent, guardian, school or
                authorized institution is responsible for ensuring that
                appropriate authorization and supervision are in place where
                required by applicable law.
              </p>

              <p className="mt-4 text-sm sm:text-base leading-7 text-gray-600">
                We will handle learner information in accordance with applicable
                privacy and safeguarding requirements.
              </p>
            </section>

            <hr className="my-10 border-gray-200" />

            {/* Transfers */}
            <section id="transfers" className="scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                11. International Data Transfers
              </h2>

              <p className="text-sm sm:text-base leading-7 text-gray-600">
                Some service providers or infrastructure used to operate SAGE
                LMS may process information outside Nigeria. Where personal
                information is transferred across borders, we will take
                appropriate steps required by applicable data protection law.
              </p>
            </section>

            <hr className="my-10 border-gray-200" />

            {/* Third party */}
            <section id="third-party" className="scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                12. Third-Party Services
              </h2>

              <p className="text-sm sm:text-base leading-7 text-gray-600">
                SAGE LMS may contain links to or integrate with third-party
                services. Those services may have their own privacy policies and
                terms.
              </p>

              <p className="mt-4 text-sm sm:text-base leading-7 text-gray-600">
                We encourage users to review the privacy practices of
                third-party services before providing personal information to
                them.
              </p>
            </section>

            <hr className="my-10 border-gray-200" />

            {/* Changes */}
            <section id="changes" className="scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                13. Changes to This Policy
              </h2>

              <p className="text-sm sm:text-base leading-7 text-gray-600">
                We may update this Privacy Policy from time to time to reflect
                changes to our services, legal requirements, technology or
                privacy practices.
              </p>

              <p className="mt-4 text-sm sm:text-base leading-7 text-gray-600">
                When we make material changes, we may provide appropriate notice
                through the platform or other suitable communication channels.
              </p>
            </section>

            <hr className="my-10 border-gray-200" />

            {/* Contact */}
            <section id="contact" className="scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                14. Contact Us
              </h2>

              <p className="text-sm sm:text-base leading-7 text-gray-600">
                If you have questions about this Privacy Policy, wish to
                exercise a privacy right, or have a data protection concern,
                contact us:
              </p>

              <div className="mt-5 rounded-xl bg-gray-50 border border-gray-200 p-5">
                <div className="flex items-start gap-3">
                  <Mail size={20} className="text-[#B00000] mt-1" />

                  <div className="text-sm leading-6">
                    <p className="font-semibold text-gray-900">SAGE LMS</p>

                    <p className="text-gray-600">
                      Data Protection / Privacy Enquiries
                    </p>

                    <p className="text-gray-600">Email: privacy@sagelms.com</p>

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
                  SAGE<span className="text-[#ef4444]">LMS</span>
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
                <Link to="/privacy-policy" className="block text-white">
                  Privacy Policy
                </Link>

                <Link to="/terms-of-service" className="block hover:text-white">
                  Terms of Service
                </Link>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white">Contact</h3>

              <p className="mt-4 text-sm leading-6 text-gray-400">
                For support and privacy enquiries:
              </p>

              <a
                href="mailto:privacy@sagelms.com"
                className="mt-2 inline-block text-sm text-gray-300 hover:text-white"
              >
                privacy@sagelms.com
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

export default PrivacyPolicy;
