export interface ExportColumn {
  key: string;
  label: string;
}

export function exportCsv(data: Record<string, unknown>[], columns: ExportColumn[], filename: string): void {
  const header = columns.map((c) => `"${c.label}"`).join(",");
  const rows = data.map((row) =>
    columns.map((c) => {
      const val = row[c.key];
      if (val === null || val === undefined) return "";
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(",")
  );
  const bom = "\uFEFF";
  const csv = bom + header + "\n" + rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function printPage(title: string): void {
  const originalTitle = document.title;
  document.title = title;
  window.print();
  document.title = originalTitle;
}
