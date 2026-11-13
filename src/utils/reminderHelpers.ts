import {
  FeeReminderLanguage,
  FeeReminderSettings,
  InstituteConfig,
  StudentRecord
} from '../types';
import { StudentFinancials } from './ledgerHelpers';

export const DEFAULT_FEE_REMINDER_SETTINGS: FeeReminderSettings = {
  monthlyDeadlineDay: 10,
  activeDeadlineDate: '2026-11-10',
  autoTriggerInAppOnLoad: true,
  defaultLanguage: 'Bilingual'
};

export function computeDaysPastDeadline(
  deadlineDate: string,
  referenceDateStr?: string
): number {
  const refStr = referenceDateStr || new Date().toISOString().slice(0, 10);
  const deadlineMs = Date.parse(`${deadlineDate}T00:00:00Z`);
  const refMs = Date.parse(`${refStr}T00:00:00Z`);
  if (Number.isNaN(deadlineMs) || Number.isNaN(refMs)) return 0;
  const diffDays = Math.floor((refMs - deadlineMs) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function buildFeeReminderMessage(
  student: StudentRecord,
  financials: StudentFinancials,
  instituteConfig: InstituteConfig,
  deadlineDate: string,
  daysPastDeadline: number,
  language: FeeReminderLanguage = 'Bilingual'
): string {
  const overdueBadge =
    daysPastDeadline > 0
      ? `${daysPastDeadline} day(s) past deadline (${deadlineDate})`
      : `Due by ${deadlineDate}`;

  const breakdownEn =
    financials.prevYearRemainingDue > 0
      ? `Current Session Due: ₹${financials.currentSessionPending.toLocaleString('en-IN')} + Previous Year Arrears: ₹${financials.prevYearRemainingDue.toLocaleString('en-IN')}`
      : `Current Session Billed Due: ₹${financials.currentSessionPending.toLocaleString('en-IN')}`;

  if (language === 'English') {
    return [
      `*${instituteConfig.name} — Fee Payment Reminder*`,
      `Respected ${student.parentName} ji,`,
      `This is a gentle reminder that tuition fee for *${student.studentName}* (ID: ${student.studentIdCode}, ${student.classLevel} · Batch ${student.batchCode}) has exceeded the payment deadline.`,
      `• *Status:* ${overdueBadge}`,
      `• *Breakdown:* ${breakdownEn}`,
      `• *Total Pending Fee:* ₹${financials.totalCombinedPending.toLocaleString('en-IN')}`,
      `Kindly clear the pending dues at the earliest at our office or via UPI to avoid late academic hold.`,
      `Thank you — *${instituteConfig.founder}* (${instituteConfig.phoneDisplay})`
    ].join('\n');
  }

  if (language === 'Hindi') {
    return [
      `*${instituteConfig.name} — शुल्क भुगतान अनुस्मारक*`,
      `आदरणीय ${student.parentName} जी,`,
      `आपके पाल्य *${student.studentName}* (ID: ${student.studentIdCode}, ${student.classLevel} · बैच ${student.batchCode}) की कोचिंग फीस भुगतान की अंतिम तिथि (${deadlineDate}) निकल चुकी है (${daysPastDeadline} दिन विलंबित)।`,
      `• *बकाया विवरण:* वर्तमान सत्र ₹${financials.currentSessionPending.toLocaleString('en-IN')}${
        financials.prevYearRemainingDue > 0
          ? ` + पिछला सत्र बकाया ₹${financials.prevYearRemainingDue.toLocaleString('en-IN')}`
          : ''
      }`,
      `• *कुल बकाया राशि:* ₹${financials.totalCombinedPending.toLocaleString('en-IN')}`,
      `कृपया शीघ्र कार्यालय या UPI के माध्यम से शुल्क जमा करें।`,
      `सादर — *${instituteConfig.founder}* (${instituteConfig.phoneDisplay})`
    ].join('\n');
  }

  // Bilingual (English + Hindi)
  return [
    `*${instituteConfig.name} — Fee Deadline Reminder / शुल्क अनुस्मारक*`,
    `Respected ${student.parentName} ji,`,
    `Tuition fee for *${student.studentName}* (${student.studentIdCode} · ${student.classLevel}) is *${overdueBadge}*.`,
    `• ${breakdownEn}`,
    `• *Total Overdue Amount / कुल बकाया:* ₹${financials.totalCombinedPending.toLocaleString('en-IN')}`,
    `कृपया ${student.studentName} का बकाया शुल्क शीघ्र जमा करें ताकि पठन-पाठन सुचारू रहे।`,
    `Regards / सादर: *${instituteConfig.founder}* (${instituteConfig.phoneDisplay})`
  ].join('\n');
}

export function buildWhatsAppParentUrl(phone: string, messageText: string): string {
  const digits = phone.replace(/\D/g, '');
  const normalized =
    digits.length === 10
      ? `91${digits}`
      : digits.startsWith('91')
      ? digits
      : digits || '919123456789';
  return `https://wa.me/${normalized}?text=${encodeURIComponent(messageText)}`;
}
