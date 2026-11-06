import { useEffect, useState } from 'react';
import { compararModelos } from './comparadorApi';
import './Comparador.css';

const SIN_INFO = 'Sin información todavía.';

const FILAS_FICHA = [
  ['consumo', 'Consumo'],
  ['mantenimiento', 'Mantenimiento'],
  ['fallasComunes', 'Fallas comunes'],
  ['repuestos', 'Repuestos'],
  ['queRevisar', 'Qué revisar'],
];

const formatoPrecio = new Intl.NumberFormat('es-PA', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function textoPrecio(precio, anio) {
  if (anio == null) return 'Elige un año para ver el precio.';
  if (!precio) return `Sin precio para ${anio}.`;
  return `${formatoPrecio.format(precio.precioMin)} – ${formatoPrecio.format(precio.precioMax)}`;
}

export default function Comparador({ ids, anio = null }) {
  const clave = ids.join(',');
  const [estado, setEstado] = useState({ fase: 'cargando' });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controlador = new AbortController();
    setEstado({ fase: 'cargando' });

    compararModelos(clave.split(','), { anio, signal: controlador.signal })
      .then((datos) => setEstado({ fase: 'listo', datos }))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setEstado({ fase: 'error', error });
      });

    return () => controlador.abort();
  }, [clave, anio, intento]);

  if (estado.fase === 'cargando') {
    return (
      <main className="comparador" aria-busy="true">
        <p className="comparador__estado">Cargando comparación…</p>
      </main>
    );
  }

  if (estado.fase === 'error') {
    const { error } = estado;
    const mensaje = error.tipo ? error.message : 'No se pudo cargar la comparación.';
    const reintentable = error.tipo !== 'rango' && error.tipo !== 'no-encontrada';
    return (
      <main className="comparador">
        <p className="comparador__estado comparador__estado--error" role="alert">{mensaje}</p>
        {reintentable && (
          <button type="button" className="comparador__reintentar" onClick={() => setIntento((n) => n + 1)}>
            Reintentar
          </button>
        )}
      </main>
    );
  }

  const { modelos } = estado.datos;
  return (
    <main className="comparador">
      <h1 className="comparador__titulo">Comparar modelos</h1>
      <div
        className="comparador__scroll"
        role="region"
        aria-label="Tabla de comparación, desliza para ver más modelos"
        tabIndex={0}
      >
        <table className="comparador__tabla">
          <thead>
            <tr>
              <th scope="col" className="comparador__esquina">
                <span className="comparador__solo-lectores">Característica</span>
              </th>
              {modelos.map((m) => (
                <th key={m.id} scope="col" className="comparador__celda comparador__modelo">
                  <span className="comparador__marca">{m.marca}</span>
                  <span className="comparador__nombre">{m.nombre}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" className="comparador__fila-titulo">Precio</th>
              {modelos.map((m) => (
                <td key={m.id} className="comparador__celda">
                  {textoPrecio(m.precio, anio)}
                  {m.precio && <small className="comparador__fuente">{m.precio.fuente}</small>}
                </td>
              ))}
            </tr>
            {FILAS_FICHA.map(([campo, titulo]) => (
              <tr key={campo}>
                <th scope="row" className="comparador__fila-titulo">{titulo}</th>
                {modelos.map((m) => (
                  <td key={m.id} className="comparador__celda">{m.ficha?.[campo] || SIN_INFO}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
