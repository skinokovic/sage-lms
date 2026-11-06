import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const waitForImages = (node) =>
  Promise.all(
    Array.from(node.querySelectorAll("img")).map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          }),
    ),
  );

const capture = async (node) => {
  if (document.fonts?.ready) await document.fonts.ready;
  await waitForImages(node);

  return html2canvas(node, {
    scale: 2,
    useCORS: true,
    // backgroundColor: "#F6F2E6",
    backgroundColor: "#FFFFFF",
  });
};

const safeName = (value) =>
  String(value || "certificate")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");

export const downloadCertificatePdf = async (node, title) => {
  const canvas = await capture(node);
  const image = canvas.toDataURL("image/jpeg", 0.95);

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [canvas.width / 2, canvas.height / 2],
  });

  pdf.addImage(image, "JPEG", 0, 0, canvas.width / 2, canvas.height / 2);
  pdf.save(`${safeName(title)}-SAGE-Certificate.pdf`);
};

export const downloadCertificateImage = async (node, title) => {
  const canvas = await capture(node);

  await new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeName(title)}-SAGE-Certificate.png`;
      link.click();
      URL.revokeObjectURL(url);
      resolve();
    }, "image/png");
  });
};
