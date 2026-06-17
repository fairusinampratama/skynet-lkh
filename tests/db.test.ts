import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import os from 'os';
import path from 'path';
import ExcelJS from 'exceljs';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../server';

const prisma = new PrismaClient();
let app: Awaited<ReturnType<typeof createApp>>;
let dataDir: string;

async function clean() {
  await prisma.cashAdvance.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.month.deleteMany();
  await prisma.category.deleteMany();
}

async function bootstrapCategory(kind: 'INCOME' | 'EXPENSE' = 'EXPENSE') {
  await request(app).get('/api/bootstrap').expect(200);
  const categories = await prisma.category.findMany({ where: { kind } });
  return categories[0];
}

async function createJune(openingBalance = 1596761) {
  const res = await request(app)
    .post('/api/months')
    .send({ year: 2026, month: 6, openingBalance })
    .expect(200);
  return res.body.month;
}

function parseBinaryResponse(res: any, callback: (error: Error | null, body?: Buffer) => void) {
  const chunks: Buffer[] = [];
  res.on('data', (chunk: Buffer) => chunks.push(chunk));
  res.on('end', () => callback(null, Buffer.concat(chunks)));
}

beforeAll(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lkh-test-'));
  process.env.DATA_DIR = dataDir;
  app = await createApp({ prisma, serveFrontend: false });
});

beforeEach(async () => {
  await clean();
});

afterAll(async () => {
  await clean();
  await prisma.$disconnect();
  fs.rmSync(dataDir, { recursive: true, force: true });
});

