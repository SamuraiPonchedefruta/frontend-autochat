const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class FichaError extends Error {
  constructor(tipo, mensaje) {
    super(mensaje);
    this.name = 'FichaError';
    this.tipo = tipo; // 'red' | 'no-encontrada' | 'servidor'
  }
}

export async function obtenerFicha(idModelo, { signal } = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${BASE_URL}/modelos/${encodeURIComponent(idModelo)}`, {
      signal,
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new FichaError('red', 'No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.');
  }

  if (respuesta.status === 404) {
    throw new FichaError('no-encontrada', 'No encontramos este modelo.');
  }
  if (!respuesta.ok) {
    throw new FichaError('servidor', 'Ocurrió un problema al cargar la ficha. Inténtalo más tarde.');
  }
  return respuesta.json();
}
