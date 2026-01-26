import { describe, it, expect } from 'vitest';
import { validateProfile } from '../lib/validators';

describe('Validaciones de Perfil', () => {
  const validBase = {
    displayName: "Juan Perez",
    phone: "1122334455",
    dni: "12345678",
    age: "30"
  };

  // --- PRUEBAS DE DNI ---
  it('debe rechazar DNI con letras', () => {
    const result = validateProfile({ ...validBase, dni: "12345ABC" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("DNI");
  });

  it('debe rechazar DNI muy corto', () => {
    const result = validateProfile({ ...validBase, dni: "123" });
    expect(result.success).toBe(false);
  });

  it('debe rechazar DNI muy largo', () => {
    const result = validateProfile({ ...validBase, dni: "1234567890123" });
    expect(result.success).toBe(false);
  });

  it('debe aceptar DNI válido', () => {
    const result = validateProfile({ ...validBase, dni: "98765432" });
    expect(result.success).toBe(true);
  });

  // --- PRUEBAS DE EDAD ---
  it('debe rechazar edad no numérica', () => {
    const result = validateProfile({ ...validBase, age: "veinte" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("edad");
  });

  it('debe rechazar edad menor a 10', () => {
    const result = validateProfile({ ...validBase, age: "5" });
    expect(result.success).toBe(false);
  });

  it('debe rechazar edad mayor a 120', () => {
    const result = validateProfile({ ...validBase, age: "150" });
    expect(result.success).toBe(false);
  });
});

