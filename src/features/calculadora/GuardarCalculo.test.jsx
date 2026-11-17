// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import GuardarCalculo, { RUTA_REGISTRO } from './GuardarCalculo';
import { guardarCalculo } from './calculadoraApi';

vi.mock('./calculadoraApi', () => ({ guardarCalculo: vi.fn() }));

const PAYLOAD = { idModelo: 1, anioModelo: 2026, anios: 5 };

describe('GuardarCalculo', () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('guarda el cálculo y redirige al registro', async () => {
    guardarCalculo.mockResolvedValue({ id: 10 });
    const onRedirigir = vi.fn();
    render(<GuardarCalculo payload={PAYLOAD} onRedirigir={onRedirigir} />);

    fireEvent.click(screen.getByRole('button', { name: /guardar cálculo/i }));

    await waitFor(() => expect(onRedirigir).toHaveBeenCalledWith(RUTA_REGISTRO));
    expect(guardarCalculo).toHaveBeenCalledWith(PAYLOAD);
  });

  it('deshabilita el botón mientras guarda', async () => {
    guardarCalculo.mockReturnValue(new Promise(() => {}));
    render(<GuardarCalculo payload={PAYLOAD} onRedirigir={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /guardar cálculo/i }));

    const boton = await screen.findByRole('button', { name: /guardando/i });
    expect(boton.disabled).toBe(true);
  });

  it('muestra el error y no redirige si falla', async () => {
    const error = Object.assign(new Error('No pudimos guardar tu cálculo.'), { tipo: 'servidor' });
    guardarCalculo.mockRejectedValue(error);
    const onRedirigir = vi.fn();
    render(<GuardarCalculo payload={PAYLOAD} onRedirigir={onRedirigir} />);

    fireEvent.click(screen.getByRole('button', { name: /guardar cálculo/i }));

    expect((await screen.findByRole('alert')).textContent).toMatch(/no pudimos guardar/i);
    expect(onRedirigir).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /guardar cálculo/i }).disabled).toBe(false);
  });
});
