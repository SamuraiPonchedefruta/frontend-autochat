/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import Comparador from './Comparador';
import { compararModelos } from './comparadorApi';

vi.mock('./comparadorApi', () => ({ compararModelos: vi.fn() }));

const FICHA = {
  consumo: '9 l/100 km',
  mantenimiento: 'Aceite cada 10000 km',
  fallasComunes: 'Desgaste del embrague',
  repuestos: 'Filtro de aire',
  queRevisar: 'Revisar la suspension',
};

const DATOS = {
  ids: [1, 2],
  anio: 2018,
  modelos: [
    {
      id: 1,
      marca: 'Toyota',
      nombre: 'Hilux',
      ficha: FICHA,
      precio: { anio: 2018, precioMin: 8000, precioMax: 9500, fuente: 'Facebook Marketplace' },
    },
    { id: 2, marca: 'Kia', nombre: 'Rio', ficha: null, precio: null },
  ],
};

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe('Comparador', () => {
  it('muestra una columna por modelo, en el orden recibido', async () => {
    compararModelos.mockResolvedValue(DATOS);
    render(<Comparador ids={[1, 2]} anio={2018} />);

    const columnas = await screen.findAllByRole('columnheader');
    expect(columnas[1].textContent).toContain('Hilux');
    expect(columnas[2].textContent).toContain('Rio');
    expect(compararModelos.mock.calls[0][0]).toEqual(['1', '2']);
  });

  it('muestra los datos de la ficha y el precio del año', async () => {
    compararModelos.mockResolvedValue(DATOS);
    render(<Comparador ids={[1, 2]} anio={2018} />);

    expect(await screen.findByText('9 l/100 km')).toBeTruthy();
    expect(screen.getByText('Revisar la suspension')).toBeTruthy();
    expect(screen.getByText(/8\D?000.*9\D?500/)).toBeTruthy();
    expect(screen.getByText('Facebook Marketplace')).toBeTruthy();
    expect(screen.getByText('Sin precio para 2018.')).toBeTruthy();
  });

  it('avisa cuando un modelo no tiene ficha', async () => {
    compararModelos.mockResolvedValue(DATOS);
    render(<Comparador ids={[1, 2]} anio={2018} />);

    expect((await screen.findAllByText('Sin información todavía.')).length).toBe(5);
  });

  it('pide elegir un año cuando no se indica', async () => {
    compararModelos.mockResolvedValue({ ...DATOS, anio: null });
    render(<Comparador ids={[1, 2]} />);

    expect((await screen.findAllByText('Elige un año para ver el precio.')).length).toBe(2);
  });

  it('el contenedor se puede recorrer con teclado y tiene scroll horizontal', async () => {
    compararModelos.mockResolvedValue(DATOS);
    render(<Comparador ids={[1, 2]} anio={2018} />);

    const region = await screen.findByRole('region');
    expect(region.getAttribute('tabindex')).toBe('0');
    expect(region.className).toContain('comparador__scroll');
  });

  it('muestra un mensaje claro cuando el rango no es válido, sin reintentar', async () => {
    compararModelos.mockRejectedValue(
      Object.assign(new Error('Elige al menos 2 modelos distintos.'), { tipo: 'rango' }),
    );
    render(<Comparador ids={[1]} />);

    expect((await screen.findByRole('alert')).textContent).toBe('Elige al menos 2 modelos distintos.');
    expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull();
  });

  it('permite reintentar cuando falla la conexión', async () => {
    compararModelos.mockRejectedValue(Object.assign(new Error('Sin conexión.'), { tipo: 'red' }));
    render(<Comparador ids={[1, 2]} />);

    expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeTruthy();
  });
});
