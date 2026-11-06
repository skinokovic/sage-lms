import { useState } from "react";
import { CheckCircle2, Clock, Loader2, Mail, MapPin, Phone } from "lucide-react";

import PublicPageLayout from "../components/PublicPageLayout";
import { publicApi } from "../api/publicApi";

/*
  TODO: fill in your real contact details. Any value left empty is hidden.
*/
const CONTACT_INFO = {
  email: "",
  phone: "",
  address: "",
  hours: "",
};

const EMPTY_FORM = { name: "", email: "", subject: "", message: "" };

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20";

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-primary">
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <div className="mt-0.5 break-words text-sm text-gray-600">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Contact() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");

  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === "sending") return;

    setStatus("sending");
    setError("");

    try {
      await publicApi.contact(form);
      setForm(EMPTY_FORM);
      setStatus("sent");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Your message wasn’t sent. Please check your details and try again.",
      );
      setStatus("error");
    }
  };

  const hasInfo = Object.values(CONTACT_INFO).some(Boolean);

  return (
    <PublicPageLayout
      eyebrow="Contact us"
      title="We’d love to hear from you"
      subtitle="Questions about a course, your account or working with us? Send a message and our team will get back to you."
    >
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14 lg:px-8 lg:py-16">
        {/* Details */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Get in touch
          </h2>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Use the form and we’ll reply to the email address you provide.
            Check our FAQs first, since your answer may already be there.
          </p>

          {hasInfo && (
            <div className="mt-8 space-y-6">
              {CONTACT_INFO.email && (
                <InfoRow icon={Mail} label="Email">
                  <a
                    href={`mailto:${CONTACT_INFO.email}`}
                    className="hover:text-primary"
                  >
                    {CONTACT_INFO.email}
                  </a>
                </InfoRow>
              )}
              {CONTACT_INFO.phone && (
                <InfoRow icon={Phone} label="Phone">
                  <a
                    href={`tel:${CONTACT_INFO.phone.replace(/\s/g, "")}`}
                    className="hover:text-primary"
                  >
                    {CONTACT_INFO.phone}
                  </a>
                </InfoRow>
              )}
              {CONTACT_INFO.address && (
                <InfoRow icon={MapPin} label="Address">
                  {CONTACT_INFO.address}
                </InfoRow>
              )}
              {CONTACT_INFO.hours && (
                <InfoRow icon={Clock} label="Working hours">
                  {CONTACT_INFO.hours}
                </InfoRow>
              )}
            </div>
          )}
        </div>

        {/* Form */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          {status === "sent" ? (
            <div className="py-8 text-center" role="status">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="mt-5 text-xl font-bold text-gray-900">
                Message sent
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
                Thanks for reaching out. We’ve received your message and will
                reply by email.
              </p>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="mt-6 cursor-pointer rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate={false} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Your name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    autoComplete="name"
                    value={form.name}
                    onChange={update("name")}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-email"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Email address
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    maxLength={254}
                    autoComplete="email"
                    value={form.email}
                    onChange={update("email")}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="contact-subject"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Subject <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  maxLength={150}
                  value={form.subject}
                  onChange={update("subject")}
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Message
                </label>
                <textarea
                  id="contact-message"
                  required
                  minLength={10}
                  maxLength={3000}
                  rows={6}
                  value={form.message}
                  onChange={update("message")}
                  className={`${inputClass} resize-y`}
                />
                <p className="mt-1 text-right text-xs text-gray-400">
                  {form.message.length}/3000
                </p>
              </div>

              {status === "error" && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {status === "sending" && (
                  <Loader2 size={16} className="animate-spin" />
                )}
                {status === "sending" ? "Sending…" : "Send message"}
              </button>
            </form>
          )}
        </div>
      </section>
    </PublicPageLayout>
  );
}
