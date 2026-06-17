import crypto from "crypto";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import multer from "multer";
import ExcelJS from "exceljs";

dotenv.config();

type EntryType = "INCOME" | "EXPENSE";
type MonthStatus = "DRAFT" | "LOCKED" | "ARCHIVED";
type CashAdvanceStatus = "UNPAID" | "PAID";

export const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember"
];

export const DEFAULT_CATEGORIES = [
  { id: "cat-income-dana-masuk", name: "Dana Masuk", kind: "INCOME", color: "#16a34a" },
  { id: "cat-expense-transportasi", name: "Transportasi", kind: "EXPENSE", color: "#2563eb" },
  { id: "cat-expense-material", name: "Material", kind: "EXPENSE", color: "#0f766e" },
  { id: "cat-expense-rumah-tangga", name: "Rumah Tangga", kind: "EXPENSE", color: "#65a30d" },
  { id: "cat-expense-atk", name: "ATK", kind: "EXPENSE", color: "#ca8a04" },
  { id: "cat-expense-konsumsi-kantor", name: "Konsumsi Kantor", kind: "EXPENSE", color: "#dc2626" },
  { id: "cat-expense-konsumsi", name: "Konsumsi", kind: "EXPENSE", color: "#f97316" },
  { id: "cat-expense-listrik-kantor", name: "Listrik Kantor", kind: "EXPENSE", color: "#eab308" },
  { id: "cat-expense-listrik-server", name: "Listrik Server", kind: "EXPENSE", color: "#0891b2" },
  { id: "cat-expense-sangu", name: "Sangu", kind: "EXPENSE", color: "#7c3aed" },
  { id: "cat-expense-fee", name: "Fee", kind: "EXPENSE", color: "#9333ea" },
  { id: "cat-expense-fee-sales", name: "Fee Sales", kind: "EXPENSE", color: "#a855f7" },
  { id: "cat-expense-gaji", name: "Gaji", kind: "EXPENSE", color: "#059669" },
  { id: "cat-expense-ongkir", name: "Ongkir", kind: "EXPENSE", color: "#0284c7" },
  { id: "cat-expense-amplop", name: "Amplop", kind: "EXPENSE", color: "#e11d48" },
  { id: "cat-expense-diskon", name: "Diskon", kind: "EXPENSE", color: "#14b8a6" },
  { id: "cat-expense-perawatan", name: "Perawatan", kind: "EXPENSE", color: "#ea580c" },
  { id: "cat-expense-perjalanan-bisnis", name: "Perjalanan Bisnis", kind: "EXPENSE", color: "#4f46e5" },
  { id: "cat-expense-lain-lain", name: "Lain-Lain", kind: "EXPENSE", color: "#64748b" }
] as const;

export const slug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const id = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const toNumber = (value: unknown) => Number(value || 0);
const dateOnly = (value: Date | string) => new Date(value).toISOString().slice(0, 10);
const currencyFormat = '"Rp" #,##0';
const clampPageLimit = (value: unknown) => {
  const limit = Number(value) || 25;
  return [25, 50, 100].includes(limit) ? limit : 25;
};
const positivePage = (value: unknown) => Math.max(1, Number(value) || 1);
const PROOF_MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
};
const MAX_PROOF_IMAGE_SIZE = 5 * 1024 * 1024;

