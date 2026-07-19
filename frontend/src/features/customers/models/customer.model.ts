import { z } from 'zod';

export const customerSchema = z
  .object({
    id: z.string(),
    idCardNumber: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    address: z.string().optional().nullable(),
    phoneNumber: z.string().optional().nullable(),
    email: z.string().optional().nullable(),
    available: z.boolean(),
    isWithholdingAgent: z.boolean(),
    withholdingPercentage: z.number().optional().nullable(),
    withholdingProof: z.string().optional().nullable(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

export type Customer = z.infer<typeof customerSchema>;

/** RIF / cédula — mirrors backend CreateCustomerDto */
const idCardRegex = /^[JVEGP]-\d{5,9}-\d{1}$|^[VE]-\d{6,9}$/;

export const createCustomerSchema = z.object({
  idCardNumber: z.string().regex(idCardRegex, 'Invalid RIF/cédula format'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  address: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  isWithholdingAgent: z.boolean().optional(),
  withholdingPercentage: z.number().optional(),
  withholdingProof: z.string().optional(),
});

export type CreateCustomerRequest = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  available: z.boolean().optional(),
});

export type UpdateCustomerRequest = z.infer<typeof updateCustomerSchema>;
