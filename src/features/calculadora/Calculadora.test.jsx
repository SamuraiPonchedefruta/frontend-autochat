// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Calculadora from './Calculadora';
import { calcularTco } from './calculadoraApi';

vi.mock('./calculadoraApi', () => ({
  calcularTco: vi.fn(),
  CalculadoraError: class CalculadoraError extends Error {
    constructor(tipo, mensaje, errores = {}) {
      super(mensaje);
      this.name = 'CalculadoraError';
      this.tipo = tipo;
      this.errores = errores;
    }
  },
}));

const MODELOS = [
  { id: 1, marca: 'Toyota', nombre: 'Hilux' },
  { id: 2, marca: 'Kia', nombre: 'Rio' },
];

const DATOS = {
  desglose: {
    anios: 5,
    compra: 1000,
    combustible: 2000,
    mantenimiento: 1500,
    seguro: 1000,
    gastosAnuales: 500,
    total: 6000,
  },
  alcance: 'Estimación para uso particular.',
  limitaciones: ['No incluye reparaciones mayores.'],
  fechaDatos: '2026-10-15',
};

function elegirModelo(id) {
  const selector = screen.getByLabelText('Elige un modelo');
  fireEvent.change(selector, { target: { value: String(id) } });
}

describe('Calculadora', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

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
    expect(calcularTco.mock.calls[0][0].idModelo).toBe(1);
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
    calcularTco
      .mockRejectedValueOnce({ name: 'CalculadoraError', tipo: 'red', message: 'Error de red' })
      .mockResolvedValueOnce(DATOS);

    render(<Calculadora modelos={MODELOS} />);
    elegirModelo(1);

    const boton = await screen.findByRole('button', { name: 'Reintentar' });
    fireEvent.click(boton);

    expect(await screen.findByRole('list', { name: 'Rubros del TCO' })).toBeTruthy();
    expect(calcularTco).toHaveBeenCalledTimes(2);
  });

  it('no ofrece reintentar cuando el modelo no existe', async () => {
    calcularTco.mockRejectedValue({ name: 'CalculadoraError', tipo: 'no-encontrada', message: 'No encontrado' });

    render(<Calculadora modelos={MODELOS} />);
    elegirModelo(1);

    expect(await screen.findByText('No encontrado')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull();
  });
});

describe('Calculadora: controles de supuestos', () => {
  it('al cambiar un valor recalcula y actualiza el resultado', async () => {
    calcularTco
      .mockResolvedValueOnce(DATOS)
      .mockResolvedValueOnce({ ...DATOS, desglose: { ...DATOS.desglose, total: 7000 } });
    render(<Calculadora modelos={MODELOS} />);

    elegirModelo(1);
    await screen.findByRole('list', { name: 'Rubros del TCO' });

    fireEvent.change(screen.getByLabelText('Kilómetros por año'), { target: { value: '20000' } });

    expect(await screen.findByText(/7\D?000/)).toBeTruthy();
    expect(calcularTco).toHaveBeenCalledTimes(2);
    expect(calcularTco.mock.calls[1][0].kmPorAnio).toBe(20000);
  });

  it('muestra el error junto al campo y no llama al API con un valor inválido', async () => {
    calcularTco.mockResolvedValue(DATOS);
    render(<Calculadora modelos={MODELOS} />);

    elegirModelo(1);
    await screen.findByRole('list', { name: 'Rubros del TCO' });

    const campo = screen.getByLabelText('Kilómetros por año');
    fireEvent.change(campo, { target: { value: '-5' } });

    const mensaje = await screen.findByText('Ingresa un número válido mayor o igual a 0.');
    expect(campo.getAttribute('aria-invalid')).toBe('true');
    expect(document.getElementById(campo.getAttribute('aria-describedby'))).toBe(mensaje);

    await new Promise((resolver) => setTimeout(resolver, 450));
    expect(calcularTco).toHaveBeenCalledTimes(1);
  });

  it('muestra junto al campo el error que devuelve el servidor', async () => {
    calcularTco.mockRejectedValue(
      Object.assign(new Error('Revisa los valores ingresados.'), {
        tipo: 'validacion',
        errores: { kmPorAnio: 'Máximo 100000 km al año.' },
      }),
    );
    render(<Calculadora modelos={MODELOS} />);

    elegirModelo(1);

    const mensaje = await screen.findByText('Máximo 100000 km al año.');
    const campo = screen.getByLabelText('Kilómetros por año');
    expect(document.getElementById(campo.getAttribute('aria-describedby'))).toBe(mensaje);
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull());
  });
});
