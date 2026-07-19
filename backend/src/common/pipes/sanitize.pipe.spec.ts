import { ArgumentMetadata } from '@nestjs/common';
import { SanitizePipe } from './sanitize.pipe';

describe('SanitizePipe', () => {
  const pipe = new SanitizePipe();
  const bodyMeta = { type: 'body' } as ArgumentMetadata;
  const paramMeta = { type: 'param' } as ArgumentMetadata;

  it('debe hacer trim de strings y eliminar null bytes', () => {
    const result = pipe.transform(
      { name: '  hola\0 mundo  ', count: 1 },
      bodyMeta,
    );
    expect(result).toEqual({ name: 'hola mundo', count: 1 });
  });

  it('debe sanitizar recursivamente objetos anidados y arrays', () => {
    const result = pipe.transform(
      {
        items: [{ label: '  a  ' }, { label: 'b\0' }],
        nested: { note: '  x  ' },
      },
      bodyMeta,
    );
    expect(result).toEqual({
      items: [{ label: 'a' }, { label: 'b' }],
      nested: { note: 'x' },
    });
  });

  it('NO debe tocar campos de password/token/secret', () => {
    const input = {
      password: '  secret  ',
      newPassword: '  abc  ',
      token: '  tok  ',
      email: '  a@b.com  ',
    };
    const result = pipe.transform(input, bodyMeta) as typeof input;
    expect(result.password).toBe('  secret  ');
    expect(result.newPassword).toBe('  abc  ');
    expect(result.token).toBe('  tok  ');
    expect(result.email).toBe('a@b.com');
  });

  it('debe ignorar params (solo body y query)', () => {
    const result = pipe.transform({ id: '  x  ' }, paramMeta);
    expect(result).toEqual({ id: '  x  ' });
  });
});
