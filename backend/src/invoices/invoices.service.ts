import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { Kysely } from 'kysely';
import { DB_TOKEN } from '../database/database.module';
import { StorageService } from '../common/storage.service';
import { NotificationsService } from '../common/notifications.service';
import { AuditService } from '../common/audit.service';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, format } from 'date-fns';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');

function easterMonday(year: number): Date {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  const easter = new Date(year, month - 1, day);
  easter.setDate(easter.getDate() + 1); // lundi de Pâques
  return easter;
}

function frenchPublicHolidays(year: number): Set<string> {
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const em = easterMonday(year);
  const ascension = new Date(em); ascension.setDate(em.getDate() + 38); // jeudi Ascension = lundi Pâques + 38j (Easter Sunday + 39 = +38 from monday)
  const whit = new Date(em); whit.setDate(em.getDate() + 49);           // lundi Pentecôte
  return new Set([
    `${year}-01-01`, `${year}-05-01`, `${year}-05-08`,
    `${year}-07-14`, `${year}-08-15`,
    `${year}-11-01`, `${year}-11-11`, `${year}-12-25`,
    fmt(em), fmt(ascension), fmt(whit),
  ]);
}

interface InvoiceLine {
  key: string;
  label: string;
  qty: number;
  unit_price: number;
  total: number;
  unit?: string;
  info?: boolean;
  editable?: boolean;
}

@Injectable()
export class InvoicesService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: Kysely<any>,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  async findAll(filters: { driverId?: string; status?: string; from?: string; to?: string; month?: string }) {
    let q = this.db
      .selectFrom('invoices as i')
      .leftJoin('drivers as d', 'd.id', 'i.driver_id')
      .select([
        'i.id', 'i.invoice_number', 'i.period_start', 'i.period_end',
        'i.amount_ht', 'i.amount_ttc', 'i.net_amount', 'i.status',
        'i.month', 'i.km_total', 'i.vehicle_rental', 'i.advance_repayment',
        'i.on_call_hours', 'i.created_at',
        'd.full_name as driver_name', 'd.driver_number',
      ]);

    if (filters.driverId) q = q.where('i.driver_id', '=', filters.driverId);
    if (filters.status)   q = q.where('i.status', '=', filters.status as any);
    if (filters.month)    q = q.where('i.month', '=', filters.month);
    if (filters.from)     q = q.where('i.period_start', '>=', filters.from as any);
    if (filters.to)       q = q.where('i.period_end', '<=', filters.to as any);

