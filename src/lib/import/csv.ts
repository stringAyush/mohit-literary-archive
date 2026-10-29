// A small CSV reader (RFC 4180): commas separate fields, double quotes wrap fields
// that contain commas, quotes or line breaks, and "" inside quotes means one quote.
// Poems keep their line breaks when the text column is quoted.

export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, ""); // drop a byte-order mark from Excel
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"' && field === "") {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (inQuotes) throw new Error("The CSV file has a quoted field that is never closed.");
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // Ignore completely empty lines.
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/** Turns CSV rows into objects using the header row as keys. */
export function csvToRecords(input: string): Record<string, string>[] {
  const rows = parseCsv(input);
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((cells) => {
    const record: Record<string, string> = {};
    header.forEach((key, index) => {
      if (key) record[key] = (cells[index] ?? "").replace(/\r\n?/g, "\n");
    });
    return record;
  });
}
