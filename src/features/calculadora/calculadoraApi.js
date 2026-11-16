const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class CalculadoraError extends Error {
  constructor(tipo, mensaje, errores = {}) {
    super(mensaje);
    this.name = 'CalculadoraError';
    this.tipo = tipo; // 'red' | 'validacion' | 'no-encontrada' | 'servidor'
    this.errores = errores; // { campo: mensaje } cuando tipo === 'validacion'
  }
}

function extraerErrores(cuerpo) {
  const detalles = cuerpo?.details || cuerpo?.errores;
  const erroresMapeados = {};
  if (Array.isArray(detalles)) {
    for (const item of detalles) {
      if (typeof item === 'string' && item.includes(':')) {
        const [campo, ...resto] = item.split(':');
        erroresMapeados[campo.trim()] = resto.join(':').trim();
      } else if (item?.campo && item?.mensaje) {
        erroresMapeados[item.campo] = item.mensaje;
      }
    }
  } else if (detalles && typeof detalles === 'object') {
    return detalles;
  }
  return erroresMapeados;
}

export async function calcularTco(payload, { signal } = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${BASE_URL}/calculadora/tco`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new CalculadoraError('red', 'No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.');
  }

  if (respuesta.status === 400) {
    const cuerpo = await respuesta.json().catch(() => null);
    throw new CalculadoraError('validacion', 'Revisa los valores ingresados.', extraerErrores(cuerpo));
  }
  if (respuesta.status === 404) {
    throw new CalculadoraError('no-encontrada', 'No encontramos este modelo o año.');
  }
  if (!respuesta.ok) {
    throw new CalculadoraError('servidor', 'Ocurrió un problema al calcular el costo. Inténtalo más tarde.');
  }
  return respuesta.json();
}
