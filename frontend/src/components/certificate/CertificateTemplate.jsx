import { forwardRef } from "react";
import crest from "../../../assets/Group 15.png";

export const CERT_WIDTH = 1080;
export const CERT_HEIGHT = 734;

const NAVY = "#1E3A8A";
const RED = "#B00000";
const SERIF = '"Playfair Display", "Times New Roman", Georgia, serif';
const SANS = '"Poppins", "Segoe UI", system-ui, sans-serif';

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

const Seal = () => {
  const bumps = Array.from({ length: 28 }, (_, i) => {
    const angle = (i / 28) * Math.PI * 2;
    return { x: 65 + Math.cos(angle) * 55, y: 65 + Math.sin(angle) * 55 };
  });

  return (
    <svg width="130" height="130" viewBox="0 0 130 130">
      {bumps.map((bump, i) => (
        <circle key={i} cx={bump.x} cy={bump.y} r="8" fill={NAVY} />
      ))}
      <circle cx="65" cy="65" r="56" fill={NAVY} />
      <circle cx="65" cy="65" r="47" fill="none" stroke={RED} strokeWidth="3" />
      <circle
        cx="65"
        cy="65"
        r="41"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1"
        opacity="0.6"
      />
      <text
        x="65"
        y="42"
        textAnchor="middle"
        fontFamily={SANS}
        fontSize="9"
        fill="#FFFFFF"
      >
        ★ ★ ★
      </text>
      <text
        x="65"
        y="68"
        textAnchor="middle"
        fontFamily={SERIF}
        fontWeight="700"
        fontSize="26"
        fill="#FFFFFF"
      >
        SAGE
      </text>
      <text
        x="65"
        y="84"
        textAnchor="middle"
        fontFamily={SANS}
        fontWeight="600"
        fontSize="9"
        letterSpacing="2"
        fill="#FFFFFF"
      >
        CERTIFIED
      </text>
      <text
        x="65"
        y="100"
        textAnchor="middle"
        fontFamily={SANS}
        fontSize="9"
        fill="#FFFFFF"
      >
        ★ ★ ★
      </text>
    </svg>
  );
};

