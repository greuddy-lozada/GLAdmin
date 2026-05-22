export interface IRepository<T> {
  findAll(filter?: Record<string, unknown>): Promise<T[]>;
  findById(id: number): Promise<T | null>;
  findOne(filter: Record<string, unknown>): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: number, data: Partial<T>): Promise<T>;
  delete(id: number): Promise<T>;
  count(filter?: Record<string, unknown>): Promise<number>;
}
