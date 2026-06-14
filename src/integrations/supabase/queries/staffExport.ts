import type { StaffWithDetails } from "./staff";

interface ExportColumn {
  key: string;
  label: string;
}

// Export staff to Excel
export async function exportStaffToExcel(
  staff: StaffWithDetails[],
  columns: ExportColumn[],
  schoolName: string
) {
  const XLSX = await import("xlsx");
  // Build data rows
  const data = staff.map((s) => {
    const row: Record<string, any> = {
      "Staff ID": s.employee_id ?? "",
      "Full Name": s.full_name,
      "Role": s.role,
      "Status": s.status,
      "Designation": s.designation ?? "",
      "Department": s.department ?? "",
      "Joining Date": s.joining_date ? new Date(s.joining_date).toLocaleDateString("en-IN") : "",
    };

    // Add dynamic columns
    columns.forEach((col) => {
      const value = (s as any)[col.key];
      row[col.label] = value ?? "";
    });

    return row;
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Style header row
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c: col })];
    if (cell) {
      cell.s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "E8E0F0" } },
      };
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, "Staff Directory");
  XLSX.writeFile(wb, `Staff_Directory_${new Date().toISOString().split("T")[0]}.xlsx`);
}

// Export staff to PDF
export async function exportStaffToPDF(
  staff: StaffWithDetails[],
  columns: ExportColumn[],
  schoolName: string
) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new jsPDF({
    orientation: columns.length > 8 ? "landscape" : "portrait",
  });

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(schoolName, 14, 15);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Staff Directory — ${new Date().toLocaleDateString("en-IN")}`, 14, 22);

  // Table headers
  const headers = [
    "Staff ID", "Full Name", "Role", "Status",
    ...columns.map((c) => c.label),
  ];

  const body = staff.map((s) => {
    const row = [
      s.employee_id ?? "",
      s.full_name,
      s.role,
      s.status,
    ];
    columns.forEach((col) => {
      const value = (s as any)[col.key];
      row.push(value ?? "");
    });
    return row;
  });

  autoTable(doc, {
    head: [headers],
    body,
    startY: 28,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [128, 90, 213], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 245, 255] },
  });

  doc.save(`Staff_Directory_${new Date().toISOString().split("T")[0]}.pdf`);
}