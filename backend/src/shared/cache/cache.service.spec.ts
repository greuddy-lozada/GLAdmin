import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    delete process.env.REDIS_URL;
    service = new CacheService();
    service.onModuleInit();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('debe set/get un valor', async () => {
    await service.set('k', { a: 1 }, 60);
    await expect(service.get<{ a: number }>('k')).resolves.toEqual({ a: 1 });
  });

  it('debe retornar null si la clave no existe', async () => {
    await expect(service.get('missing')).resolves.toBeNull();
  });

  it('debe expirar entradas en memoria', async () => {
    await service.set('ttl', 'x', 0);
    // expiresAt = now + 0 → inmediato
    await expect(service.get('ttl')).resolves.toBeNull();
  });

  it('debe borrar por clave y por prefijo', async () => {
    await service.set('products:list:1:1', [1], 60);
    await service.set('products:list:1:2', [2], 60);
    await service.set('other', 3, 60);
    await service.delByPrefix('products:list:1:');
    await expect(service.get('products:list:1:1')).resolves.toBeNull();
    await expect(service.get('products:list:1:2')).resolves.toBeNull();
    await expect(service.get('other')).resolves.toBe(3);
    await service.del('other');
    await expect(service.get('other')).resolves.toBeNull();
  });
});