    return q.orderBy('i.created_at', 'desc').execute();
  }

  async findOne(id: string) {
    const invoice = await this.db
      .selectFrom('invoices as i')
      .leftJoin('drivers as d', 'd.id', 'i.driver_id')
      .selectAll()
      .where('i.id', '=', id)
      .executeTakeFirst();
    if (!invoice) throw new NotFoundException('Facture introuvable');
    return invoice;
  }

  async generateMonthly(month?: string, driverId?: string, from?: string, to?: string) {
    let start: Date, end: Date, derivedMonth: string;
    if (from && to) {
      start = startOfDay(new Date(from));
      end   = endOfDay(new Date(to));
      derivedMonth = format(start, 'yyyy-MM');
    } else if (month) {
      const [y, m] = month.split('-').map(Number);
      start = startOfMonth(new Date(y, m - 1, 1));
      end   = endOfMonth(start);
      derivedMonth = month;
    } else {
      throw new Error('month ou from+to requis');
    }
    const [year, mon] = derivedMonth.split('-').map(Number);

    const config = await this.db
      .selectFrom('pricing_config')
      .selectAll()
      .where('active', '=', true)
      .orderBy('created_at', 'desc')
      .limit(1)
      .executeTakeFirst();

    if (!config) throw new ConflictException('Aucune configuration tarifaire active');

    const driversToProcess = driverId
      ? [await this.db.selectFrom('drivers').selectAll().where('id', '=', driverId).executeTakeFirst()]
      : await this.db.selectFrom('drivers').selectAll().where('active', '=', true).execute();

    const results: any[] = [];
    for (const driver of driversToProcess) {
      if (!driver) continue;

      const existing = await this.db
        .selectFrom('invoices')
        .select('id')
        .where('driver_id', '=', driver.id)
        .where('month', '=', derivedMonth)
        .executeTakeFirst();
      if (existing) { results.push({ id: existing.id, skipped: true, reason: 'already_exists' }); continue; }

      const trips = await this.db
        .selectFrom('trips')
        .selectAll()
        .where('driver_id', '=', driver.id)
        .where('status', '=', 'completed')
        .where('scheduled_at', '>=', start)
        .where('scheduled_at', '<=', end)
        .execute();

      const holidays = frenchPublicHolidays(year);
      let nFullhourWeekday = 0, nAfter19hWeekday = 0, nAstreinteTrip = 0, nSaturday = 0, nSunday = 0, nPublicHoliday = 0;
      for (const trip of trips) {
        const d = new Date(trip.scheduled_at);
        const dow = d.getDay();
        const dateKey = format(d, 'yyyy-MM-dd');
        if (trip.astreinte) { nAstreinteTrip++; continue; }
        if (holidays.has(dateKey)) { nPublicHoliday++; continue; }
        if (dow === 0) { nSunday++; continue; }
        if (dow === 6) { nSaturday++; continue; }
        if (d.getHours() >= 19) { nAfter19hWeekday++; continue; }
        nFullhourWeekday++;
      }

      const mileage = await this.db
        .selectFrom('driver_mileages')
        .selectAll()
        .where('driver_id', '=', driver.id)
        .where('month', '=', derivedMonth)
        .executeTakeFirst();
      const kmTotal = (mileage?.km_end != null && mileage?.km_start != null)
        ? (mileage.km_end - mileage.km_start) : 0;
      const kmOver = Math.max(0, kmTotal - Number(config.km_threshold));

      const lineItems: InvoiceLine[] = [
        { key: 'astreinte_hours',  label: 'Heures d\'astreinte',          qty: 0,                  unit_price: Number(config.astreinte_hourly_rate),  total: 0,                                          unit: 'h',  editable: true },
        { key: 'fullhour_weekday', label: 'Trajets HP semaine (6h–19h)',  qty: nFullhourWeekday,   unit_price: Number(config.fullhour_weekday_rate),   total: nFullhourWeekday * Number(config.fullhour_weekday_rate) },
        { key: 'after19h_weekday', label: 'Trajets après 19h semaine',    qty: nAfter19hWeekday,   unit_price: Number(config.after19h_weekday_rate),   total: nAfter19hWeekday * Number(config.after19h_weekday_rate) },
        { key: 'astreinte_trip',   label: 'Trajets en astreinte',         qty: nAstreinteTrip,     unit_price: Number(config.astreinte_trip_rate),     total: nAstreinteTrip * Number(config.astreinte_trip_rate) },
        { key: 'saturday',         label: 'Trajets samedi',               qty: nSaturday,          unit_price: Number(config.saturday_rate),           total: nSaturday * Number(config.saturday_rate) },
        { key: 'sunday',           label: 'Trajets dimanche',             qty: nSunday,            unit_price: Number(config.sunday_rate),             total: nSunday * Number(config.sunday_rate) },
        { key: 'public_holiday',   label: 'Trajets jours fériés',        qty: nPublicHoliday,     unit_price: Number(config.public_holiday_rate),    total: nPublicHoliday * Number(config.public_holiday_rate) },
        { key: 'km_total',         label: 'Kilométrage mensuel',          qty: kmTotal,            unit_price: 0,                                      total: 0,  unit: 'km', info: true },
        { key: 'km_surcharge',     label: `Surcharge km (>${config.km_threshold} km)`, qty: kmOver, unit_price: Number(config.km_surcharge_per_km), total: kmOver * Number(config.km_surcharge_per_km) },
        { key: 'management_fee',   label: 'Frais de gestion mensuels',   qty: 1,                  unit_price: Number(config.management_fee),          total: Number(config.management_fee) },
      ];

      const subtotal = lineItems.filter(li => !li.info).reduce((s, li) => s + li.total, 0);

      const seq = String(
        (Number(
          (await this.db.selectFrom('invoices').select(this.db.fn.count<number>('id').as('c')).executeTakeFirst() as any).c
        ) || 0) + 1
      ).padStart(4, '0');
      // Format court pour respecter VARCHAR(30) : RET-YYYY-MM ou RET-MMDD-MMDD
      const periodTag = (from && to)
        ? `${from.slice(5).replace('-', '')}${to.slice(5).replace('-', '')}`  // ex: 05180518
        : `${year}-${String(mon).padStart(2, '0')}`;
      const invoiceNumber = `RET-${periodTag}-${driver.driver_number}`;

      const [invoice] = await this.db
        .insertInto('invoices')
        .values({
          invoice_number: invoiceNumber,
          driver_id: driver.id,
          period_start: format(start, 'yyyy-MM-dd'),
          period_end: format(end, 'yyyy-MM-dd'),
          month: derivedMonth,
          trip_ids: trips.map(t => t.id),
          amount_ht: subtotal,
          amount_ttc: subtotal,
          net_amount: subtotal,
          km_total: kmTotal,
          line_items: JSON.stringify(lineItems),
          pricing_config_id: config.id,
          status: 'draft',
        })
        .returning(['id', 'invoice_number', 'status', 'net_amount', 'month'])
        .execute();

      results.push(invoice);
    }

    return { generated: results.filter(r => !r.skipped).length, skipped: results.filter(r => r.skipped).length, invoices: results };
  }

  async updateDraft(id: string, dto: { on_call_hours?: number; vehicle_rental?: boolean; advance_repayment?: number; notes?: string }) {
    const invoice = await this.db
      .selectFrom('invoices')
      .selectAll()
      .where('id', '=', id)
      .where('status', '=', 'draft')
      .executeTakeFirst();
    if (!invoice) throw new NotFoundException('Facture brouillon introuvable');

    const lineItems: InvoiceLine[] = (invoice.line_items as InvoiceLine[]) || [];

    if (dto.on_call_hours !== undefined) {
      const idx = lineItems.findIndex(li => li.key === 'astreinte_hours');
      if (idx >= 0) {
        lineItems[idx].qty = dto.on_call_hours;
        lineItems[idx].total = dto.on_call_hours * lineItems[idx].unit_price;
      }
    }

    const subtotal = lineItems.filter(li => !li.info).reduce((s, li) => s + li.total, 0);

    const vehicleRental = dto.vehicle_rental !== undefined ? dto.vehicle_rental : invoice.vehicle_rental;
    const advanceRepayment = dto.advance_repayment !== undefined ? Number(dto.advance_repayment) : Number(invoice.advance_repayment || 0);

    let vRentalAmount = 0;
    if (vehicleRental && invoice.pricing_config_id) {
      const cfg = await this.db
        .selectFrom('pricing_config')
        .select('vehicle_rental_forfait')
        .where('id', '=', invoice.pricing_config_id)
        .executeTakeFirst();
      vRentalAmount = cfg ? Number(cfg.vehicle_rental_forfait) : 0;
    }

    const amountHt = subtotal + vRentalAmount;
    const netAmount = amountHt - advanceRepayment;

    const [updated] = await this.db
      .updateTable('invoices')
      .set({
        line_items: JSON.stringify(lineItems),
        vehicle_rental: vehicleRental,
        advance_repayment: advanceRepayment,
        amount_ht: amountHt,
        amount_ttc: amountHt,
        net_amount: netAmount,
        ...(dto.on_call_hours !== undefined ? { on_call_hours: dto.on_call_hours } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      })
      .where('id', '=', id)
      .returningAll()
      .execute();

    return updated;
  }

  async validate(id: string, validatedBy: string) {
    const [invoice] = await this.db
      .updateTable('invoices')
      .set({ status: 'validated', validated_by: validatedBy, validated_at: new Date() })
      .where('id', '=', id)
      .returning(['id', 'invoice_number', 'status', 'driver_id', 'net_amount', 'month'])
      .execute();
    if (!invoice) throw new NotFoundException('Facture introuvable');
    await this.notifyDriver((invoice as any).driver_id, 'Facture validée', `Votre facture ${invoice.invoice_number} a été validée.`);
    await this.audit.log({
      entityType: 'invoice', entityId: id,
      action: 'invoice_validated',
      performedBy: validatedBy,
      before: { status: 'draft' },
      after:  { status: 'validated', invoice_number: invoice.invoice_number, net_amount: invoice.net_amount, month: invoice.month },
    });
    return invoice;
  }

  async markPaid(id: string, performedBy?: string) {
    const [invoice] = await this.db
      .updateTable('invoices')
      .set({ status: 'paid', paid_at: new Date() })
      .where('id', '=', id)
      .returning(['id', 'invoice_number', 'status', 'driver_id', 'net_amount', 'month'])
      .execute();
    if (!invoice) throw new NotFoundException('Facture introuvable');
    await this.notifyDriver((invoice as any).driver_id, 'Paiement en cours', `Votre facture ${invoice.invoice_number} est mise en paiement.`);
    await this.audit.log({
      entityType: 'invoice', entityId: id,
      action: 'invoice_paid',
      performedBy,
      before: { status: 'validated' },
      after:  { status: 'paid', invoice_number: invoice.invoice_number, net_amount: invoice.net_amount, month: invoice.month },
    });
    return invoice;
  }

  async getPricingConfig() {
    return this.db
      .selectFrom('pricing_config')
      .selectAll()
      .where('active', '=', true)
      .orderBy('created_at', 'desc')
      .limit(1)
      .executeTakeFirst();
  }

  async updatePricingConfig(dto: Record<string, any>) {
    const existing = await this.db
      .selectFrom('pricing_config')
      .select('id')
      .where('active', '=', true)
      .orderBy('created_at', 'desc')
      .limit(1)
      .executeTakeFirst();

    if (existing) {
      return this.db
        .updateTable('pricing_config')
        .set(dto)
        .where('id', '=', existing.id)
        .returningAll()
        .executeTakeFirst();
    }

    return this.db
      .insertInto('pricing_config')
      .values({ ...dto, active: true })
      .returningAll()
      .executeTakeFirst();
  }

  private async notifyDriver(driverId: string, title: string, body: string) {
    if (!driverId) return;
    const driver = await this.db.selectFrom('drivers').select('fcm_token').where('id', '=', driverId).executeTakeFirst();
    if (driver?.fcm_token) await this.notifications.sendToDevice(driver.fcm_token, title, body);
  }

  async getPdf(id: string) {
    const invoice = await this.db
      .selectFrom('invoices as i')
      .leftJoin('drivers as d', 'd.id', 'i.driver_id')
      .selectAll()
      .where('i.id', '=', id)
      .executeTakeFirst();
    if (!invoice) throw new NotFoundException('Facture introuvable');

    const lines: InvoiceLine[] = (invoice.line_items as InvoiceLine[]) || [];
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    doc.fontSize(16).font('Helvetica-Bold').text('TAXI VANILLE MAYOTTE', { align: 'center' });
    doc.fontSize(11).font('Helvetica').text('Mamoudzou · Mayotte', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica-Bold').text(`Fiche de rétrocession N° ${invoice.invoice_number}`, { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(11).font('Helvetica-Bold').text('Chauffeur :');
    doc.font('Helvetica').text(`${invoice.full_name}  ·  N° ${invoice.driver_number}`);
    doc.text(`Période : ${invoice.period_start} au ${invoice.period_end}`);
    doc.moveDown(1);

    doc.font('Helvetica-Bold').fontSize(10).text('DÉTAIL DU CALCUL');
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(9);
    for (const li of lines) {
      if (li.info) {
        doc.fillColor('#888').text(`  ${li.label} : ${li.qty.toLocaleString('fr-FR')} km`).fillColor('#000');
        continue;
      }
      const row = `  ${li.label}`;
      const detail = li.qty > 0 || li.key === 'management_fee'
        ? `${li.qty} ${li.unit ?? 'trajet(s)'} × ${Number(li.unit_price).toFixed(2)} €`
        : '—';
      const total = `${li.total.toFixed(2)} €`;
      doc.text(`${row}`, { continued: false });
      doc.moveUp().text(total, { align: 'right' });
    }

    if (invoice.vehicle_rental) {
      doc.text(`  Location véhicule`, { continued: false });
      doc.moveUp().text(`${Number(invoice.amount_ht - (invoice.net_amount + Number(invoice.advance_repayment || 0))).toFixed(2)} €`, { align: 'right' });
    }

    doc.moveDown(0.5).strokeColor('#000').moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Sous-total', { continued: false });
    doc.moveUp().text(`${Number(invoice.amount_ht).toFixed(2)} €`, { align: 'right' });
    if (Number(invoice.advance_repayment) > 0) {
      doc.font('Helvetica').fontSize(9);
      doc.text('  Remboursement acompte', { continued: false });
      doc.moveUp().text(`− ${Number(invoice.advance_repayment).toFixed(2)} €`, { align: 'right' });
    }
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('NET À PAYER', { continued: false });
    doc.moveUp().text(`${Number(invoice.net_amount).toFixed(2)} €`, { align: 'right' });

    doc.moveDown(2).font('Helvetica').fontSize(9).fillColor('#666').text(`Statut : ${invoice.status}`);
    doc.text('TVA non applicable — auto-entrepreneur');
    doc.end();

    return { stream: doc, filename: `${invoice.invoice_number}.pdf` };
  }
}
