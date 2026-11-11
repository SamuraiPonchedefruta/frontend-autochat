const formatoPrecio = new Intl.NumberFormat('es-PA', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function textoFecha(fecha) {
  if (!fecha) return 'Fecha no disponible';
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return 'Fecha no disponible';
  // UTC para que una fecha "2026-10-15" no se corra un día en Panamá.
  return valor.toLocaleDateString('es-PA', { dateStyle: 'long', timeZone: 'UTC' });
}

export default function DesgloseTco({ datos }) {
  const { modelo, rubros = [], total, alcance, limitaciones = [], fechaDatos } = datos;

  return (
    <section className="calculadora__resultado">
      {modelo && (
        <h2 className="calculadora__modelo">
          {modelo.marca} {modelo.nombre}
        </h2>
      )}

      <ul className="calculadora__rubros" aria-label="Rubros del TCO">
        {rubros.map((rubro) => (
          <li key={rubro.clave} className="calculadora__rubro">
            <span className="calculadora__rubro-nombre">{rubro.nombre}</span>
            <span className="calculadora__rubro-monto">{formatoPrecio.format(rubro.monto)}</span>
          </li>
        ))}
      </ul>

      {total != null && (
        <p className="calculadora__total">
          Total estimado: <strong>{formatoPrecio.format(total)}</strong>
        </p>
      )}

      <p className="calculadora__fecha">Datos al {textoFecha(fechaDatos)}</p>

      <div className="calculadora__bloque">
        <h3 className="calculadora__subtitulo">Alcance</h3>
        <p>{alcance || 'Sin información todavía.'}</p>
      </div>

      <div className="calculadora__bloque">
        <h3 className="calculadora__subtitulo">Limitaciones</h3>
        {limitaciones.length > 0 ? (
          <ul className="calculadora__limitaciones">
            {limitaciones.map((limite) => (
              <li key={limite}>{limite}</li>
            ))}
          </ul>
        ) : (
          <p>Sin información todavía.</p>
        )}
      </div>
    </section>
  );
}
