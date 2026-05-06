import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DB_TOKEN } from '../database/database.module';
import { StorageService } from '../common/storage.service';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';
import { fr } from 'date-fns/locale';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');

@Injectable()
export class InvoicesService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: Kysely<any>,
    private readonly storage: StorageService,
  ) {}

  async findAll(filters: { driverId?: string; status?: string; from?: string; to?: string }) {
    let q = this.db
      .selectFrom('invoices as i')
      .leftJoin('drivers as d', 'd.id', 'i.driver_id')
      .select(['i.id', 'i.invoice_number', 'i.period_start', 'i.period_end', 'i.amount_ht', 'i.amount_ttc', 'i.status', 'i.created_at', 'd.full_name as driver_name', 'd.driver_number']);

    if (filters.driverId) q = q.where('i.driver_id', '=', filters.driverId);
    if (filters.status) q = q.where('i.status', '=', filters.status as any);
    if (filters.from) q = q.where('i.period_start', '>=', filters.from as any);
    if (filters.to) q = q.where('i.period_end', '<=', filters.to as any);

    return q.orderBy('i.created_at', 'desc').execute();
  }

  async generate(driverId?: string, period: 'weekly' | 'monthly' = 'weekly', dateStr?: string) {
    const date = dateStr ? new Date(dateStr) : new Date();
    const { start, end } = period === 'weekly'
      ? { start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) }
      : { start: startOfMonth(date), end: endOfMonth(date) };

    const driversToProcess = driverId
      ? [await this.db.selectFrom('drivers').selectAll().where('id', '=', driverId).executeTakeFirst()]
      : await this.db.selectFrom('drivers').selectAll().where('active', '=', true).execute();

    const results = [];
    for (const driver of driversToProcess) {
      const trips = await this.db
        .selectFrom('trips')
        .selectAll()
        .where('driver_id', '=', driver.id)
        .where('status', '=', 'completed')
        .where('scheduled_at', '>=', start)
        .where('scheduled_at', '<=', end)
        .execute();

      if (!trips.length) continue;

      const amountHt = trips.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
      const amountTtc = amountHt; // pas de TVA par défaut auto-entrepreneur

      const year = start.getFullYear();
      const count = await this.db
        .selectFrom('invoices')
        .select(this.db.fn.count<number>('id').as('cnt'))
        .where('driver_id', '=', driver.id)
        .executeTakeFirst();

      const seq = String((Number((count as any).cnt) || 0) + 1).padStart(4, '0');
      const invoiceNumber = `TV-${year}-${seq}`;

      const [invoice] = await this.db
        .insertInto('invoices')
        .values({
          invoice_number: invoiceNumber,
          driver_id: driver.id,
          period_start: format(start, 'yyyy-MM-dd'),
          period_end: format(end, 'yyyy-MM-dd'),
          trip_ids: trips.map(t => t.id),
          amount_ht: amountHt,
          amount_ttc: amountTtc,
          status: 'draft',
        })
        .returning(['id', 'invoice_number', 'amount_ttc', 'status'])
        .execute();

      results.push(invoice);
    }

    return { generated: results.length, invoices: results };
  }

  async validate(id: string, validatedBy: string) {
    const [invoice] = await this.db
      .updateTable('invoices')
      .set({ status: 'validated', validated_by: validatedBy, validated_at: new Date() })
      .where('id', '=', id)
      .returning(['id', 'invoice_number', 'status'])
      .execute();
    if (!invoice) throw new NotFoundException('Facture introuvable');
    return invoice;
  }

  async markPaid(id: string) {
    const [invoice] = await this.db
      .updateTable('invoices')
      .set({ status: 'paid', paid_at: new Date() })
      .where('id', '=', id)
      .returning(['id', 'invoice_number', 'status'])
      .execute();
    if (!invoice) throw new NotFoundException('Facture introuvable');
    return invoice;
  }

  async getPdf(id: string) {
    const invoice = await this.db
      .selectFrom('invoices as i')
      .leftJoin('drivers as d', 'd.id', 'i.driver_id')
      .selectAll()
      .where('i.id', '=', id)
      .executeTakeFirst();

    if (!invoice) throw new NotFoundException('Facture introuvable');

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    doc.fontSize(20).font('Helvetica-Bold').text('TAXI VANILLE MAYOTTE', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica').text(`Facture N° ${invoice.invoice_number}`, { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(11).text(`Chauffeur : ${invoice.full_name} (N° ${invoice.driver_number})`);
    doc.text(`Période : du ${invoice.period_start} au ${invoice.period_end}`);
    doc.moveDown(1);
    doc.font('Helvetica-Bold').text(`Montant HT : ${parseFloat(invoice.amount_ht).toFixed(2)} €`);
    doc.text(`Montant TTC : ${parseFloat(invoice.amount_ttc).toFixed(2)} €`);
    doc.moveDown(2);
    doc.font('Helvetica').fontSize(9).fillColor('#666').text(`Statut : ${invoice.status}`);
    doc.end();

    return { stream: doc, filename: `${invoice.invoice_number}.pdf` };
  }
}
