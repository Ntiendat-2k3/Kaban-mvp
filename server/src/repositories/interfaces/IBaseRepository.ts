export interface IBaseRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(filter?: Record<string, unknown>): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

