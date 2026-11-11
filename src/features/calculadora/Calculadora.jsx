import { useEffect, useState } from 'react';
import { calcularTco } from './calculadoraApi';
import DesgloseTco from './DesgloseTco';
import './Calculadora.css';

export default function Calculadora({ modelos = [], anio = null }) {
  const [idModelo, setIdModelo] = useState('');
  const [estado, setEstado] = useState({ fase: 'inicio' });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!idModelo) return undefined;

    const controlador = new AbortController();
    setEstado({ fase: 'cargando' });

    calcularTco(idModelo, { anio, signal: controlador.signal })
      .then((datos) => setEstado({ fase: 'listo', datos }))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setEstado({ fase: 'error', error });
      });

    return () => controlador.abort();
  }, [idModelo, anio, intento]);

  const { fase } = estado;
  const reintentable = fase === 'error' && estado.error.tipo !== 'no-encontrada';

  return (
    <main className="calculadora" aria-busy={fase === 'cargando'}>
      <h1 className="calculadora__titulo">Costo total de propiedad</h1>

      <label className="calculadora__etiqueta" htmlFor="calculadora-modelo">
        Elige un modelo
      </label>
      <select
        id="calculadora-modelo"
        className="calculadora__selector"
        value={idModelo}
        onChange={(evento) => setIdModelo(evento.target.value)}
      >
        <option value="" disabled>
          Selecciona un modelo
        </option>
        {modelos.map((m) => (
          <option key={m.id} value={String(m.id)}>
            {m.marca} {m.nombre}
          </option>
        ))}
      </select>

      {fase === 'inicio' && (
        <p className="calculadora__estado">Elige un modelo para ver su desglose.</p>
      )}

      {fase === 'cargando' && <p className="calculadora__estado">Calculando…</p>}

      {fase === 'error' && (
        <>
          <p className="calculadora__estado calculadora__estado--error" role="alert">
            {estado.error.tipo ? estado.error.message : 'No se pudo calcular el costo.'}
          </p>
          {reintentable && (
            <button
              type="button"
              className="calculadora__reintentar"
              onClick={() => setIntento((n) => n + 1)}
            >
              Reintentar
            </button>
          )}
        </>
      )}

      {fase === 'listo' && <DesgloseTco datos={estado.datos} />}
    </main>
  );
}
