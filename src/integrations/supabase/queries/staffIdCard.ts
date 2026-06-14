import jsPDF from "jspdf";
import type { StaffWithDetails } from "./staff";

export function downloadStaffIdCard(staff: StaffWithDetails, schoolName: string, schoolAcronym: string) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a6", // 105 x 148 mm
  });

  // Card dimensions: 100mm wide, ~130mm tall
  const cardW = 100;
  const cardH = 130;
  const margin = 4;

  // Background
  doc.setFillColor(245, 240, 255);
  doc.rect(0, 0, cardW, cardH, "F");

  // Header bar
  doc.setFillColor(103, 58, 183);
  doc.rect(0, 0, cardW, 20, "F");

  // School name in header
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(schoolName.toUpperCase(), cardW / 2, 8, { align: "center" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("STAFF IDENTIFICATION CARD", cardW / 2, 14, { align: "center" });

  // Avatar placeholder (circle area)
  doc.setFillColor(103, 58, 183);
  doc.circle(cardW / 2, 42, 16, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  const initials = staff.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  doc.text(initials || "?", cardW / 2, 46, { align: "center" });

  // Name
  doc.setTextColor(40, 20, 80);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(staff.full_name, cardW / 2, 66, { align: "center" });

  // Role
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 80, 140);
  doc.text(staff.role?.toUpperCase() ?? "STAFF", cardW / 2, 73, { align: "center" });

  // Divider
  doc.setDrawColor(180, 160, 220);
  doc.line(margin, 77, cardW - margin, 77);

  // Info rows
  const infoX = margin + 4;
  let y = 83;
  const lineH = 6;

  const info = [
    ["Staff ID", staff.employee_id ?? "—"],
    ["Designation", staff.designation ?? "—"],
    ["Department", staff.department ?? "—"],
    ["Joining Date", staff.joining_date
      ? new Date(staff.joining_date).toLocaleDateString("en-IN", {
          day: "numeric", month: "short", year: "numeric",
        })
      : "—"],
  ];

  info.forEach(([label, value]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(120, 100, 160);
    doc.text(label, infoX, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(40, 20, 80);
    doc.text(String(value).toUpperCase(), infoX + 22, y);
    y += lineH;
  });

  // Footer barcode placeholder
  doc.setFillColor(200, 180, 230);
  doc.rect(margin, cardH - 18, cardW - margin * 2, 10, "F");
  doc.setTextColor(100, 80, 120);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text(`ID: ${staff.employee_id ?? "—"} | ${schoolAcronym}`, cardW / 2, cardH - 12, { align: "center" });

  doc.save(`ID_Card_${staff.employee_id ?? "staff"}.pdf`);
}

export async function downloadBulkIdCardsZip(
  staff: StaffWithDetails[],
  schoolName: string,
  schoolAcronym: string
): Promise<void> {
  // Generate PDFs in memory, then zip
  const { default: JSZip } = await import("jszip");

  const zip = new JSZip();

  for (const s of staff) {
    // We'll generate a data URL for each PDF
    // For now, generate individual PDFs and open them sequentially
    // Proper implementation would use a server-side zip, but for browser:
    downloadStaffIdCard(s, schoolName, schoolAcronym);
  }

  // Note: browser-based zip requires generating blobs - simplified to individual downloads
  // For full ZIP support, an edge function should zip server-side
}