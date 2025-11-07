const { z } = require('zod');
const rx = require('../src/utils/regex');

const emailZ = z.string().email('Invalid email format');
const passwordZ = z.string().regex(rx.password, 'Password must be 8+ chars with letters and numbers');
const fullNameZ = z.string().regex(rx.fullName, 'Enter a valid full name');
const saIdZ = z.string().regex(rx.saId, 'SA ID must be 13 digits');
const accountZ = z.string().regex(rx.accountNumber, 'Account number must be 8–16 digits');
const swiftZ = z.string().regex(rx.swift, 'SWIFT must be 8 or 11 chars').transform(s => s.toUpperCase());
const currencyZ = z.enum(['ZAR', 'USD', 'EUR', 'GBP'], { errorMap: () => ({ message: 'Currency must be ZAR, USD, EUR or GBP' }) });

const registerSchema = z.object({
  email: emailZ,
  password: passwordZ,
  fullName: fullNameZ,
  saId: saIdZ,
  accountNumber: accountZ
});

const loginSchema = z.object({
  email: emailZ,
  password: z.string().min(1, 'Password is required')
});

const amountCentsUnion = z.union([
  z.string().regex(rx.amountCents, 'amountCents must be an integer in cents').transform(s => parseInt(s, 10)),
  z.number().int('amountCents must be an integer').transform(n => n)
]);

const createPaymentSchema = z.object({
  amountCents: amountCentsUnion.refine(v => v > 0 && v <= 100_000_000, 'amountCents out of range'),
  currency: currencyZ,
  swift: swiftZ,
  accountTo: accountZ,
  purpose: z.string().max(255).optional().default('')
});

const verifyPaymentSchema = z.object({
  paymentId: z.string().regex(/^\d+$/, 'paymentId must be numeric')
});

const submitPaymentSchema = z.object({
  paymentId: z.string().regex(/^\d+$/, 'paymentId must be numeric'),
  swiftRef: z.string().min(3).max(128)
});

const transactionVerifySchema = z.object({
  accountNumber: accountZ,
  swift: swiftZ,
  currency: currencyZ
});

const transactionSubmitSchema = z.object({
  accountNumber: accountZ,
  swift: swiftZ,
  currency: currencyZ,
  amount: z.preprocess(
    v => (typeof v === 'string' ? Number(v) : v),
    z.number({ invalid_type_error: 'Amount must be a number' }).positive('Enter a positive amount')
  ),
  description: z.string().max(200, 'Description must be 200 characters or fewer').optional().default('')
});

module.exports = {
  registerSchema,
  loginSchema,
  createPaymentSchema,
  verifyPaymentSchema,
  submitPaymentSchema,
  transactionVerifySchema,
  transactionSubmitSchema
};
