import type { CashAdvanceStatus, EntryType, UserRole } from '../types';

export type FieldErrors = Record<string, string>;

export type ValidationResult<T = unknown> = {
  valid: boolean;
  values?: T;
  fieldErrors: FieldErrors;
  formError?: string;
};

export const PROOF_MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

export const MAX_PROOF_IMAGE_SIZE = 5 * 1024 * 1024;

export function parseAmount(value: unknown): number {
  if (typeof value === 'number') return value;
  const raw = String(value || '').trim();
  const negativeParentheses = /^\(.*\)$/.test(raw);
  let cleaned = raw.replace(/[^\d.,-]/g, '');
  if (cleaned.includes(',') && cleaned.includes('.')) {
    cleaned = cleaned.replace(/,/g, '');
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(/,/g, '');
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, '');
  }
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return 0;
  return negativeParentheses ? -Math.abs(parsed) : parsed;
}

export function validatePasswordPolicy(password: string) {
  if (password.length < 8) return 'Password minimal 8 karakter.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Password harus mengandung huruf dan angka.';
  return null;
}

export function validateUsername(value: unknown) {
  const username = String(value || '').trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,40}$/.test(username)) throw new Error('Username harus 3-40 karakter dan hanya boleh huruf, angka, titik, underscore, atau strip.');
  return username;
}

export function validateName(value: unknown) {
  const name = String(value || '').trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 80) throw new Error('Nama pengguna harus 2-80 karakter.');
  return name;
}

export function validateRole(value: unknown): UserRole {
  if (value === 'ADMIN' || value === 'READER') return value;
  throw new Error('Role pengguna tidak valid.');
}

export function validateEntryType(value: unknown): EntryType {
  if (value === 'INCOME' || value === 'EXPENSE') return value;
  throw new Error('Tipe transaksi tidak valid.');
}

export function validateCashAdvanceStatus(value: unknown): CashAdvanceStatus {
  if (value === 'UNPAID' || value === 'PAID') return value;
  throw new Error('Status kasbon tidak valid.');
}

export function validateMonthStatus(value: unknown) {
  if (value === 'DRAFT' || value === 'LOCKED' || value === 'ARCHIVED') return value;
  throw new Error('Status bulan tidak valid.');
}

function isValidDateString(value: unknown) {
  const input = String(value || '').trim();
  if (!input || !/^\d{4}-\d{2}-\d{2}$/.test(input)) return false;
  const date = new Date(input);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === input;
}

function result<T>(fieldErrors: FieldErrors, values?: T, formError?: string): ValidationResult<T> {
  const valid = !Object.keys(fieldErrors).length && !formError;
  return { valid, values: valid ? values : undefined, fieldErrors, formError };
}

function capture<T>(field: string, errors: FieldErrors, task: () => T) {
  try {
    return task();
  } catch (error: any) {
    errors[field] = error.message;
    return undefined;
  }
}

export function validateLoginForm(input: { username: unknown; password: unknown }) {
  const fieldErrors: FieldErrors = {};
  const username = capture('username', fieldErrors, () => validateUsername(input.username));
  const password = String(input.password || '');
  if (!password) fieldErrors.password = 'Password wajib diisi.';
  return result(fieldErrors, { username: username || '', password });
}

export function validateChangePasswordForm(input: { currentPassword: unknown; nextPassword: unknown }) {
  const fieldErrors: FieldErrors = {};
  const currentPassword = String(input.currentPassword || '');
  const nextPassword = String(input.nextPassword || '');
  if (!currentPassword) fieldErrors.currentPassword = 'Password saat ini wajib diisi.';
  const policyError = validatePasswordPolicy(nextPassword);
  if (policyError) fieldErrors.nextPassword = policyError;
  return result(fieldErrors, { currentPassword, nextPassword });
}

export function validateCreateUserForm(input: { username: unknown; name: unknown; role: unknown; password: unknown }) {
  const fieldErrors: FieldErrors = {};
  const username = capture('username', fieldErrors, () => validateUsername(input.username));
  const name = capture('name', fieldErrors, () => validateName(input.name));
  const role = capture('role', fieldErrors, () => validateRole(input.role));
  const password = String(input.password || '');
  const policyError = validatePasswordPolicy(password);
  if (policyError) fieldErrors.password = policyError;
  return result(fieldErrors, { username: username || '', name: name || '', role: role || 'READER', password });
}

