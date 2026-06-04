export type CsvValue = string | number | boolean | null | undefined;

export function csvCell(value: CsvValue) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export function downloadCsv(filename: string, rows: CsvValue[][]) {
  const content = rows.map((row) => row.map(csvCell).join(";")).join("\n");
  const blob = new Blob([`\uFEFF${content}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function addCsvSection(rows: CsvValue[][], title: string) {
  if (rows.length > 0) {
    rows.push([]);
  }

  rows.push([title]);
}
