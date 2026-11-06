const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class ComparadorError extends Error {
  constructor(tipo, mensaje) {
    super(mensaje);
    this.name = 'ComparadorError';
    this.tipo = tipo; // 'red' | 'rango' | 'no-encontrada' | 'servidor'
  }
}

export async function compararModelos(ids, { anio = null, signal } = {}) {
  const params = new URLSearchParams({ ids: ids.join(',') });
  if (anio != null) params.set('anio', String(anio));

  let respuesta;
  try {
    respuesta = await fetch(`${BASE_URL}/modelos/comparar?${params}`, {
      signal,
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ComparadorError('red', 'No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.');
  }

  if (respuesta.status === 400) {
    throw new ComparadorError('rango', 'Elige al menos 2 modelos distintos, sin pasarte del máximo permitido.');
  }
  if (respuesta.status === 404) {
    throw new ComparadorError('no-encontrada', 'Alguno de los modelos ya no existe.');
  }
  if (!respuesta.ok) {
    throw new ComparadorError('servidor', 'Ocurrió un problema al comparar. Inténtalo más tarde.');
  }
  return respuesta.json();
}
