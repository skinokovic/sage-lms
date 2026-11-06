import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ShieldCheck, UserRoundX } from "lucide-react";

const DataDeletion = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-2"
            aria-label="SAGE LMS Home"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary font-bold text-white">
              S
            </div>

            <div>
              <h1 className="text-lg font-bold text-gray-900">SAGE LMS</h1>
              <p className="text-xs text-gray-500">
                Learning Management System
              </p>
            </div>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-primary"
          >
            <ArrowLeft size={17} />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-linear-to-br from-[#B00000] to-[#7f0000] px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
            <UserRoundX size={32} />
          </div>

          <h2 className="text-3xl font-bold sm:text-4xl">
            Data Deletion Instructions
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-red-50 sm:text-base">
            This page explains how SAGE LMS users can request deletion of their
            personal information and account data.
          </p>

          <p className="mt-5 text-sm text-red-100">
            Last updated: October 2, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="mb-4 text-sm font-semibold text-gray-900">
                On this page
              </p>

              <nav className="space-y-3 text-sm">
                <a
                  href="#what-is-deleted"
                  className="block text-gray-600 hover:text-primary"
                >
                  What is deleted
                </a>

                <a
                  href="#how-to-request"
                  className="block text-gray-600 hover:text-primary"
                >
                  How to request deletion
                </a>

                <a
                  href="#verification"
                  className="block text-gray-600 hover:text-primary"
                >
                  Request verification
                </a>

                <a
                  href="#processing"
                  className="block text-gray-600 hover:text-primary"
                >
                  Processing your request
                </a>

                <a
                  href="#exceptions"
                  className="block text-gray-600 hover:text-primary"
                >
                  Legal exceptions
                </a>

                <a
                  href="#contact"
                  className="block text-gray-600 hover:text-primary"
                >
                  Contact
                </a>
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            {/* Introduction */}
            <div className="mb-10 rounded-lg border border-blue-100 bg-blue-50 p-5">
              <div className="flex gap-3">
                <ShieldCheck
                  className="mt-0.5 shrink-0 text-secondary"
                  size={22}
                />

                <div>
                  <h3 className="font-semibold text-gray-900">
                    Your data deletion request
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-700">
                    If you have an account with SAGE LMS and would like your
                    personal information and account deleted, you can submit a
                    deletion request using the process described below.
                  </p>
                </div>
              </div>
            </div>

            {/* What is deleted */}
            <section id="what-is-deleted" className="mb-10 scroll-mt-28">
              <h3 className="text-xl font-bold text-gray-900">
                1. What information may be deleted
              </h3>

              <p className="mt-4 text-sm leading-7 text-gray-600">
                Depending on your account and your relationship with SAGE LMS,
                deletion may include personal information associated with your
                account, such as:
              </p>

              <ul className="mt-4 space-y-3">
                {[
                  "Your name",
                  "Email address",
                  "Phone number, where provided",
                  "Profile information",
                  "Profile photograph or avatar",
                  "Account authentication information",
                  "User-generated profile information",
                  "Other personal information associated with your account",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm leading-6 text-gray-600"
                  >
                    <CheckCircle2
                      size={18}
                      className="mt-0.5 shrink-0 text-primary"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* How to request */}
            <section id="how-to-request" className="mb-10 scroll-mt-28">
              <h3 className="text-xl font-bold text-gray-900">
                2. How to request deletion
              </h3>

              <p className="mt-4 text-sm leading-7 text-gray-600">
                To request deletion of your SAGE LMS account and associated
                personal information, send a request to:
              </p>

              <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-5">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">Email:</span>{" "}
                  privacy@yourdomain.com
                </p>

                <p className="mt-2 text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">Subject:</span>{" "}
                  SAGE LMS Data Deletion Request
                </p>
              </div>

              <p className="mt-5 text-sm leading-7 text-gray-600">
                Please include the email address associated with your SAGE LMS
                account and clearly state that you are requesting deletion of
                your account and personal information.
              </p>
            </section>

            {/* Verification */}
            <section id="verification" className="mb-10 scroll-mt-28">
              <h3 className="text-xl font-bold text-gray-900">
                3. Verification of your request
              </h3>

              <p className="mt-4 text-sm leading-7 text-gray-600">
                To protect users against unauthorized account deletion, SAGE LMS
                may need to verify that the request was made by the account
                owner.
              </p>

              <p className="mt-4 text-sm leading-7 text-gray-600">
                Verification may include confirming information associated with
                your account or responding from the email address registered
                with SAGE LMS.
              </p>
            </section>

            {/* Processing */}
            <section id="processing" className="mb-10 scroll-mt-28">
              <h3 className="text-xl font-bold text-gray-900">
                4. Processing your deletion request
              </h3>

              <p className="mt-4 text-sm leading-7 text-gray-600">
                After your request has been verified, SAGE LMS will review and
                process the request in accordance with applicable data
                protection requirements and our Privacy Policy.
              </p>

              <p className="mt-4 text-sm leading-7 text-gray-600">
                Account information that is eligible for deletion will be
                removed or anonymized as appropriate.
              </p>

              <p className="mt-4 text-sm leading-7 text-gray-600">
                Some information may take additional time to be removed from
                backups, logs, or systems where immediate deletion is not
                technically practical.
              </p>
            </section>

            {/* Exceptions */}
            <section id="exceptions" className="mb-10 scroll-mt-28">
              <h3 className="text-xl font-bold text-gray-900">
                5. Information that may be retained
              </h3>

              <p className="mt-4 text-sm leading-7 text-gray-600">
                Certain information may be retained where necessary to comply
                with applicable law, resolve disputes, enforce agreements,
                maintain security, prevent fraud, or satisfy legitimate
                record-keeping requirements.
              </p>

              <p className="mt-4 text-sm leading-7 text-gray-600">
                Where information must be retained for one of these reasons, it
                will be handled in accordance with applicable privacy and data
                protection requirements.
              </p>
            </section>

            {/* Facebook / third-party section */}
            <section className="mb-10 scroll-mt-28">
              <h3 className="text-xl font-bold text-gray-900">
                6. Social login and third-party services
              </h3>

              <p className="mt-4 text-sm leading-7 text-gray-600">
                If you used a third-party authentication provider, such as a
                social login service, deleting your SAGE LMS account does not
                necessarily delete information held by that third-party
                provider.
              </p>

              <p className="mt-4 text-sm leading-7 text-gray-600">
                You may need to manage deletion or permissions directly with the
                applicable third-party service according to its own privacy and
                data deletion procedures.
              </p>
            </section>

            {/* Contact */}
            <section id="contact" className="scroll-mt-28">
              <h3 className="text-xl font-bold text-gray-900">7. Contact us</h3>

              <p className="mt-4 text-sm leading-7 text-gray-600">
                If you have questions about your data deletion request, please
                contact SAGE LMS:
              </p>

              <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-5">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">Email:</span>{" "}
                  privacy@yourdomain.com
                </p>

                <p className="mt-2 text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">Support:</span>{" "}
                  support@yourdomain.com
                </p>
              </div>
            </section>
          </article>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="font-semibold text-gray-900">SAGE LMS</p>

            <p className="mt-1 text-sm text-gray-500">
              Learning Management System
            </p>
          </div>

          <div className="flex flex-wrap gap-5 text-sm">
            <Link
              to="/privacy-policy"
              className="text-gray-600 hover:text-primary"
            >
              Privacy Policy
            </Link>

            <Link
              to="/terms-of-service"
              className="text-gray-600 hover:text-primary"
            >
              Terms of Service
            </Link>

            <Link to="/data-deletion" className="font-medium text-primary">
              Data Deletion
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DataDeletion;