export function parseAmount(value: unknown): number {
  if (typeof value === "number") return value;
  let cleaned = String(value || "").trim().replace(/[^\d.,-]/g, "");
  if (cleaned.includes(",") && cleaned.includes(".")) {
    cleaned = cleaned.replace(/,/g, "");
  } else if (cleaned.includes(",")) {
    cleaned = cleaned.replace(/,/g, "");
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, "");
  }
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const next = input[i + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function parseIndonesianDate(value: string, fallbackYear: number) {
  const months: Record<string, string> = {
    januari: "01", jan: "01", februari: "02", feb: "02", maret: "03", mar: "03",
    april: "04", apr: "04", mei: "05", may: "05", juni: "06", jun: "06",
    juli: "07", jul: "07", agustus: "08", aug: "08", september: "09", sep: "09",
    oktober: "10", okt: "10", november: "11", nov: "11", desember: "12", des: "12"
  };
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "").replace(/[–—]/g, "-");
  let match = normalized.match(/^(\d{1,2})-?([a-z]+)(?:-?(\d{2,4}))?$/);
  if (match) {
    let year = match[3] ? Number(match[3]) : fallbackYear;
    if (year < 100) year += 2000;
    const month = months[match[2]];
    return month ? `${year}-${month}-${match[1].padStart(2, "0")}` : null;
  }
  match = normalized.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (match) {
    let year = match[3] ? Number(match[3]) : fallbackYear;
    if (year < 100) year += 2000;
    return `${year}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  }
  return null;
}

export function computeLedger(month: any, entries: any[]) {
  let balance = toNumber(month.openingBalance);
  return entries
    .slice()
    .sort((a, b) => `${dateOnly(a.date)}-${a.createdAt}`.localeCompare(`${dateOnly(b.date)}-${b.createdAt}`))
    .map((entry) => {
      const amount = toNumber(entry.amount);
      balance += entry.type === "INCOME" ? amount : -amount;
      return { ...entry, date: dateOnly(entry.date), amount, runningBalance: balance };
    });
}

export function summarize(month: any, ledger: any[], cashAdvances: any[]) {
  const totalIncome = ledger.filter((entry) => entry.type === "INCOME").reduce((sum, entry) => sum + entry.amount, 0);
  const totalExpense = ledger.filter((entry) => entry.type === "EXPENSE").reduce((sum, entry) => sum + entry.amount, 0);
  const outstandingKasbon = cashAdvances
    .filter((item) => item.status === "UNPAID")
    .reduce((sum, item) => sum + toNumber(item.amount), 0);
  const outstandingKasbonCount = cashAdvances.filter((item) => item.status === "UNPAID").length;
  const byCategory = new Map<string, number>();
  const byDay = new Map<string, { income: number; expense: number }>();
  for (const entry of ledger) {
    const day = entry.date;
    const daily = byDay.get(day) || { income: 0, expense: 0 };
    if (entry.type === "INCOME") daily.income += entry.amount;
    else {
      daily.expense += entry.amount;
      byCategory.set(entry.category.name, (byCategory.get(entry.category.name) || 0) + entry.amount);
    }
    byDay.set(day, daily);
  }
  return {
    openingBalance: toNumber(month.openingBalance),
    ledgerCount: ledger.length,
    totalIncome,
    totalExpense,
    closingBalance: toNumber(month.openingBalance) + totalIncome - totalExpense,
    outstandingKasbon,
    outstandingKasbonCount,
    byCategory: [...byCategory.entries()].map(([name, amount]) => ({ name, amount })),
    byDay: [...byDay.entries()].map(([date, values]) => ({ date, ...values }))
  };
}

function formatExportFileName(month: any) {
  return `LKH-SkyNet-${month.year}-${String(month.month).padStart(2, "0")}.xlsx`;
}

function styleSheet(sheet: ExcelJS.Worksheet) {
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.properties.defaultRowHeight = 18;
  sheet.eachRow((row, rowNumber) => {
    const currentFont = row.font || {};
    row.font = { ...currentFont, name: "Arial", size: rowNumber === 1 ? 9 : 8, bold: currentFont.bold || rowNumber === 1 };
    row.alignment = { vertical: "middle" };
  });
  const header = sheet.getRow(1);
  header.height = 22;
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
    cell.border = { bottom: { style: "thin", color: { argb: "FFCBD5E1" } } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });
  if (sheet.rowCount > 1 && sheet.columnCount > 0) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: sheet.rowCount, column: sheet.columnCount }
    };
  }
}

function setMoneyColumns(sheet: ExcelJS.Worksheet, indexes: number[]) {
  indexes.forEach((index) => {
    sheet.getColumn(index).numFmt = currencyFormat;
    sheet.getColumn(index).alignment = { horizontal: "right" };
  });
}

export async function buildMonthWorkbook(payload: any) {
  const { month, ledger, cashAdvances, summary } = payload;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "LKH SkyNet";
  workbook.created = new Date();
  workbook.modified = new Date();

  const summarySheet = workbook.addWorksheet("Ringkasan");
  summarySheet.columns = [
    { header: "Metrik", key: "metric", width: 28 },
    { header: "Nilai", key: "value", width: 20 }
  ];
  summarySheet.addRows([
    { metric: "Periode", value: month.label },
    { metric: "Status", value: month.status },
    { metric: "Saldo Awal", value: summary.openingBalance },
    { metric: "Total Masuk", value: summary.totalIncome },
    { metric: "Total Keluar", value: summary.totalExpense },
    { metric: "Saldo Akhir", value: summary.closingBalance },
    { metric: "Kasbon Aktif", value: summary.outstandingKasbon },
    { metric: "Saldo Bersih", value: summary.closingBalance - summary.outstandingKasbon },
    { metric: "Total Transaksi", value: summary.ledgerCount },
    { metric: "Kasbon Belum Lunas", value: summary.outstandingKasbonCount }
  ]);
  [4, 5, 6, 7, 8, 9].forEach((row) => summarySheet.getCell(row, 2).numFmt = currencyFormat);
  styleSheet(summarySheet);

  const ledgerSheet = workbook.addWorksheet("Sirkulasi Harian");
  ledgerSheet.columns = [
    { header: "Tanggal", key: "date", width: 12 },
    { header: "No Bukti", key: "proofNo", width: 12 },
    { header: "Keterangan", key: "description", width: 36 },
    { header: "Kategori", key: "category", width: 20 },
    { header: "Masuk", key: "income", width: 16 },
    { header: "Keluar", key: "expense", width: 16 },
    { header: "Saldo", key: "runningBalance", width: 16 },
    { header: "Bukti", key: "proof", width: 10 },
    { header: "Nama File Bukti", key: "proofName", width: 24 }
  ];
  ledgerSheet.addRows(ledger.map((entry: any) => ({
    date: entry.date,
    proofNo: entry.proofNo || "",
    description: entry.description,
    category: entry.category?.name || "",
    income: entry.type === "INCOME" ? entry.amount : null,
    expense: entry.type === "EXPENSE" ? entry.amount : null,
    runningBalance: entry.runningBalance,
    proof: entry.proofImagePath ? "Ada" : "Tidak",
    proofName: entry.proofImageName || ""
  })));
  ledgerSheet.addRow({
    description: "TOTAL",
    income: summary.totalIncome,
    expense: summary.totalExpense,
    runningBalance: summary.closingBalance
  }).font = { name: "Arial", size: 8, bold: true };
  setMoneyColumns(ledgerSheet, [5, 6, 7]);
  styleSheet(ledgerSheet);

  const kasbonSheet = workbook.addWorksheet("Kasbon");
  kasbonSheet.columns = [
    { header: "Tanggal", key: "date", width: 12 },
    { header: "Nama", key: "person", width: 20 },
    { header: "Keterangan", key: "description", width: 36 },
    { header: "Nominal", key: "amount", width: 16 },
    { header: "Status", key: "status", width: 14 },
    { header: "Bukti", key: "proof", width: 10 },
    { header: "Nama File Bukti", key: "proofName", width: 24 }
  ];
  kasbonSheet.addRows(cashAdvances.map((item: any) => ({
    date: item.date,
    person: item.person,
    description: item.description,
    amount: item.amount,
    status: item.status === "PAID" ? "Lunas" : "Belum Lunas",
    proof: item.proofImagePath ? "Ada" : "Tidak",
    proofName: item.proofImageName || ""
  })));
  kasbonSheet.addRow({ description: "TOTAL KASBON AKTIF", amount: summary.outstandingKasbon }).font = { name: "Arial", size: 8, bold: true };
  setMoneyColumns(kasbonSheet, [4]);
  styleSheet(kasbonSheet);
  for (let rowNumber = 2; rowNumber <= kasbonSheet.rowCount; rowNumber++) {
    const statusCell = kasbonSheet.getCell(rowNumber, 5);
    if (statusCell.value === "Lunas") statusCell.font = { name: "Arial", size: 8, bold: true, color: { argb: "FF047857" } };
    if (statusCell.value === "Belum Lunas") statusCell.font = { name: "Arial", size: 8, bold: true, color: { argb: "FFB45309" } };
  }

  const categorySheet = workbook.addWorksheet("Kategori");
  categorySheet.columns = [
    { header: "Kategori", key: "name", width: 28 },
    { header: "Total Keluar", key: "amount", width: 18 }
  ];
  categorySheet.addRows(summary.byCategory.map((item: any) => ({ name: item.name, amount: item.amount })));
  categorySheet.addRow({ name: "TOTAL", amount: summary.totalExpense }).font = { name: "Arial", size: 8, bold: true };
  setMoneyColumns(categorySheet, [2]);
  styleSheet(categorySheet);

  return { workbook, fileName: formatExportFileName(month) };
}

export async function createApp(options: { prisma?: PrismaClient; serveFrontend?: boolean } = {}) {
  const app = express();
  const DATA_DIR = process.env.DATA_DIR || process.cwd();
  const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
  const LEDGER_PROOF_DIR = path.join(UPLOAD_DIR, "ledger-proofs");
  const KASBON_PROOF_DIR = path.join(UPLOAD_DIR, "kasbon-proofs");
  const prisma = options.prisma ?? (process.env.DATABASE_URL ? new PrismaClient() : null);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(LEDGER_PROOF_DIR, { recursive: true });
  fs.mkdirSync(KASBON_PROOF_DIR, { recursive: true });

  const proofUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_PROOF_IMAGE_SIZE },
    fileFilter: (_req, file, cb) => {
      if (!PROOF_MIME_EXTENSIONS[file.mimetype]) {
        cb(new Error("Format bukti harus JPG, PNG, atau WebP."));
        return;
      }
      cb(null, true);
    }
  }).single("proof");

  const db = () => {
    if (!prisma) throw new Error("DATABASE_URL belum diatur.");
    return prisma as any;
  };

  async function seedCategories() {
    await Promise.all(DEFAULT_CATEGORIES.map((category) => db().category.upsert({
      where: { id: category.id },
      create: category,
      update: category
    })));
  }

  async function getMonthPayload(monthId: string) {
    const month = await db().month.findUnique({
      where: { id: monthId },
      include: {
        ledgerEntries: { include: { category: true }, orderBy: [{ date: "asc" }, { createdAt: "asc" }] },
        cashAdvances: { orderBy: [{ date: "asc" }, { createdAt: "asc" }] }
      }
    });
    if (!month) throw new Error("Bulan LKH tidak ditemukan.");
    const ledger = computeLedger(month, month.ledgerEntries).map((entry) => ({
      ...entry,
      proofImageUrl: entry.proofImagePath ? `/uploads/${entry.proofImagePath}` : null
    }));
    const cashAdvances = month.cashAdvances.map((item: any) => ({
      ...item,
      date: dateOnly(item.date),
      amount: toNumber(item.amount),
      proofImageUrl: item.proofImagePath ? `/uploads/${item.proofImagePath}` : null
    }));
    const { ledgerEntries: _ledgerEntries, cashAdvances: _cashAdvances, ...cleanMonth } = month;
    return { month: { ...cleanMonth, openingBalance: toNumber(month.openingBalance) }, ledger, cashAdvances, summary: summarize(month, ledger, cashAdvances) };
  }

  async function getMonthSummaryPayload(monthId: string) {
    const { month, ledger, cashAdvances, summary } = await getMonthPayload(monthId);
    return { month, cashAdvances, summary: { ...summary, ledgerCount: ledger.length } };
  }

  async function getLedgerPayload(monthId: string, query: any) {
    const month = await db().month.findUnique({
      where: { id: monthId },
      include: {
        ledgerEntries: { include: { category: true }, orderBy: [{ date: "asc" }, { createdAt: "asc" }] }
      }
    });
    if (!month) throw new Error("Bulan LKH tidak ditemukan.");

    const page = positivePage(query.page);
    const limit = clampPageLimit(query.limit);
    const search = String(query.search || "").trim().toLowerCase();
    const dateFrom = String(query.dateFrom || "").trim();
    const dateTo = String(query.dateTo || "").trim();
    const categoryId = String(query.categoryId || "").trim();
    const type = String(query.type || "").trim() as EntryType | "";
    const proof = String(query.proof || "all").trim();
    if (type && !["INCOME", "EXPENSE"].includes(type)) throw new Error("Filter tipe transaksi tidak valid.");
    if (!["all", "with", "without"].includes(proof)) throw new Error("Filter bukti tidak valid.");

    const ledger = computeLedger(month, month.ledgerEntries).map((entry) => ({
      ...entry,
      proofImageUrl: entry.proofImagePath ? `/uploads/${entry.proofImagePath}` : null
    }));
    const filtered = ledger.filter((entry) => {
      if (search) {
        const haystack = `${entry.description || ""} ${entry.proofNo || ""} ${entry.category?.name || ""}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      if (dateFrom && entry.date < dateFrom) return false;
      if (dateTo && entry.date > dateTo) return false;
      if (categoryId && entry.categoryId !== categoryId) return false;
      if (type && entry.type !== type) return false;
      if (proof === "with" && !entry.proofImagePath) return false;
      if (proof === "without" && entry.proofImagePath) return false;
      return true;
    });
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const offset = (safePage - 1) * limit;
    return {
      ledger: filtered.slice(offset, offset + limit),
      page: safePage,
      limit,
      total,
      totalPages,
      filters: { search, dateFrom, dateTo, categoryId, type, proof }
    };
  }

  async function getKasbonPayload(monthId: string, query: any) {
    const month = await db().month.findUnique({
      where: { id: monthId },
      include: {
        cashAdvances: { orderBy: [{ date: "asc" }, { createdAt: "asc" }] }
      }
    });
    if (!month) throw new Error("Bulan LKH tidak ditemukan.");

    const page = positivePage(query.page);
    const limit = clampPageLimit(query.limit);
    const search = String(query.search || "").trim().toLowerCase();
    const dateFrom = String(query.dateFrom || "").trim();
    const dateTo = String(query.dateTo || "").trim();
    const status = String(query.status || "").trim() as CashAdvanceStatus | "";
    const proof = String(query.proof || "all").trim();
    if (status && !["UNPAID", "PAID"].includes(status)) throw new Error("Filter status kasbon tidak valid.");
    if (!["all", "with", "without"].includes(proof)) throw new Error("Filter bukti tidak valid.");

    const cashAdvances = month.cashAdvances.map((item: any) => ({
      ...item,
      date: dateOnly(item.date),
      amount: toNumber(item.amount),
      proofImageUrl: item.proofImagePath ? `/uploads/${item.proofImagePath}` : null
    }));
    const filtered = cashAdvances.filter((item: any) => {
      if (search) {
        const haystack = `${item.person || ""} ${item.description || ""}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      if (dateFrom && item.date < dateFrom) return false;
      if (dateTo && item.date > dateTo) return false;
      if (status && item.status !== status) return false;
      if (proof === "with" && !item.proofImagePath) return false;
      if (proof === "without" && item.proofImagePath) return false;
      return true;
    });
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const offset = (safePage - 1) * limit;
    return {
      cashAdvances: filtered.slice(offset, offset + limit),
      page: safePage,
      limit,
      total,
      totalPages,
      filters: { search, dateFrom, dateTo, status, proof }
    };
  }

  const proofUrl = (entry: any) => entry.proofImagePath ? `/uploads/${entry.proofImagePath}` : null;
  const proofFilePath = (proofImagePath: string) => path.join(UPLOAD_DIR, proofImagePath);
  const removeProofFile = async (proofImagePath?: string | null) => {
    if (!proofImagePath) return;
    try {
      await fs.promises.unlink(proofFilePath(proofImagePath));
    } catch (error: any) {
      if (error?.code !== "ENOENT") console.warn(`Failed to delete proof image ${proofImagePath}:`, error);
    }
  };
  const writeProofFile = async (file: Express.Multer.File, folder = "ledger-proofs") => {
    const extension = PROOF_MIME_EXTENSIONS[file.mimetype];
    const fileName = `${crypto.randomUUID()}${extension}`;
    const relativePath = `${folder}/${fileName}`;
    await fs.promises.writeFile(proofFilePath(relativePath), file.buffer);
    return relativePath;
  };

  app.use(express.json({ limit: "8mb" }));
  app.use(express.urlencoded({ extended: true, limit: "8mb" }));
  app.use("/uploads", express.static(UPLOAD_DIR));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", app: "lkh", mode: process.env.NODE_ENV || "development" });
  });

  app.get("/api/bootstrap", async (_req, res) => {
    try {
      await seedCategories();
      const [months, categories] = await Promise.all([
        db().month.findMany({ orderBy: [{ year: "desc" }, { month: "desc" }] }),
        db().category.findMany({ orderBy: [{ kind: "asc" }, { name: "asc" }] })
      ]);
      res.json({ success: true, months: months.map((m: any) => ({ ...m, openingBalance: toNumber(m.openingBalance) })), categories });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/months", async (req, res) => {
    try {
      const year = Number(req.body.year);
      const monthNumber = Number(req.body.month);
      const openingBalance = parseAmount(req.body.openingBalance);
      if (!year || monthNumber < 1 || monthNumber > 12) throw new Error("Tahun atau bulan tidak valid.");
      const month = await db().month.upsert({
        where: { year_month: { year, month: monthNumber } },
        create: {
          id: `lkh-${year}-${String(monthNumber).padStart(2, "0")}`,
          year,
          month: monthNumber,
          label: `${MONTH_NAMES[monthNumber - 1]} ${year}`,
          openingBalance,
          status: "DRAFT" as MonthStatus
        },
        update: { openingBalance }
      });
      res.json({ success: true, month: { ...month, openingBalance: toNumber(month.openingBalance) } });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.get("/api/months/:monthId/summary", async (req, res) => {
    try {
      res.json({ success: true, ...(await getMonthSummaryPayload(req.params.monthId)) });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  });

  app.get("/api/months/:monthId/export.xlsx", async (req, res) => {
    try {
      const exportPayload = await buildMonthWorkbook(await getMonthPayload(req.params.monthId));
      const buffer = await exportPayload.workbook.xlsx.writeBuffer();
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${exportPayload.fileName}"`);
      res.send(Buffer.from(buffer));
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  });

  app.get("/api/months/:monthId", async (req, res) => {
    try {
      res.json({ success: true, ...(await getMonthPayload(req.params.monthId)) });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  });

  app.get("/api/months/:monthId/ledger", async (req, res) => {
    try {
      res.json({ success: true, ...(await getLedgerPayload(req.params.monthId, req.query)) });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.get("/api/months/:monthId/kasbon", async (req, res) => {
    try {
      res.json({ success: true, ...(await getKasbonPayload(req.params.monthId, req.query)) });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.patch("/api/months/:monthId", async (req, res) => {
    try {
      const data: any = {};
      if (req.body.status) {
        const status = req.body.status as MonthStatus;
        if (!["DRAFT", "LOCKED", "ARCHIVED"].includes(status)) throw new Error("Status bulan tidak valid.");
        data.status = status;
      }
      if (!Object.keys(data).length) throw new Error("Tidak ada perubahan.");
      const month = await db().month.update({ where: { id: req.params.monthId }, data });
      res.json({ success: true, month });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.post("/api/months/:monthId/ledger", async (req, res) => {
    try {
      const month = await db().month.findUnique({ where: { id: req.params.monthId } });
      if (!month || month.status !== "DRAFT") throw new Error("Bulan terkunci atau tidak ditemukan.");
      const amount = parseAmount(req.body.amount);
      if (!amount || amount <= 0) throw new Error("Nominal harus lebih dari 0.");
      const type = req.body.type as EntryType;
      if (!["INCOME", "EXPENSE"].includes(type)) throw new Error("Tipe transaksi tidak valid.");
      const entry = await db().ledgerEntry.create({
        data: {
          id: id("entry"),
          monthId: req.params.monthId,
          date: new Date(req.body.date),
          proofNo: req.body.proofNo || null,
          description: String(req.body.description || "").trim(),
          categoryId: req.body.categoryId,
          type,
          amount
        }
      });
      res.json({ success: true, entry });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.put("/api/ledger/:entryId", async (req, res) => {
    try {
      const existing = await db().ledgerEntry.findUnique({ where: { id: req.params.entryId }, include: { month: true } });
      if (!existing || existing.month.status !== "DRAFT") throw new Error("Transaksi tidak dapat diubah.");
      const amount = parseAmount(req.body.amount);
      if (!amount || amount <= 0) throw new Error("Nominal harus lebih dari 0.");
      const type = req.body.type as EntryType;
      if (!["INCOME", "EXPENSE"].includes(type)) throw new Error("Tipe transaksi tidak valid.");
      const entry = await db().ledgerEntry.update({
        where: { id: req.params.entryId },
        data: {
          date: new Date(req.body.date),
          proofNo: req.body.proofNo || null,
          description: String(req.body.description || "").trim(),
          categoryId: req.body.categoryId,
          type,
          amount
        }
      });
      res.json({ success: true, entry });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.delete("/api/ledger/:entryId", async (req, res) => {
    try {
      const existing = await db().ledgerEntry.findUnique({ where: { id: req.params.entryId }, include: { month: true } });
      if (!existing || existing.month.status !== "DRAFT") throw new Error("Transaksi tidak dapat dihapus.");
      await db().ledgerEntry.delete({ where: { id: req.params.entryId } });
      await removeProofFile(existing.proofImagePath);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.post("/api/ledger/:entryId/proof", (req, res) => {
    proofUpload(req, res, async (uploadError: any) => {
      let nextProofPath: string | null = null;
      try {
        if (uploadError) throw uploadError;
        if (!req.file) throw new Error("File bukti wajib diunggah.");
        const existing = await db().ledgerEntry.findUnique({ where: { id: req.params.entryId }, include: { month: true } });
        if (!existing || existing.month.status !== "DRAFT") throw new Error("Bukti transaksi tidak dapat diubah.");
        nextProofPath = await writeProofFile(req.file);
        const entry = await db().ledgerEntry.update({
          where: { id: req.params.entryId },
          data: {
            proofImagePath: nextProofPath,
            proofImageName: req.file.originalname,
            proofImageMime: req.file.mimetype,
            proofImageSize: req.file.size
          }
        });
        await removeProofFile(existing.proofImagePath);
        res.json({ success: true, entry: { ...entry, amount: toNumber(entry.amount), proofImageUrl: proofUrl(entry) } });
      } catch (error: any) {
        await removeProofFile(nextProofPath);
        res.status(400).json({ success: false, error: error.message });
      }
    });
  });

  app.delete("/api/ledger/:entryId/proof", async (req, res) => {
    try {
      const existing = await db().ledgerEntry.findUnique({ where: { id: req.params.entryId }, include: { month: true } });
      if (!existing || existing.month.status !== "DRAFT") throw new Error("Bukti transaksi tidak dapat dihapus.");
      const entry = await db().ledgerEntry.update({
        where: { id: req.params.entryId },
        data: {
          proofImagePath: null,
          proofImageName: null,
          proofImageMime: null,
          proofImageSize: null
        }
      });
      await removeProofFile(existing.proofImagePath);
      res.json({ success: true, entry: { ...entry, amount: toNumber(entry.amount), proofImageUrl: null } });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.post("/api/months/:monthId/kasbon", async (req, res) => {
    try {
      const month = await db().month.findUnique({ where: { id: req.params.monthId } });
      if (!month || month.status !== "DRAFT") throw new Error("Bulan terkunci atau tidak ditemukan.");
      const amount = parseAmount(req.body.amount);
      if (!amount || amount <= 0) throw new Error("Nominal kasbon harus lebih dari 0.");
      const status = (req.body.status || "UNPAID") as CashAdvanceStatus;
      if (!["UNPAID", "PAID"].includes(status)) throw new Error("Status kasbon tidak valid.");
      const item = await db().cashAdvance.create({
        data: {
          id: id("kasbon"),
          monthId: req.params.monthId,
          date: new Date(req.body.date),
          person: String(req.body.person || "").trim(),
          description: String(req.body.description || "").trim(),
          amount,
          status
        }
      });
      res.json({ success: true, item: { ...item, date: dateOnly(item.date), amount: toNumber(item.amount), proofImageUrl: proofUrl(item) } });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.patch("/api/kasbon/:cashAdvanceId", async (req, res) => {
    try {
      const existing = await db().cashAdvance.findUnique({ where: { id: req.params.cashAdvanceId }, include: { month: true } });
      if (!existing || existing.month.status !== "DRAFT") throw new Error("Kasbon tidak dapat diubah.");
      const status = req.body.status as CashAdvanceStatus;
      if (!["UNPAID", "PAID"].includes(status)) throw new Error("Status kasbon tidak valid.");
      const item = await db().cashAdvance.update({
        where: { id: req.params.cashAdvanceId },
        data: { status }
      });
      res.json({ success: true, item: { ...item, date: dateOnly(item.date), amount: toNumber(item.amount), proofImageUrl: proofUrl(item) } });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.put("/api/kasbon/:cashAdvanceId", async (req, res) => {
    try {
      const existing = await db().cashAdvance.findUnique({ where: { id: req.params.cashAdvanceId }, include: { month: true } });
      if (!existing || existing.month.status !== "DRAFT") throw new Error("Kasbon tidak dapat diubah.");
      const amount = parseAmount(req.body.amount);
      if (!amount || amount <= 0) throw new Error("Nominal kasbon harus lebih dari 0.");
      const status = req.body.status as CashAdvanceStatus;
      if (!["UNPAID", "PAID"].includes(status)) throw new Error("Status kasbon tidak valid.");
      const item = await db().cashAdvance.update({
        where: { id: req.params.cashAdvanceId },
        data: {
          date: new Date(req.body.date),
          person: String(req.body.person || "").trim(),
          description: String(req.body.description || "").trim(),
          amount,
          status
        }
      });
      res.json({ success: true, item: { ...item, date: dateOnly(item.date), amount: toNumber(item.amount), proofImageUrl: proofUrl(item) } });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.delete("/api/kasbon/:cashAdvanceId", async (req, res) => {
    try {
      const existing = await db().cashAdvance.findUnique({ where: { id: req.params.cashAdvanceId }, include: { month: true } });
      if (!existing || existing.month.status !== "DRAFT") throw new Error("Kasbon tidak dapat dihapus.");
      await db().cashAdvance.delete({ where: { id: req.params.cashAdvanceId } });
      await removeProofFile(existing.proofImagePath);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.post("/api/kasbon/:cashAdvanceId/proof", (req, res) => {
    proofUpload(req, res, async (uploadError: any) => {
      let nextProofPath: string | null = null;
      try {
        if (uploadError) throw uploadError;
        if (!req.file) throw new Error("File bukti wajib diunggah.");
        const existing = await db().cashAdvance.findUnique({ where: { id: req.params.cashAdvanceId }, include: { month: true } });
        if (!existing || existing.month.status !== "DRAFT") throw new Error("Bukti kasbon tidak dapat diubah.");
        nextProofPath = await writeProofFile(req.file, "kasbon-proofs");
        const item = await db().cashAdvance.update({
          where: { id: req.params.cashAdvanceId },
          data: {
            proofImagePath: nextProofPath,
            proofImageName: req.file.originalname,
            proofImageMime: req.file.mimetype,
            proofImageSize: req.file.size
          }
        });
        await removeProofFile(existing.proofImagePath);
        res.json({ success: true, item: { ...item, date: dateOnly(item.date), amount: toNumber(item.amount), proofImageUrl: proofUrl(item) } });
      } catch (error: any) {
        await removeProofFile(nextProofPath);
        res.status(400).json({ success: false, error: error.message });
      }
    });
  });

  app.delete("/api/kasbon/:cashAdvanceId/proof", async (req, res) => {
    try {
      const existing = await db().cashAdvance.findUnique({ where: { id: req.params.cashAdvanceId }, include: { month: true } });
      if (!existing || existing.month.status !== "DRAFT") throw new Error("Bukti kasbon tidak dapat dihapus.");
      const item = await db().cashAdvance.update({
        where: { id: req.params.cashAdvanceId },
        data: {
          proofImagePath: null,
          proofImageName: null,
          proofImageMime: null,
          proofImageSize: null
        }
      });
      await removeProofFile(existing.proofImagePath);
      res.json({ success: true, item: { ...item, date: dateOnly(item.date), amount: toNumber(item.amount), proofImageUrl: null } });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.post("/api/months/:monthId/import-csv", async (req, res) => {
    try {
      const month = await db().month.findUnique({ where: { id: req.params.monthId } });
      if (!month || month.status !== "DRAFT") throw new Error("Bulan terkunci atau tidak ditemukan.");
      const csv = String(req.body.csv || "");
      const cutoff = req.body.cutoff || `${month.year}-${String(month.month).padStart(2, "0")}-31`;
      const rows = parseCsv(csv);
      const headerIndex = rows.findIndex((row) => (row[0] || "").trim() === "Tanggal");
      if (headerIndex < 0) throw new Error("Header Tanggal tidak ditemukan.");
      const categories = await db().category.findMany();
      const byName = new Map(categories.map((cat: any) => [cat.name.toLowerCase(), cat]));
      let currentDate = "";
      let currentProof = "";
      let imported = 0;
      await db().$transaction(async (tx: any) => {
        for (let i = headerIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          const parsedDate = parseIndonesianDate(row[0] || "", month.year);
          if (parsedDate) currentDate = parsedDate;
          if ((row[1] || "").trim()) currentProof = row[1].trim();
          const description = (row[2] || "").trim().replace(/\s+/g, " ");
          const categoryName = (row[3] || "").trim();
          const income = parseAmount(row[4]);
          const expense = parseAmount(row[5]);
          const hasBalanceCell = Boolean((row[6] || "").trim());
          const isFooterRow = !parsedDate && !description && !categoryName && !income && !expense && hasBalanceCell;
          if (isFooterRow && imported > 0) break;
          if (!description || description.toLowerCase() === "saldo awal" || !currentDate || currentDate > cutoff) continue;
          if (!income && !expense) continue;
          const type = income ? "INCOME" : "EXPENSE";
          const lookup = type === "INCOME" ? "dana masuk" : (categoryName || "lain-lain").toLowerCase();
          let category: any = byName.get(lookup);
          if (!category) {
            category = await tx.category.create({
              data: { id: `cat-expense-${slug(lookup)}`, name: categoryName || "lain-lain", kind: "EXPENSE", color: "#64748b" }
            });
            byName.set(lookup, category);
          }
          await tx.ledgerEntry.create({
            data: {
              id: `import-${req.params.monthId}-${String(i + 1).padStart(4, "0")}`,
              monthId: req.params.monthId,
              date: new Date(currentDate),
              proofNo: currentProof || null,
              description,
              categoryId: category.id,
              type,
              amount: income || expense,
              source: "spreadsheet-import"
            }
          });
          imported++;
        }
      });
      res.json({ success: true, imported });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  if (options.serveFrontend !== false && process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true } });
    app.use(vite.middlewares);
  } else if (options.serveFrontend !== false) {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  return app;
}

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;
  const HOST = process.env.HOST || "0.0.0.0";
  const app = await createApp();
  app.listen(PORT, HOST, () => {
    console.log(`LKH app running on ${HOST}:${PORT}`);
  });
}

if (process.env.VITEST !== "true") {
  startServer().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
