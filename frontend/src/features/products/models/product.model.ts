import { z } from 'zod';

export const productSchema = z
  .object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    price: z.number(),
    dollarPrice: z.number().optional().nullable(),
    baseCost: z.number().optional().nullable(),
    margin: z.number().optional().nullable(),
    idTax: z.string().optional().nullable(),
    idBrand: z.string().optional().nullable(),
    idCategory: z.string().optional().nullable(),
    brand: z
      .object({ id: z.string(), name: z.string() })
      .optional()
      .nullable(),
    category: z
      .object({ id: z.string(), name: z.string() })
      .optional()
      .nullable(),
    observation: z.string().optional().nullable(),
    image: z.string().optional().nullable(),
    available: z.boolean(),
    stock: z.number().optional().nullable(),
    tax: z
      .object({
        id: z.string(),
        name: z.string().nullable().optional(),
        percentage: z.number(),
      })
      .optional()
      .nullable(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .passthrough();

export type Product = z.infer<typeof productSchema>;

export const createProductSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  price: z.number(),
  dollarPrice: z.number().optional(),
  baseCost: z.number().optional(),
  margin: z.number().optional(),
  idTax: z.string().optional(),
  idBrand: z.string().optional(),
  idCategory: z.string().optional(),
  observation: z.string().optional(),
  image: z.string().optional(),
});

export type CreateProductRequest = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial().extend({
  available: z.boolean().optional(),
});

export type UpdateProductRequest = z.infer<typeof updateProductSchema>;
