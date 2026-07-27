import * as XLSX from "xlsx";

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function downloadExcel(rows: Record<string, string>[], filename: string) {
  if (!rows || rows.length === 0) return;

  // Create a new workbook
  const wb = XLSX.utils.book_new();
  
  // Convert JSON to worksheet
  const ws = XLSX.utils.json_to_sheet(rows);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Donnees");
  
  // Ensure the filename ends with .xlsx
  const finalFilename = filename.endsWith(".xlsx") 
    ? filename 
    : filename.replace(/\.xls$/, "") + ".xlsx";

  // Generate Excel file and trigger download
  XLSX.writeFile(wb, finalFilename);
}

export function downloadCSV(rows: Record<string, string>[], filename: string) {
  if (!rows || rows.length === 0) return;

  const columns = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>())
  );

  const escapeCsvField = (field: string) => {
    if (field === null || field === undefined) return '""';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const csvRows = [];
  csvRows.push(columns.map(escapeCsvField).join(","));

  for (const row of rows) {
    csvRows.push(
      columns.map((column) => escapeCsvField(row[column] ?? "")).join(",")
    );
  }

  // BOM for Excel UTF-8 support
  const csvContent = "\\uFEFF" + csvRows.join("\\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
