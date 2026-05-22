export interface IFactory<T, DTO> {
  createFromDto(dto: DTO): T;
  createManyFromDto?(dtos: DTO[]): T[];
}
