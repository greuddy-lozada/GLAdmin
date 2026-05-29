# API Documentation

## Strategy

Use **@nestjs/swagger** to generate OpenAPI 3.1 specs from decorators. Expose the spec via Swagger UI at `/api/docs` in development. In production, serve a static OpenAPI JSON file or use a docs subdomain.

---

## 1. Setup

```bash
cd backend
pnpm add @nestjs/swagger swagger-ui-express
```

### Bootstrap in `main.ts`

```ts
// backend/src/main.ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger (dev only)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('GLAdmin API')
      .setDescription('Gestión Administrativa — ERP API')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(4000);
}
```

Visit `http://localhost:4000/api/docs` for the Swagger UI.

---

## 2. Decorators

### Controller-level

```ts
// src/modules/products/products.controller.ts
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Products')
@ApiBearerAuth('access-token')
@Controller('api/products')
export class ProductsController {}
```

### Endpoint-level

```ts
@Get()
@ApiOperation({ summary: 'List all products', description: 'Returns paginated product list with stock info' })
@ApiOkResponse({ type: ProductResponse, isArray: true })
@ApiQuery({ name: 'page', required: false, type: Number })
@ApiQuery({ name: 'limit', required: false, type: Number })
async findAll(@Query() query: PaginationDto) {
  return this.productsService.findAll(query);
}
```

### DTOs

```ts
// src/modules/products/dto/create-product.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Laptop HP ProBook 450', description: 'Product name' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'LAP-001', description: 'Internal product code' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 1500.00, description: 'Unit price in VED' })
  @IsNumber()
  @Min(0)
  unitPriceVed: number;

  @ApiProperty({ example: 50.00, description: 'Unit price in USD' })
  @IsNumber()
  @Min(0)
  unitPriceUsd: number;

  @ApiProperty({ example: 1, description: 'Category ID' })
  @IsInt()
  @IsOptional()
  categoryId?: number;
}
```

### Response DTOs

```ts
// src/modules/products/dto/product-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ProductResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Laptop HP ProBook 450' })
  name: string;

  @ApiProperty({ example: 'LAP-001' })
  code: string;

  @ApiProperty({ example: 1500.00 })
  unitPriceVed: number;

  @ApiProperty({ example: 50.00 })
  unitPriceUsd: number;

  @ApiProperty({ type: () => CategoryResponse, nullable: true })
  category?: CategoryResponse;
}

export class ApiResponseWrapper<T> {
  @ApiProperty()
  data: T;

  @ApiProperty({ nullable: true, example: null })
  message: string | null;

  @ApiProperty({ nullable: true, example: null })
  errors: unknown;

  @ApiProperty({ example: 200 })
  statusCode: number;
}
```

---

## 3. Envelope consistency

Every response follows the `TransformInterceptor` format:

```json
{
  "data": { ... },
  "message": null,
  "errors": null,
  "statusCode": 200
}
```

Swagger will show this wrapper if you use generic response types:

```ts
// Use ApiExtraModels + refs, or just document the inner type
@ApiOkResponse({ type: ProductResponse })  // documents data field
```

For paginated responses:

```ts
// /api/products?page=1&limit=10
{
  "data": {
    "items": [ ... ],
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

## 4. Generating a static spec file

For CI or frontend type generation:

```bash
# Generate openapi.json at build time
cd backend
node -e "
const { NestFactory } = require('@nestjs/core');
const { SwaggerModule, DocumentBuilder } = require('@nestjs/swagger');
const { AppModule } = require('./dist/src/app.module.js');
(async () => {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder().setTitle('GLAdmin API').setVersion('1.0').build();
  const doc = SwaggerModule.createDocument(app, config);
  require('fs').writeFileSync('./openapi.json', JSON.stringify(doc, null, 2));
  await app.close();
})();
"
```

---

## 5. Frontend type generation

### Option A: orval (recommended)

```bash
cd frontend
pnpm add -D orval
```

```ts
// orval.config.ts
import { defineConfig } from 'orval';

export default defineConfig({
  backend: {
    input: '../backend/openapi.json',
    output: {
      target: './src/lib/api/generated',
      client: 'axios',
      prettier: true,
    },
  },
});
```

Add to `frontend/package.json`:

```json
{
  "scripts": {
    "generate:api": "orval --config orval.config.ts"
  }
}
```

This generates:
- TypeScript interfaces matching backend DTOs
- Axios hooks/ functions for every endpoint
- Auto-complete for request params, response types

### Option B: openapi-typescript

```bash
cd frontend
pnpm add -D openapi-typescript
```

```json
{
  "scripts": {
    "generate:api": "openapi-typescript ../backend/openapi.json -o ./src/lib/api/generated/types.ts"
  }
}
```

Lighter than orval (types only, no hooks), but still prevents drift.

---

## 6. Contract testing

Ensure frontend and backend stay in sync:

```bash
# CI step
pnpm generate:api                # regenerate frontend types
git diff --exit-code              # fail if types changed unexpectedly
```

If the diff is intentional (API change), commit the updated types alongside the backend change.

---

## 7. Endpoint documentation checklist

| Module | Swagger decorated | Notes |
|---|---|---|
| Auth | 🔲 | login, me, refresh, logout, change-password |
| Users | 🔲 | CRUD + isActive toggle |
| Roles | 🔲 | GET list, GET by id |
| Products | 🔲 | CRUD |
| Customers | 🔲 | CRUD |
| Suppliers | 🔲 | CRUD + RIF field |
| Companies | 🔲 | CRUD |
| Taxes | 🔲 | CRUD |
| Batches | 🔲 | CRUD |
| Stocks | 🔲 | CRUD |
| Purchase Orders | 🔲 | CRUD + details |
| Exchange Rates | 🔲 | CRUD + latest |
| Withholdings | 🔲 | CRUD + ISLR/IVA |
| Currencies | 🔲 | GET list |
| Dashboard | 🔲 | stats, analytics |
| Health | 🔲 | GET |
