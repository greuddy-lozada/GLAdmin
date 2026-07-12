export interface IRepository<T> {
  findAll(filter?: Record<string, unknown>): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  findOne(filter: Record<string, unknown>): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<T>;
  count(filter?: Record<string, unknown>): Promise<number>;
}
