import { useEffect, useState } from 'react';
import { obtenerFicha } from './fichaApi';
import './FichaModelo.css';

const SECCIONES = [
  ['consumo', 'Consumo'],
  ['mantenimiento', 'Mantenimiento'],
  ['fallasComunes', 'Fallas comunes'],
  ['repuestos', 'Repuestos'],
  ['queRevisar', 'Qué revisar'],
];

const formatoFecha = new Intl.DateTimeFormat('es-PA', { dateStyle: 'medium' });

export default function FichaModelo({ idModelo }) {
  const [estado, setEstado] = useState({ fase: 'cargando' });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controlador = new AbortController();
    setEstado({ fase: 'cargando' });

    obtenerFicha(idModelo, { signal: controlador.signal })
      .then((ficha) => setEstado({ fase: 'listo', ficha }))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setEstado({ fase: 'error', error });
      });

    return () => controlador.abort();
  }, [idModelo, intento]);

  if (estado.fase === 'cargando') {
    return (
      <main className="ficha" aria-busy="true">
        <p className="ficha__estado">Cargando ficha…</p>
      </main>
    );
  }

  if (estado.fase === 'error') {
    const { error } = estado;
    const mensaje = error.tipo ? error.message : 'No se pudo cargar la ficha.';
    return (
      <main className="ficha">
        <p className="ficha__estado ficha__estado--error" role="alert">{mensaje}</p>
        {error.tipo !== 'no-encontrada' && (
          <button type="button" className="ficha__reintentar" onClick={() => setIntento((n) => n + 1)}>
            Reintentar
          </button>
        )}
      </main>
    );
  }

  const { ficha } = estado;
  return (
    <main className="ficha">
      <header className="ficha__encabezado">
        <p className="ficha__marca">{ficha.marca}</p>
        <h1 className="ficha__titulo">{ficha.nombre}</h1>
      </header>

      {SECCIONES.map(([campo, titulo]) => (
        <section key={campo} className="ficha__seccion">
          <h2 className="ficha__subtitulo">{titulo}</h2>
          <p className="ficha__texto">{ficha[campo] || 'Sin información todavía.'}</p>
        </section>
      ))}

      <footer className="ficha__pie">
        Actualizado el{' '}
        <time dateTime={ficha.actualizadoEn}>{formatoFecha.format(new Date(ficha.actualizadoEn))}</time>
      </footer>
    </main>
  );
}
