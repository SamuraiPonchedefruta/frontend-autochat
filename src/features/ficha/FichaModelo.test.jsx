/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import FichaModelo from './FichaModelo';
import { obtenerFicha } from './fichaApi';

vi.mock('./fichaApi', () => ({ obtenerFicha: vi.fn() }));

const FICHA = {
  id: 1,
  marca: 'Toyota',
  nombre: 'Hilux',
  consumo: '9 l/100 km',
  mantenimiento: 'Aceite cada 10000 km',
  fallasComunes: 'Desgaste del embrague',
  repuestos: 'Filtro de aire',
  queRevisar: 'Revisar la suspension',
  actualizadoEn: '2026-11-03T18:00:00Z',
};

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe('FichaModelo', () => {
  it('muestra todos los campos de la ficha', async () => {
    obtenerFicha.mockResolvedValue(FICHA);
    render(<FichaModelo idModelo={1} />);

    expect(await screen.findByRole('heading', { name: 'Hilux' })).toBeTruthy();
    expect(screen.getByText('Toyota')).toBeTruthy();
    for (const texto of [
      '9 l/100 km',
      'Aceite cada 10000 km',
      'Desgaste del embrague',
      'Filtro de aire',
      'Revisar la suspension',
    ]) {
      expect(screen.getByText(texto)).toBeTruthy();
    }
    for (const titulo of ['Consumo', 'Mantenimiento', 'Fallas comunes', 'Repuestos', 'Qué revisar']) {
      expect(screen.getByRole('heading', { name: titulo })).toBeTruthy();
    }
    expect(screen.getByText(/Actualizado el/)).toBeTruthy();
  });

  it('avisa cuando un campo no tiene información', async () => {
    obtenerFicha.mockResolvedValue({ ...FICHA, repuestos: null });
    render(<FichaModelo idModelo={1} />);

    expect(await screen.findByText('Sin información todavía.')).toBeTruthy();
  });

  it('muestra un mensaje claro cuando el modelo no existe', async () => {
    obtenerFicha.mockRejectedValue(
      Object.assign(new Error('No encontramos este modelo.'), { tipo: 'no-encontrada' }),
    );
    render(<FichaModelo idModelo={999} />);

    expect((await screen.findByRole('alert')).textContent).toBe('No encontramos este modelo.');
    expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull();
  });

  it('permite reintentar cuando falla la conexión', async () => {
    obtenerFicha.mockRejectedValue(Object.assign(new Error('Sin conexión.'), { tipo: 'red' }));
    render(<FichaModelo idModelo={1} />);

    expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeTruthy();
  });
});
