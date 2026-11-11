const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class CalculadoraError extends Error {
  constructor(tipo, mensaje) {
    super(mensaje);
    this.name = 'CalculadoraError';
    this.tipo = tipo; // 'red' | 'no-encontrada' | 'servidor'
  }
}

export async function calcularTco(idModelo, { anio = null, signal } = {}) {
  const params = new URLSearchParams();
  if (anio != null) params.set('anio', String(anio));
  const consulta = params.toString() ? `?${params}` : '';

  let respuesta;
  try {
    respuesta = await fetch(`${BASE_URL}/modelos/${encodeURIComponent(idModelo)}/tco${consulta}`, {
      signal,
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new CalculadoraError('red', 'No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.');
  }

  if (respuesta.status === 404) {
    throw new CalculadoraError('no-encontrada', 'No encontramos este modelo.');
  }
  if (!respuesta.ok) {
    throw new CalculadoraError('servidor', 'Ocurrió un problema al calcular el costo. Inténtalo más tarde.');
  }
  return respuesta.json();
}
