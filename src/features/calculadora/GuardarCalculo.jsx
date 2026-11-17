import { useState } from 'react';
import { guardarCalculo } from './calculadoraApi';

export const RUTA_REGISTRO = '/registro';

function irA(url) {
  window.location.assign(url);
}

export default function GuardarCalculo({ payload, onRedirigir = irA }) {
  const [estado, setEstado] = useState({ fase: 'reposo' });

  async function guardar() {
    setEstado({ fase: 'guardando' });
    try {
      await guardarCalculo(payload);
      onRedirigir(RUTA_REGISTRO);
    } catch (error) {
      setEstado({ fase: 'error', error });
    }
  }

  const guardando = estado.fase === 'guardando';

  return (
    <section className="calculadora__guardar">
      <button
        type="button"
        className="calculadora__guardar-boton"
        onClick={guardar}
        disabled={guardando}
      >
        {guardando ? 'Guardando…' : 'Guardar cálculo'}
      </button>
      {estado.fase === 'error' && (
        <p className="calculadora__estado calculadora__estado--error" role="alert">
          {estado.error?.tipo ? estado.error.message : 'No se pudo guardar el cálculo.'}
        </p>
      )}
    </section>
  );
}
