// utils/reporting.js
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";

function escapeCSV(val) {
  if (val == null) return "";
  let s = String(val);
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    s = `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function clean(str) {
  if (!str) return "";
  // Avoid breaking CSV / HTML layouts
  return String(str).replace(/[\r\n,]+/g, " ").trim();
}

function formatDateForCsv(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ---------- CSV EXPORT (Transactions) ---------- */

export async function exportTransactionsCSV(transactions = []) {
  try {
    const headers = [
      "Date",
      "Type",
      "Category",
      "Amount",
      "Payment Method",
      "GST Applied",
      "GST Rate",
      "CGST",
      "SGST",
      "IGST",
      "Note",
    ];

    const rows = transactions.map((t) => [
      formatDateForCsv(t.date),
      t.type,
      clean(t.category),
      t.amount ?? 0,
      clean(t.paymentMethod),
      t.isGstApplied ? "Yes" : "No",
      t.gstRate || 0,
      t.cgst || 0,
      t.sgst || 0,
      t.igst || 0,
      clean(t.note),
    ]);

    const csv =
      headers.map(escapeCSV).join(",") +
      "\n" +
      rows.map((row) => row.map(escapeCSV).join(",")).join("\n");

    const filename = `smartspend_transactions_${Date.now()}.csv`;
    const fileUri = FileSystem.documentDirectory + filename;

    await FileSystem.writeAsStringAsync(fileUri, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: "text/csv",
        dialogTitle: "Share SmartSpend transactions CSV",
      });
    }
  } catch (err) {
    console.warn("Error exporting CSV:", err);
  }
}

/* ---------- INVOICE PDF (Filtered transactions) ---------- */

export async function generateInvoicePdf(book, transactions = []) {
  try {
    const bookName = book?.name || "Cashbook";
    let totalIn = 0;
    let totalOut = 0;
    let gstTotal = 0;

    transactions.forEach((t) => {
      if (t.type === "in") totalIn += t.amount || 0;
      if (t.type === "out") totalOut += t.amount || 0;
      if (t.isGstApplied) {
        gstTotal += (t.cgst || 0) + (t.sgst || 0) + (t.igst || 0);
      }
    });

    const balance = totalIn - totalOut;

    const rowsHtml = transactions
      .map(
        (t) => `
        <tr>
          <td>${formatDateForCsv(t.date)}</td>
          <td>${t.type}</td>
          <td>${clean(t.category)}</td>
          <td style="text-align:right;">₹${(t.amount || 0).toFixed(2)}</td>
          <td>${clean(t.paymentMethod)}</td>
          <td>${t.isGstApplied ? `GST ${t.gstRate || 0}%` : "-"}</td>
        </tr>`
      )
      .join("");

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Invoice – ${bookName}</title>
          <style>
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; color: #111827; }
            h1 { font-size: 22px; margin-bottom: 4px; }
            h2 { font-size: 16px; margin-top: 24px; margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #E5E7EB; padding: 6px 8px; }
            th { background-color: #F3F4F6; text-align: left; }
            .summary { margin-top: 16px; font-size: 13px; }
            .summary div { margin-bottom: 4px; }
          </style>
        </head>
        <body>
          <h1>SmartSpend Invoice</h1>
          <div>Cashbook: <strong>${bookName}</strong></div>
          <div style="font-size: 12px; color: #6B7280;">Generated at ${new Date().toLocaleString()}</div>

          <h2>Summary</h2>
          <div class="summary">
            <div>Total cash-in: ₹${totalIn.toFixed(2)}</div>
            <div>Total cash-out: ₹${totalOut.toFixed(2)}</div>
            <div>Net balance: ₹${balance.toFixed(2)}</div>
            <div>Total GST (all entries): ₹${gstTotal.toFixed(2)}</div>
          </div>

          <h2>Line items</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th style="text-align:right;">Amount</th>
                <th>Method</th>
                <th>GST</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || `<tr><td colspan="6">No transactions in this selection.</td></tr>`}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Share SmartSpend invoice PDF",
      });
    }
  } catch (err) {
    console.warn("Error generating invoice PDF:", err);
  }
}

/* ---------- PASSBOOK PDF (All transactions for a book) ---------- */

export async function exportPassbookPdf(book, transactions = []) {
  try {
    const bookName = book?.name || "Cashbook";
    const createdAt = book?.createdAt || "";

    let totalIn = 0;
    let totalOut = 0;

    transactions.forEach((t) => {
      if (t.type === "in") totalIn += t.amount || 0;
      if (t.type === "out") totalOut += t.amount || 0;
    });

    const balance = totalIn - totalOut;

    const rowsHtml = transactions
      .map(
        (t) => `
        <tr>
          <td>${formatDateForCsv(t.date)}</td>
          <td>${t.type === "in" ? "In" : "Out"}</td>
          <td>${clean(t.category)}</td>
          <td style="text-align:right;">₹${(t.amount || 0).toFixed(2)}</td>
          <td>${clean(t.note)}</td>
        </tr>`
      )
      .join("");

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Passbook – ${bookName}</title>
          <style>
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; color: #111827; }
            h1 { font-size: 22px; margin-bottom: 4px; }
            h2 { font-size: 16px; margin-top: 24px; margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #E5E7EB; padding: 6px 8px; }
            th { background-color: #F3F4F6; text-align: left; }
            .summary { margin-top: 16px; font-size: 13px; }
            .summary div { margin-bottom: 4px; }
          </style>
        </head>
        <body>
          <h1>SmartSpend Passbook</h1>
          <div>Cashbook: <strong>${bookName}</strong></div>
          ${
            createdAt
              ? `<div style="font-size: 12px; color: #6B7280;">Started on ${formatDateForCsv(
                  createdAt
                )}</div>`
              : ""
          }
          <div style="font-size: 12px; color: #6B7280; margin-top: 4px;">
            Generated at ${new Date().toLocaleString()}
          </div>

          <h2>Summary</h2>
          <div class="summary">
            <div>Total cash-in: ₹${totalIn.toFixed(2)}</div>
            <div>Total cash-out: ₹${totalOut.toFixed(2)}</div>
            <div>Closing balance: ₹${balance.toFixed(2)}</div>
          </div>

          <h2>Passbook entries</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th style="text-align:right;">Amount</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || `<tr><td colspan="5">No transactions recorded yet.</td></tr>`}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Share SmartSpend passbook PDF",
      });
    }
  } catch (err) {
    console.warn("Error exporting passbook PDF:", err);
  }
}
