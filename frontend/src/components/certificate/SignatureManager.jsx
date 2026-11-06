import { useEffect, useRef, useState } from "react";
import { Eraser, Loader2, PenLine, Trash2, Upload } from "lucide-react";
import { toast } from "react-toastify";
import { signatureApi } from "../../api/signatureApi";

const CANVAS_W = 700;
const CANVAS_H = 220;

// Turns a photo/scan of a signature into a transparent PNG (white → clear)
const makeTransparent = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const ratio = Math.min(1, 800 / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data } = frame;

      for (let i = 0; i < data.length; i += 4) {
        const lightest = Math.min(data[i], data[i + 1], data[i + 2]);
        if (lightest > 235) data[i + 3] = 0;
        else if (lightest > 190)
          data[i + 3] = Math.round((255 * (235 - lightest)) / 45);
      }

      ctx.putImageData(frame, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("failed"))),
        "image/png",
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read that image"));
    };

    img.src = url;
  });

const SignatureManager = () => {
  const canvasRef = useRef(null);
  const fileRef = useRef(null);
  const drawing = useRef(false);

  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("draw");
  const [hasInk, setHasInk] = useState(false);
  const [uploadBlob, setUploadBlob] = useState(null);
  const [uploadPreview, setUploadPreview] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    signatureApi
      .get()
      .then(({ data }) => setCurrent(data.signature))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* ------------------------------ drawing ------------------------------ */

  const point = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDraw = (event) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    canvas.setPointerCapture?.(event.pointerId);

    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";

    const { x, y } = point(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.01, y + 0.01);
    ctx.stroke();

    drawing.current = true;
    setHasInk(true);
  };

  const moveDraw = (event) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = point(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => {
    drawing.current = false;
  };

  const clearPad = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
  };

  /* ------------------------------- upload ------------------------------- */

  const onFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return toast.error("Please choose an image file.");
    }

    try {
      const blob = await makeTransparent(file);
      setUploadBlob(blob);
      setUploadPreview(URL.createObjectURL(blob));
    } catch (error) {
      toast.error(error.message || "Couldn't process that image.");
    }
  };

  /* -------------------------------- save -------------------------------- */

  const upload = async (blob) => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("signature", blob, "signature.png");

      const { data } = await signatureApi.save(formData);
      setCurrent(data.signature);
      setUploadBlob(null);
      setUploadPreview("");
      if (mode === "draw") clearPad();
      toast.success("Signature saved.");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Couldn't save your signature.",
      );
    } finally {
      setSaving(false);
    }
  };

  const save = () => {
    if (mode === "upload") {
      if (uploadBlob) upload(uploadBlob);
      return;
    }

    canvasRef.current.toBlob((blob) => blob && upload(blob), "image/png");
  };

  const remove = async () => {
    setSaving(true);
    try {
      await signatureApi.remove();
      setCurrent(null);
      toast.success("Signature removed.");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Couldn't remove your signature.",
      );
    } finally {
      setSaving(false);
    }
  };

  const canSave = mode === "draw" ? hasInk : Boolean(uploadBlob);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1E3A8A]">
          <PenLine size={20} />
        </div>

        <div>
          <h2 className="font-bold text-gray-900">Certificate Signature</h2>
          <p className="mt-1 text-sm text-gray-500">
            Appears on certificates for your courses. Certificates already
            issued keep the signature they were issued with.
          </p>
        </div>
      </div>

      {/* Current signature */}
      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Current signature
        </p>

        {loading ? (
          <div className="mt-2 h-24 animate-pulse rounded-xl bg-gray-100" />
        ) : current ? (
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex h-24 items-center justify-center rounded-xl border border-gray-200 bg-white px-6">
              <img
                src={current.url}
                alt="Your signature"
                className="max-h-20 max-w-[240px] object-contain"
              />
            </div>

            <button
              type="button"
              onClick={remove}
              disabled={saving}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
            >
              <Trash2 size={16} />
              Remove
            </button>
          </div>
        ) : (
          <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
            You haven't added a signature yet. Student certificates for your
            courses will wait for it.
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-2">
        {[
          ["draw", "Draw"],
          ["upload", "Upload image"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={`cursor-pointer rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              mode === value
                ? "bg-[#1E3A8A] text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "draw" ? (
        <div className="mt-4">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            onPointerDown={startDraw}
            onPointerMove={moveDraw}
            onPointerUp={endDraw}
            onPointerLeave={endDraw}
            className="w-full cursor-crosshair rounded-xl border border-dashed border-gray-300 bg-gray-50"
            style={{
              touchAction: "none",
              aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
            }}
          />
          <p className="mt-2 text-xs text-gray-400">
            Sign inside the box using your mouse, finger or stylus.
          </p>

          <button
            type="button"
            onClick={clearPad}
            className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Eraser size={16} />
            Clear
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={onFile}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center transition hover:bg-gray-100"
          >
            <Upload size={26} className="text-[#1E3A8A]" />
            <span className="mt-2 text-sm font-medium text-gray-700">
              Choose a photo or scan of your signature
            </span>
            <span className="mt-1 text-xs text-gray-400">
              Sign on white paper. The white background is removed
              automatically.
            </span>
          </button>

          {uploadPreview && (
            <div className="mt-3 flex h-24 items-center justify-center rounded-xl border border-gray-200 bg-white">
              <img
                src={uploadPreview}
                alt="Signature preview"
                className="max-h-20 max-w-[240px] object-contain"
              />
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={save}
        disabled={!canSave || saving}
        className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#B00000] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving && <Loader2 size={17} className="animate-spin" />}
        Save signature
      </button>
    </div>
  );
};

export default SignatureManager;