describe('LKH API and DB integration', () => {
  it('returns health and seeds default categories through bootstrap', async () => {
    await request(app).get('/api/health').expect(200).expect(({ body }) => {
      expect(body).toMatchObject({ status: 'ok', app: 'lkh' });
    });
    const res = await request(app).get('/api/bootstrap').expect(200);
    expect(res.body.categories.length).toBeGreaterThan(10);
  });

  it('creates or updates a unique month by year and month', async () => {
    await createJune(1000);
    const updated = await createJune(2000);
    expect(updated.openingBalance).toBe(2000);
    expect(await prisma.month.count()).toBe(1);
  });

  it('creates ledger entries and returns running balance summary', async () => {
    const month = await createJune(1000);
    const incomeCategory = await bootstrapCategory('INCOME');
    const expenseCategory = await bootstrapCategory('EXPENSE');

    await request(app).post(`/api/months/${month.id}/ledger`).send({
      date: '2026-06-01',
      proofNo: '1',
      description: 'Dana masuk operasional',
      categoryId: incomeCategory.id,
      type: 'INCOME',
      amount: 500
    }).expect(200);

    await request(app).post(`/api/months/${month.id}/ledger`).send({
      date: '2026-06-02',
      proofNo: '2',
      description: 'Bi BBM',
      categoryId: expenseCategory.id,
      type: 'EXPENSE',
      amount: 250
    }).expect(200);

    const res = await request(app).get(`/api/months/${month.id}`).expect(200);
    expect(res.body.ledger.map((entry: any) => entry.runningBalance)).toEqual([1500, 1250]);
    expect(res.body.summary).toMatchObject({ ledgerCount: 2, totalIncome: 500, totalExpense: 250, closingBalance: 1250 });
  });

  it('returns month summary without the full ledger payload', async () => {
    const month = await createJune(1000);
    const category = await bootstrapCategory('EXPENSE');
    await prisma.ledgerEntry.create({
      data: { id: 'summary-entry', monthId: month.id, date: new Date('2026-06-02'), description: 'Bi BBM', categoryId: category.id, type: 'EXPENSE', amount: 250 }
    });

    const res = await request(app).get(`/api/months/${month.id}/summary`).expect(200);
    expect(res.body.ledger).toBeUndefined();
    expect(res.body.cashAdvances).toEqual([]);
    expect(res.body.summary).toMatchObject({ ledgerCount: 1, totalExpense: 250, closingBalance: 750 });
  });

  it('exports a formatted full month Excel workbook', async () => {
    const month = await createJune(1000);
    const incomeCategory = await bootstrapCategory('INCOME');
    const expenseCategory = await bootstrapCategory('EXPENSE');
    await prisma.ledgerEntry.createMany({
      data: [
        { id: 'export-income', monthId: month.id, date: new Date('2026-06-01'), proofNo: '1', description: 'Dana masuk operasional', categoryId: incomeCategory.id, type: 'INCOME', amount: 500 },
        { id: 'export-expense', monthId: month.id, date: new Date('2026-06-02'), proofNo: '2', description: 'Bi BBM', categoryId: expenseCategory.id, type: 'EXPENSE', amount: 250, proofImagePath: 'ledger-proofs/proof.png', proofImageName: 'proof.png' }
      ]
    });
    await prisma.cashAdvance.create({
      data: { id: 'export-kasbon', monthId: month.id, date: new Date('2026-06-03'), person: 'Dafa', description: 'Kasbon BBM', amount: 100, status: 'UNPAID' }
    });

    const res = await request(app).get(`/api/months/${month.id}/export.xlsx`).parse(parseBinaryResponse).expect(200);
    expect(res.headers['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(res.headers['content-disposition']).toContain('LKH-SkyNet-2026-06.xlsx');
    expect(res.body.length).toBeGreaterThan(1000);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(res.body);
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual(['Ringkasan', 'Sirkulasi Harian', 'Kasbon', 'Kategori']);
    expect(workbook.getWorksheet('Ringkasan')?.getCell('B5').value).toBe(500);
    expect(workbook.getWorksheet('Ringkasan')?.getCell('B9').value).toBe(1150);
    expect(workbook.getWorksheet('Sirkulasi Harian')?.getCell('C2').value).toBe('Dana masuk operasional');
    expect(workbook.getWorksheet('Sirkulasi Harian')?.getCell('H3').value).toBe('Ada');
    expect(workbook.getWorksheet('Kasbon')?.getCell('B2').value).toBe('Dafa');
  });

  it('returns 404 when exporting a missing month', async () => {
    const res = await request(app).get('/api/months/missing/export.xlsx').expect(404);
    expect(res.body).toMatchObject({ success: false, error: 'Bulan LKH tidak ditemukan.' });
  });

  it('paginates, searches, and filters ledger rows while preserving running balance', async () => {
    const month = await createJune(1000);
    const incomeCategory = await bootstrapCategory('INCOME');
    const expenseCategory = await bootstrapCategory('EXPENSE');

    const rows = [
      { id: 'ledger-page-1', monthId: month.id, date: new Date('2026-06-01'), proofNo: '1', description: 'Dana masuk operasional', categoryId: incomeCategory.id, type: 'INCOME' as const, amount: 500 },
      { id: 'ledger-page-2', monthId: month.id, date: new Date('2026-06-02'), proofNo: '2', description: 'Bi BBM kantor', categoryId: expenseCategory.id, type: 'EXPENSE' as const, amount: 250 },
      { id: 'ledger-page-3', monthId: month.id, date: new Date('2026-06-03'), proofNo: '3', description: 'Bi konsumsi rapat', categoryId: expenseCategory.id, type: 'EXPENSE' as const, amount: 100 },
      ...Array.from({ length: 23 }, (_, index) => ({
        id: `ledger-page-extra-${index + 4}`,
        monthId: month.id,
        date: new Date(`2026-06-${String(index + 4).padStart(2, '0')}`),
        proofNo: String(index + 4),
        description: `Bi kecil ${index + 4}`,
        categoryId: expenseCategory.id,
        type: 'EXPENSE' as const,
        amount: 1
      }))
    ];
    await prisma.ledgerEntry.createMany({ data: rows });

    const pageTwo = await request(app).get(`/api/months/${month.id}/ledger?page=2&limit=25`).expect(200);
    expect(pageTwo.body).toMatchObject({ page: 2, limit: 25, total: 26, totalPages: 2 });
    expect(pageTwo.body.ledger).toHaveLength(1);
    expect(pageTwo.body.ledger[0]).toMatchObject({ id: 'ledger-page-extra-26', runningBalance: 1127 });

    const pageOne = await request(app).get(`/api/months/${month.id}/ledger?page=1&limit=25`).expect(200);
    expect(pageOne.body.ledger.slice(0, 3).map((entry: any) => entry.runningBalance)).toEqual([1500, 1250, 1150]);

    const search = await request(app).get(`/api/months/${month.id}/ledger?search=bbm`).expect(200);
    expect(search.body.total).toBe(1);
    expect(search.body.ledger[0]).toMatchObject({ description: 'Bi BBM kantor', runningBalance: 1250 });

    const incomeOnly = await request(app).get(`/api/months/${month.id}/ledger?type=INCOME`).expect(200);
    expect(incomeOnly.body.total).toBe(1);
    expect(incomeOnly.body.ledger[0].type).toBe('INCOME');

    const categoryOnly = await request(app).get(`/api/months/${month.id}/ledger?categoryId=${expenseCategory.id}`).expect(200);
    expect(categoryOnly.body.total).toBe(25);
  });

  it('filters ledger rows by proof availability', async () => {
    const month = await createJune();
    const category = await bootstrapCategory('EXPENSE');
    await prisma.ledgerEntry.createMany({
      data: [
        { id: 'proof-filter-with', monthId: month.id, date: new Date('2026-06-02'), description: 'Bi BBM', categoryId: category.id, type: 'EXPENSE', amount: 15000, proofImagePath: 'ledger-proofs/proof.png' },
        { id: 'proof-filter-without', monthId: month.id, date: new Date('2026-06-03'), description: 'Bi makan', categoryId: category.id, type: 'EXPENSE', amount: 25000 }
      ]
    });

    const withProof = await request(app).get(`/api/months/${month.id}/ledger?proof=with`).expect(200);
    expect(withProof.body.total).toBe(1);
    expect(withProof.body.ledger[0]).toMatchObject({ id: 'proof-filter-with', proofImageUrl: '/uploads/ledger-proofs/proof.png' });

    const withoutProof = await request(app).get(`/api/months/${month.id}/ledger?proof=without`).expect(200);
    expect(withoutProof.body.total).toBe(1);
    expect(withoutProof.body.ledger[0].id).toBe('proof-filter-without');
  });

  it('blocks ledger mutations when the month is locked', async () => {
    const month = await createJune();
    const category = await bootstrapCategory('EXPENSE');
    await request(app).patch(`/api/months/${month.id}`).send({ status: 'LOCKED' }).expect(200);
    await request(app).post(`/api/months/${month.id}/ledger`).send({
      date: '2026-06-02',
      description: 'Bi BBM',
      categoryId: category.id,
      type: 'EXPENSE',
      amount: 15000
    }).expect(400);
  });

  it('updates ledger rows while the month is draft', async () => {
    const month = await createJune(1000);
    const incomeCategory = await bootstrapCategory('INCOME');
    const expenseCategory = await bootstrapCategory('EXPENSE');
    const created = await request(app).post(`/api/months/${month.id}/ledger`).send({
      date: '2026-06-02',
      proofNo: '2',
      description: 'Bi BBM',
      categoryId: expenseCategory.id,
      type: 'EXPENSE',
      amount: 250
    }).expect(200);

    await request(app).put(`/api/ledger/${created.body.entry.id}`).send({
      date: '2026-06-03',
      proofNo: '3',
      description: 'Dana masuk koreksi',
      categoryId: incomeCategory.id,
      type: 'INCOME',
      amount: 500
    }).expect(200);

    const payload = await request(app).get(`/api/months/${month.id}`).expect(200);
    expect(payload.body.summary).toMatchObject({ totalIncome: 500, totalExpense: 0, closingBalance: 1500 });
    expect(payload.body.ledger[0]).toMatchObject({ date: '2026-06-03', proofNo: '3', description: 'Dana masuk koreksi', type: 'INCOME' });
  });

  it('uploads, replaces, rejects, and deletes ledger proof images', async () => {
    const month = await createJune();
    const category = await bootstrapCategory('EXPENSE');
    const created = await request(app).post(`/api/months/${month.id}/ledger`).send({
      date: '2026-06-02',
      description: 'Bi BBM',
      categoryId: category.id,
      type: 'EXPENSE',
      amount: 15000
    }).expect(200);
    const entryId = created.body.entry.id;

    const uploaded = await request(app)
      .post(`/api/ledger/${entryId}/proof`)
      .attach('proof', Buffer.from('image-one'), { filename: 'proof.png', contentType: 'image/png' })
      .expect(200);
    expect(uploaded.body.entry).toMatchObject({ proofImageName: 'proof.png', proofImageMime: 'image/png', proofImageSize: 9 });
    expect(uploaded.body.entry.proofImageUrl).toContain('/uploads/ledger-proofs/');

    await request(app)
      .post(`/api/ledger/${entryId}/proof`)
      .attach('proof', Buffer.from('not-image'), { filename: 'proof.txt', contentType: 'text/plain' })
      .expect(400);

    const replaced = await request(app)
      .post(`/api/ledger/${entryId}/proof`)
      .attach('proof', Buffer.from('image-two'), { filename: 'proof.webp', contentType: 'image/webp' })
      .expect(200);
    expect(replaced.body.entry).toMatchObject({ proofImageName: 'proof.webp', proofImageMime: 'image/webp' });

    const payload = await request(app).get(`/api/months/${month.id}`).expect(200);
    expect(payload.body.ledger[0].proofImageUrl).toContain('/uploads/ledger-proofs/');

    await request(app).delete(`/api/ledger/${entryId}/proof`).expect(200);
    const cleared = await prisma.ledgerEntry.findUniqueOrThrow({ where: { id: entryId } });
    expect(cleared.proofImagePath).toBeNull();
  });

  it('creates, toggles, and deletes kasbon', async () => {
    const month = await createJune();
    const created = await request(app).post(`/api/months/${month.id}/kasbon`).send({
      date: '2026-06-02',
      person: 'Dafa',
      description: 'Kasbon BBM',
      amount: 50000
    }).expect(200);
    expect(created.body.item.status).toBe('UNPAID');

    await request(app).patch(`/api/kasbon/${created.body.item.id}`).send({ status: 'PAID' }).expect(200);
    expect((await prisma.cashAdvance.findUniqueOrThrow({ where: { id: created.body.item.id } })).status).toBe('PAID');

    await request(app).delete(`/api/kasbon/${created.body.item.id}`).expect(200);
    expect(await prisma.cashAdvance.count()).toBe(0);
  });

  it('paginates, searches, and filters kasbon rows', async () => {
    const month = await createJune();
    await prisma.cashAdvance.createMany({
      data: [
        { id: 'kasbon-page-1', monthId: month.id, date: new Date('2026-06-01'), person: 'Dafa', description: 'Kasbon BBM', amount: 50000, status: 'UNPAID', proofImagePath: 'kasbon-proofs/proof.png' },
        { id: 'kasbon-page-2', monthId: month.id, date: new Date('2026-06-02'), person: 'Ridwan', description: 'Kasbon makan', amount: 25000, status: 'PAID' },
        ...Array.from({ length: 24 }, (_, index) => ({
          id: `kasbon-page-extra-${index + 3}`,
          monthId: month.id,
          date: new Date(`2026-06-${String(index + 3).padStart(2, '0')}`),
          person: `Person ${index + 3}`,
          description: `Kasbon kecil ${index + 3}`,
          amount: 1000,
          status: 'UNPAID' as const
        }))
      ]
    });

    const pageTwo = await request(app).get(`/api/months/${month.id}/kasbon?page=2&limit=25`).expect(200);
    expect(pageTwo.body).toMatchObject({ page: 2, limit: 25, total: 26, totalPages: 2 });
    expect(pageTwo.body.cashAdvances).toHaveLength(1);

    const search = await request(app).get(`/api/months/${month.id}/kasbon?search=ridwan`).expect(200);
    expect(search.body.total).toBe(1);
    expect(search.body.cashAdvances[0]).toMatchObject({ person: 'Ridwan', status: 'PAID' });

    const paid = await request(app).get(`/api/months/${month.id}/kasbon?status=PAID`).expect(200);
    expect(paid.body.total).toBe(1);

    const withProof = await request(app).get(`/api/months/${month.id}/kasbon?proof=with`).expect(200);
    expect(withProof.body.total).toBe(1);
    expect(withProof.body.cashAdvances[0]).toMatchObject({ id: 'kasbon-page-1', proofImageUrl: '/uploads/kasbon-proofs/proof.png' });
  });

  it('updates kasbon rows while the month is draft', async () => {
    const month = await createJune();
    const created = await request(app).post(`/api/months/${month.id}/kasbon`).send({
      date: '2026-06-02',
      person: 'Dafa',
      description: 'Kasbon BBM',
      amount: 50000
    }).expect(200);

    await request(app).put(`/api/kasbon/${created.body.item.id}`).send({
      date: '2026-06-03',
      person: 'Ridwan',
      description: 'Kasbon makan',
      amount: 75000,
      status: 'PAID'
    }).expect(200);

    const payload = await request(app).get(`/api/months/${month.id}/kasbon`).expect(200);
    expect(payload.body.cashAdvances[0]).toMatchObject({ date: '2026-06-03', person: 'Ridwan', description: 'Kasbon makan', amount: 75000, status: 'PAID' });
  });

  it('uploads, replaces, rejects, and deletes kasbon proof images', async () => {
    const month = await createJune();
    const created = await request(app).post(`/api/months/${month.id}/kasbon`).send({
      date: '2026-06-02',
      person: 'Dafa',
      description: 'Kasbon BBM',
      amount: 50000
    }).expect(200);
    const kasbonId = created.body.item.id;

    const uploaded = await request(app)
      .post(`/api/kasbon/${kasbonId}/proof`)
      .attach('proof', Buffer.from('image-one'), { filename: 'kasbon.png', contentType: 'image/png' })
      .expect(200);
    expect(uploaded.body.item).toMatchObject({ proofImageName: 'kasbon.png', proofImageMime: 'image/png', proofImageSize: 9 });
    expect(uploaded.body.item.proofImageUrl).toContain('/uploads/kasbon-proofs/');

    await request(app)
      .post(`/api/kasbon/${kasbonId}/proof`)
      .attach('proof', Buffer.from('not-image'), { filename: 'proof.txt', contentType: 'text/plain' })
      .expect(400);

    const replaced = await request(app)
      .post(`/api/kasbon/${kasbonId}/proof`)
      .attach('proof', Buffer.from('image-two'), { filename: 'kasbon.webp', contentType: 'image/webp' })
      .expect(200);
    expect(replaced.body.item).toMatchObject({ proofImageName: 'kasbon.webp', proofImageMime: 'image/webp' });

    await request(app).delete(`/api/kasbon/${kasbonId}/proof`).expect(200);
    const cleared = await prisma.cashAdvance.findUniqueOrThrow({ where: { id: kasbonId } });
    expect(cleared.proofImagePath).toBeNull();
  });

  it('blocks kasbon mutations when the month is locked', async () => {
    const month = await createJune();
    const created = await request(app).post(`/api/months/${month.id}/kasbon`).send({
      date: '2026-06-02',
      person: 'Dafa',
      description: 'Kasbon BBM',
      amount: 50000
    }).expect(200);
    await request(app).patch(`/api/months/${month.id}`).send({ status: 'LOCKED' }).expect(200);

    await request(app).post(`/api/months/${month.id}/kasbon`).send({
      date: '2026-06-03',
      person: 'Ridwan',
      description: 'Kasbon makan',
      amount: 25000
    }).expect(400);
    await request(app).patch(`/api/kasbon/${created.body.item.id}`).send({ status: 'PAID' }).expect(400);
    await request(app).put(`/api/kasbon/${created.body.item.id}`).send({
      date: '2026-06-03',
      person: 'Ridwan',
      description: 'Kasbon makan',
      amount: 75000,
      status: 'PAID'
    }).expect(400);
    await request(app).delete(`/api/kasbon/${created.body.item.id}`).expect(400);
    await request(app)
      .post(`/api/kasbon/${created.body.item.id}/proof`)
      .attach('proof', Buffer.from('image-one'), { filename: 'kasbon.png', contentType: 'image/png' })
      .expect(400);
  });

  it('imports the June sheet CSV through cutoff and preserves known totals', async () => {
    const month = await createJune();
    await request(app).get('/api/bootstrap').expect(200);
    const csv = [
      'Tanggal,No.Bukti,Keterangan,, Jumlah ,,Saldo',
      ',,,, Penerimaan , Pengeluaran ,',
      ',,Saldo Awal,,"1,596,761",,',
      '02-juni,1,Bi BBM,transportasi,,15000,"1,581,761"',
      '03-juni,2,Dana Masuk Operasional,dana masuk,2000000,,"3,581,761"',
      '11-juni,9,Bi sangu,sangu,,50000,"3,531,761"',
      '12-juni,10,Should not import,Material,,10000,"3,521,761"',
      ',,,,0,0,0',
      '02- juni,,cod nia,,,"23,000",'
    ].join('\n');

    const res = await request(app).post(`/api/months/${month.id}/import-csv`).send({ csv, cutoff: '2026-06-11' }).expect(200);
    expect(res.body.imported).toBe(3);
    const payload = await request(app).get(`/api/months/${month.id}`).expect(200);
    expect(payload.body.summary.totalIncome).toBe(2000000);
    expect(payload.body.summary.totalExpense).toBe(65000);
    expect(payload.body.summary.closingBalance).toBe(3531761);
  });

  it('cascades month deletion to ledger and kasbon records', async () => {
    const month = await createJune();
    const category = await bootstrapCategory('EXPENSE');
    await prisma.ledgerEntry.create({ data: { id: 'entry-cascade', monthId: month.id, date: new Date('2026-06-02'), description: 'Bi BBM', categoryId: category.id, type: 'EXPENSE', amount: 10000 } });
    await prisma.cashAdvance.create({ data: { id: 'kasbon-cascade', monthId: month.id, date: new Date('2026-06-02'), person: 'Dafa', description: 'Kasbon', amount: 10000 } });
    await prisma.month.delete({ where: { id: month.id } });
    expect(await prisma.ledgerEntry.count()).toBe(0);
    expect(await prisma.cashAdvance.count()).toBe(0);
  });
});