const diamond = (cx, cy, r = 7) =>
  `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;

const full = {
  position: "absolute",
  left: 0,
  width: CERT_WIDTH,
  textAlign: "center",
};

const CertificateTemplate = forwardRef(function CertificateTemplate(
  { certificate },
  ref,
) {
  const studentName = (certificate.studentName || "").toUpperCase();
  const courseTitle = (certificate.title || "").toUpperCase();
  const instructor = certificate.instructor || "";

  const nameSize =
    studentName.length > 34 ? 32 : studentName.length > 26 ? 40 : 48;
  const courseSize =
    courseTitle.length > 52 ? 19 : courseTitle.length > 38 ? 23 : 27;
  const instructorSize = instructor.length > 24 ? 16 : 20;

  const verifyHost = `${window.location.host}/verify`;

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        width: CERT_WIDTH,
        height: CERT_HEIGHT,
        overflow: "hidden",
        background: "#FFFFFF",
        color: "#111827",
        fontFamily: SANS,
      }}
    >
      {/* Faint crest watermark */}
      <img
        src={crest}
        alt=""
        style={{
          position: "absolute",
          left: 360,
          top: 187,
          width: 360,
          height: 360,
          objectFit: "contain",
          opacity: 0.05,
        }}
      />

      {/* Frame */}
      <div
        style={{
          position: "absolute",
          left: 20,
          top: 20,
          width: 1040,
          height: 694,
          boxSizing: "border-box",
          border: `3px solid ${NAVY}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 34,
          top: 34,
          width: 1012,
          height: 666,
          boxSizing: "border-box",
          border: `1px solid ${RED}`,
        }}
      />

      {/* Corner brackets + diamonds */}
      <svg
        width={CERT_WIDTH}
        height={CERT_HEIGHT}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        <g stroke={NAVY} strokeWidth="8" fill="none" strokeLinecap="square">
          <path d="M24 96 V24 H96" />
          <path d="M984 24 H1056 V96" />
          <path d="M1056 638 V710 H984" />
          <path d="M96 710 H24 V638" />
        </g>
        <g fill={RED}>
          <polygon points={diamond(52, 52)} />
          <polygon points={diamond(1028, 52)} />
          <polygon points={diamond(1028, 682)} />
          <polygon points={diamond(52, 682)} />
        </g>
      </svg>

      {/* Logo */}
      <div
        style={{
          ...full,
          top: 58,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <img src={crest} alt="" style={{ width: 52, height: 52 }} />
        <div style={{ textAlign: "left", lineHeight: 1.1 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: NAVY }}>SAGE</div>
          <div style={{ fontSize: 11, fontWeight: 500, color: "#4B5563" }}>
            School Of Business &amp; Management
          </div>
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          ...full,
          top: 128,
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: 46,
          lineHeight: "54px",
          letterSpacing: 1,
          color: NAVY,
          whiteSpace: "nowrap",
        }}
      >
        CERTIFICATE OF COMPLETION
      </div>

      <div
        style={{
          position: "absolute",
          left: 495,
          top: 190,
          width: 90,
          height: 4,
          background: RED,
        }}
      />

      <div
        style={{
          ...full,
          top: 212,
          fontWeight: 600,
          fontSize: 14,
          letterSpacing: 3,
          color: "#6B7280",
        }}
      >
        THIS CERTIFICATE IS PROUDLY PRESENTED TO
      </div>

      {/* Student name */}
      <div
        style={{
          ...full,
          top: 244,
          height: 76,
          lineHeight: "76px",
          fontFamily: SERIF,
          fontWeight: 500,
          fontSize: nameSize,
          color: "#111827",
          whiteSpace: "nowrap",
        }}
      >
        {studentName}
      </div>

      <div
        style={{
          position: "absolute",
          left: 240,
          top: 328,
          width: 600,
          height: 1,
          background: "#CBD5E1",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 510,
          top: 327,
          width: 60,
          height: 3,
          background: RED,
        }}
      />

      <div
        style={{
          ...full,
          top: 346,
          fontWeight: 500,
          fontSize: 20,
          color: "#4B5563",
        }}
      >
        has successfully completed the course
      </div>

      <div
        style={{
          ...full,
          top: 382,
          fontWeight: 700,
          fontSize: courseSize,
          letterSpacing: 1,
          color: RED,
          whiteSpace: "nowrap",
        }}
      >
        {courseTitle}
      </div>

      {/* Date */}
      <div
        style={{
          position: "absolute",
          left: 150,
          top: 504,
          width: 250,
          textAlign: "center",
          fontSize: 23,
          fontWeight: 500,
          color: "#111827",
        }}
      >
        {formatDate(certificate.issueDate)}
      </div>
      <div
        style={{
          position: "absolute",
          left: 165,
          top: 546,
          width: 220,
          height: 1,
          background: NAVY,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 165,
          top: 556,
          width: 220,
          textAlign: "center",
          fontWeight: 600,
          fontSize: 17,
          color: "#4B5563",
        }}
      >
        Date
      </div>

      {/* Seal */}
      <div style={{ position: "absolute", left: 475, top: 468 }}>
        <Seal />
      </div>

      {/* Instructor signature */}
      <div
        style={{
          position: "absolute",
          left: 690,
          top: 448,
          width: 220,
          height: 96,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        {certificate.signatureUrl && (
          <img
            src={certificate.signatureUrl}
            alt="Instructor signature"
            crossOrigin="anonymous"
            style={{ maxWidth: 215, maxHeight: 92, objectFit: "contain" }}
          />
        )}
      </div>
      <div
        style={{
          position: "absolute",
          left: 690,
          top: 546,
          width: 220,
          height: 1,
          background: NAVY,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 690,
          top: 556,
          width: 220,
          textAlign: "center",
          fontWeight: 600,
          fontSize: 17,
          color: "#4B5563",
        }}
      >
        Instructor
      </div>
      <div
        style={{
          position: "absolute",
          left: 660,
          top: 582,
          width: 280,
          textAlign: "center",
          fontWeight: 700,
          fontSize: instructorSize,
          color: NAVY,
          whiteSpace: "nowrap",
        }}
      >
        {instructor}
      </div>

      {/* Certificate ID + verification */}
      <div
        style={{
          ...full,
          top: 650,
          fontSize: 14,
          color: "#6B7280",
          whiteSpace: "nowrap",
        }}
      >
        Certificate ID:{" "}
        <strong style={{ color: "#111827" }}>
          {certificate.certificateCode}
        </strong>
        <span style={{ margin: "0 12px", color: RED }}>|</span>
        Verify at <strong style={{ color: NAVY }}>{verifyHost}</strong>
      </div>
    </div>
  );
});

export default CertificateTemplate;
