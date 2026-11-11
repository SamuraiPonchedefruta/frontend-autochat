/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import Calculadora from './Calculadora';
import { calcularTco } from './calculadoraApi';

vi.mock('./calculadoraApi', () => ({ calcularTco: vi.fn() }));

const MODELOS = [
  { id: 1, marca: 'Toyota', nombre: 'Hilux' },
  { id: 2, marca: 'Kia', nombre: 'Rio' },
];

const DATOS = {
  modelo: { id: 1, marca: 'Toyota', nombre: 'Hilux' },
  rubros: [
    { clave: 'combustible', nombre: 'Combustible', monto: 1800 },
    { clave: 'seguro', nombre: 'Seguro', monto: 900 },
    { clave: 'mantenimiento', nombre: 'Mantenimiento', monto: 700 },
    { clave: 'impuestos', nombre: 'Impuestos y placa', monto: 150 },
    { clave: 'depreciacion', nombre: 'Depreciación', monto: 2000 },
  ],
  total: 5550,
  alcance: 'Estimación para uso particular.',
  limitaciones: ['No incluye reparaciones mayores.'],
  fechaDatos: '2026-10-15',
};

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

function elegirModelo(id) {
  fireEvent.change(screen.getByLabelText('Elige un modelo'), { target: { value: String(id) } });
}

describe('Calculadora', () => {
  it('pide elegir un modelo antes de calcular', () => {
    render(<Calculadora modelos={MODELOS} />);

    expect(screen.getByText('Elige un modelo para ver su desglose.')).toBeTruthy();
    expect(calcularTco).not.toHaveBeenCalled();
  });

  it('al elegir un modelo muestra los cinco rubros', async () => {
    calcularTco.mockResolvedValue(DATOS);
    render(<Calculadora modelos={MODELOS} />);

    elegirModelo(1);

    const lista = await screen.findByRole('list', { name: 'Rubros del TCO' });
    expect(within(lista).getAllByRole('listitem')).toHaveLength(5);
    expect(calcularTco.mock.calls[0][0]).toBe('1');
  });

  it('muestra la fecha de los datos', async () => {
    calcularTco.mockResolvedValue(DATOS);
    render(<Calculadora modelos={MODELOS} />);

    elegirModelo(1);

    expect(await screen.findByText(/Datos al.*octubre.*2026/)).toBeTruthy();
  });

  it('muestra el alcance y las limitaciones', async () => {
    calcularTco.mockResolvedValue(DATOS);
    render(<Calculadora modelos={MODELOS} />);

    elegirModelo(1);

    expect(await screen.findByText('Estimación para uso particular.')).toBeTruthy();
    expect(screen.getByText('No incluye reparaciones mayores.')).toBeTruthy();
  });

  it('permite reintentar cuando falla la conexión', async () => {
    calcularTco.mockRejectedValue(Object.assign(new Error('Sin conexión.'), { tipo: 'red' }));
    render(<Calculadora modelos={MODELOS} />);

    elegirModelo(1);

    expect((await screen.findByRole('alert')).textContent).toBe('Sin conexión.');
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeTruthy();
  });

  it('no ofrece reintentar cuando el modelo no existe', async () => {
    calcularTco.mockRejectedValue(
      Object.assign(new Error('No encontramos este modelo.'), { tipo: 'no-encontrada' }),
    );
    render(<Calculadora modelos={MODELOS} />);

    elegirModelo(2);

    await screen.findByRole('alert');
    expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull();
  });
});
