import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Loader2, Search, XCircle } from "lucide-react";
import crest from "../../assets/Group 15.png";
import { certificatesApi } from "../api/certificatesApi";

const VerifyCertificate = () => {
  const { code } = useParams();
  const navigate = useNavigate();

  const [input, setInput] = useState(code || "");
  const [loading, setLoading] = useState(Boolean(code));
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!code) return;

    let active = true;
    setLoading(true);
    setResult(null);
    setError("");

    certificatesApi
      .verify(code)
      .then(({ data }) => active && setResult(data.certificate))
      .catch(
        (err) =>
          active &&
          setError(
            err.response?.data?.message || "Certificate not found or invalid.",
          ),
      )
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [code]);

  const submit = (event) => {
    event.preventDefault();
    const value = input.trim();
    if (value) navigate(`/verify/${encodeURIComponent(value)}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <img src={crest} alt="SAGE" className="h-12 w-12 object-contain" />
          <div className="leading-tight">
            <p className="text-xl font-extrabold text-gray-900">SAGE</p>
            <p className="text-xs text-gray-500">
              School Of Business &amp; Management
            </p>
          </div>
        </div>

        <h1 className="mt-6 text-2xl font-bold text-gray-900">
          Verify a certificate
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter the certificate ID printed on the certificate.
        </p>

        <form onSubmit={submit} className="mt-5 flex gap-2">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="SAGE-2026-XXXXXXXXXX"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-3 text-sm outline-none focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            className="cursor-pointer rounded-xl bg-[#B00000] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
          >
            Verify
          </button>
        </form>

        {loading && (
          <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
            <Loader2 size={18} className="animate-spin" />
            Checking certificate…
          </div>
        )}

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-[#B00000]">
            <XCircle size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Invalid certificate</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 size={20} />
              <p className="font-semibold">This certificate is valid</p>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <Row label="Awarded to" value={result.studentName} />
              <Row label="Course" value={result.courseTitle} />
              <Row label="Instructor" value={result.instructorName} />
              <Row
                label="Issued"
                value={new Date(result.issuedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              />
              <Row label="Certificate ID" value={result.code} />
            </dl>
          </div>
        )}
      </div>
    </div>
  );
};

const Row = ({ label, value }) => (
  <div className="flex justify-between gap-4">
    <dt className="text-gray-500">{label}</dt>
    <dd className="text-right font-semibold text-gray-900">{value || "—"}</dd>
  </div>
);

export default VerifyCertificate;
