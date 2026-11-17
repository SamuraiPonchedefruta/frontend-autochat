import { useEffect, useState } from 'react';
import { calcularTco } from './calculadoraApi';
import DesgloseTco from './DesgloseTco';
import SupuestosForm, { SUPUESTOS_INICIALES, validarSupuestos } from './SupuestosForm';
import './Calculadora.css';

const RETARDO_MS = 300;

export default function Calculadora({ modelos = [], anioDefault = 2026, horizonteDefault = 5 }) {
  const [modeloSeleccionado, setModeloSeleccionado] = useState(null);
  const [supuestos, setSupuestos] = useState(SUPUESTOS_INICIALES);
  const [estado, setEstado] = useState({ fase: 'inicio' });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!modeloSeleccionado || Object.keys(validarSupuestos(supuestos)).length > 0) return undefined;

    const controlador = new AbortController();
    const temporizador = setTimeout(() => {
      setEstado((previo) => ({ fase: 'cargando', datos: previo.datos }));

      const payload = {
        idModelo: modeloSeleccionado.id,
        anioModelo: modeloSeleccionado.anio || anioDefault,
        anios: horizonteDefault,
        kmPorGalon: modeloSeleccionado.kmPorGalon || 40,
        mantenimientoAnual: modeloSeleccionado.mantenimiento || 300,
        kmPorAnio: supuestos.kmPorAnio !== '' ? Number(supuestos.kmPorAnio) : null,
        precioCombustible: supuestos.precioCombustible !== '' ? Number(supuestos.precioCombustible) : null,
        seguroAnual: supuestos.seguroAnual !== '' ? Number(supuestos.seguroAnual) : null,
      };

      calcularTco(payload, { signal: controlador.signal })
        .then((respuesta) => setEstado({ fase: 'listo', datos: respuesta }))
        .catch((error) => {
          if (error.name === 'AbortError') return;
          setEstado((previo) => ({ fase: 'error', error, datos: previo.datos }));
        });
    }, RETARDO_MS);

    return () => {
      clearTimeout(temporizador);
      controlador.abort();
    };
  }, [modeloSeleccionado, supuestos, anioDefault, horizonteDefault, intento]);

  function cambiarModelo(evento) {
    const id = evento.target.value;
    const encontrado = modelos.find((m) => String(m.id) === id);
    setModeloSeleccionado(encontrado || null);
    if (!encontrado) setEstado({ fase: 'inicio' });
  }

  function cambiarSupuesto(campo, valor) {
    setSupuestos((previo) => ({ ...previo, [campo]: valor }));
  }

  const { fase, datos, error } = estado;
  const erroresServidor = fase === 'error' && (error.tipo === 'validacion' || error.errores) ? (error.errores || {}) : {};
  const erroresCampo = { ...erroresServidor, ...validarSupuestos(supuestos) };
  const errorGeneral = fase === 'error' && error.tipo !== 'validacion' && !error.errores;
  const reintentable = errorGeneral && error.tipo !== 'no-encontrada';

  return (
    <main className="calculadora" aria-busy={fase === 'cargando'}>
      <h1 className="calculadora__titulo">Costo total de propiedad</h1>

      <label className="calculadora__etiqueta" htmlFor="calculadora-modelo">
        Elige un modelo
      </label>
      <select
        id="calculadora-modelo"
        className="calculadora__selector"
        value={modeloSeleccionado?.id || ''}
        onChange={cambiarModelo}
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

      <SupuestosForm valores={supuestos} errores={erroresCampo} onCambio={cambiarSupuesto} />

      {fase === 'inicio' && (
        <p className="calculadora__estado">Elige un modelo para ver su desglose.</p>
      )}

      {fase === 'cargando' && (
        <p className="calculadora__estado">{datos ? 'Recalculando…' : 'Calculando…'}</p>
      )}

      {errorGeneral && (
        <>
          <p className="calculadora__estado calculadora__estado--error" role="alert">
            {error.tipo ? error.message : 'No se pudo calcular el costo.'}
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

      {datos && !errorGeneral && <DesgloseTco datos={datos} />}
    </main>
  );
}
