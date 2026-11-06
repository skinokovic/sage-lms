import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Download,
  Image as ImageIcon,
  Link2,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import CertificateTemplate, {
  CERT_HEIGHT,
  CERT_WIDTH,
} from "./CertificateTemplate";
import {
  downloadCertificateImage,
  downloadCertificatePdf,
} from "../../utils/certificateExport";

const CertificateViewer = ({ certificate, autoDownload = false, onClose }) => {
  const previewRef = useRef(null);
  const exportRef = useRef(null);
  const autoRan = useRef(false);

  const [scale, setScale] = useState(1);
  const [busy, setBusy] = useState("");

  const verifyUrl = `${window.location.origin}/verify/${certificate.certificateCode}`;

  useEffect(() => {
    const element = previewRef.current;
    if (!element) return undefined;

    const update = () => setScale(element.clientWidth / CERT_WIDTH);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const runExport = async (kind) => {
    if (!certificate.signed || !exportRef.current || busy) return;

    setBusy(kind);
    try {
      if (kind === "pdf") {
        await downloadCertificatePdf(exportRef.current, certificate.title);
      } else {
        await downloadCertificateImage(exportRef.current, certificate.title);
      }
    } catch {
      toast.error("Couldn't create the certificate file. Please try again.");
    } finally {
      setBusy("");
    }
  };

  useEffect(() => {
    if (autoDownload && certificate.signed && !autoRan.current) {
      autoRan.current = true;
      const timer = setTimeout(() => runExport("pdf"), 500);
      return () => clearTimeout(timer);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyLink = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${certificate.title} certificate`,
          text: "Verify my SAGE certificate",
          url: verifyUrl,
        });
        return;
      }
      await navigator.clipboard.writeText(verifyUrl);
      toast.success("Verification link copied.");
    } catch {
      // user cancelled the share sheet
    }
  };

  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-pointer bg-black/60"
      />

      <div className="relative max-h-full w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#B00000]">
              Certificate of Completion
            </p>
            <h2 className="mt-1 text-lg font-bold text-gray-900">
              {certificate.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <X size={19} />
          </button>
        </div>

        {!certificate.signed && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            Awaiting your instructor's signature. You can download this
            certificate once it has been signed.
          </div>
        )}

        {/* Scaled preview */}
        <div
          ref={previewRef}
          className="w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm"
          style={{ height: CERT_HEIGHT * scale }}
        >
          <div
            style={{
              width: CERT_WIDTH,
              height: CERT_HEIGHT,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <CertificateTemplate certificate={certificate} />
          </div>
        </div>

        {/* Off-screen full-size copy used for the PDF / image export */}
        <div style={{ position: "fixed", left: -99999, top: 0 }}>
          <CertificateTemplate ref={exportRef} certificate={certificate} />
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => runExport("pdf")}
            disabled={!certificate.signed || Boolean(busy)}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#B00000] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "pdf" ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Download size={17} />
            )}
            Download PDF
          </button>

          <button
            type="button"
            onClick={() => runExport("image")}
            disabled={!certificate.signed || Boolean(busy)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "image" ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <ImageIcon size={17} />
            )}
            Download Image
          </button>

          <button
            type="button"
            onClick={copyLink}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <Link2 size={17} />
            Share Link
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificateViewer;