export function validateUpdateUserForm(input: { username: unknown; name: unknown; role: unknown; active: unknown }) {
  const fieldErrors: FieldErrors = {};
  const username = capture('username', fieldErrors, () => validateUsername(input.username));
  const name = capture('name', fieldErrors, () => validateName(input.name));
  const role = capture('role', fieldErrors, () => validateRole(input.role));
  return result(fieldErrors, { username: username || '', name: name || '', role: role || 'READER', active: Boolean(input.active) });
}

export function validateResetPasswordForm(input: { password: unknown }) {
  const fieldErrors: FieldErrors = {};
  const password = String(input.password || '');
  const policyError = validatePasswordPolicy(password);
  if (policyError) fieldErrors.password = policyError;
  return result(fieldErrors, { password });
}

export function validatePeriodForm(input: { year: unknown; month: unknown; openingBalance: unknown }) {
  const fieldErrors: FieldErrors = {};
  const year = Number(input.year);
  const month = Number(input.month);
  const openingBalance = parseAmount(input.openingBalance);
  if (!year || month < 1 || month > 12) fieldErrors.period = 'Tahun atau bulan tidak valid.';
  return result(fieldErrors, { year, month, openingBalance });
}

export function validateLedgerForm(input: { date: unknown; proofNo?: unknown; description: unknown; categoryId: unknown; type: unknown; amount: unknown }) {
  const fieldErrors: FieldErrors = {};
  const amount = parseAmount(input.amount);
  const type = capture('type', fieldErrors, () => validateEntryType(input.type));
  if (!isValidDateString(input.date)) fieldErrors.date = 'Tanggal transaksi wajib valid.';
  if (!String(input.description || '').trim()) fieldErrors.description = 'Keterangan wajib diisi.';
  if (!String(input.categoryId || '').trim()) fieldErrors.categoryId = 'Kategori wajib dipilih.';
  if (!amount || amount <= 0) fieldErrors.amount = 'Nominal harus lebih dari 0.';
  return result(fieldErrors, {
    date: String(input.date || ''),
    proofNo: String(input.proofNo || '').trim(),
    description: String(input.description || '').trim(),
    categoryId: String(input.categoryId || ''),
    type: type || 'EXPENSE',
    amount
  });
}

export function validateKasbonForm(input: { date: unknown; person: unknown; description: unknown; amount: unknown; status?: unknown }) {
  const fieldErrors: FieldErrors = {};
  const amount = parseAmount(input.amount);
  const status = input.status === undefined ? 'UNPAID' : capture('status', fieldErrors, () => validateCashAdvanceStatus(input.status));
  if (!isValidDateString(input.date)) fieldErrors.date = 'Tanggal kasbon wajib valid.';
  if (!String(input.person || '').trim()) fieldErrors.person = 'Nama wajib diisi.';
  if (!String(input.description || '').trim()) fieldErrors.description = 'Keterangan wajib diisi.';
  if (!amount || amount <= 0) fieldErrors.amount = 'Nominal kasbon harus lebih dari 0.';
  return result(fieldErrors, {
    date: String(input.date || ''),
    person: String(input.person || '').trim(),
    description: String(input.description || '').trim(),
    amount,
    status: status || 'UNPAID'
  });
}

export function validateProofFile(input: { mimetype?: unknown; type?: unknown; size?: unknown }) {
  const fieldErrors: FieldErrors = {};
  const mime = String(input.mimetype || input.type || '');
  const size = Number(input.size || 0);
  if (!PROOF_MIME_EXTENSIONS[mime]) fieldErrors.proof = 'Format bukti harus JPG, PNG, atau WebP.';
  if (size > MAX_PROOF_IMAGE_SIZE) fieldErrors.proof = 'Ukuran bukti maksimal 5MB.';
  return result(fieldErrors, { mime, size });
}
