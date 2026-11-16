export const SUPUESTOS_INICIALES = {
  kmPorAnio: '',
  precioCombustible: '',
  seguroAnual: '',
};

const CAMPOS = [
  { clave: 'kmPorAnio', etiqueta: 'Kilómetros por año', entero: true, paso: '1' },
  { clave: 'precioCombustible', etiqueta: 'Precio del combustible (USD por galón)', entero: false, paso: '0.01' },
  { clave: 'seguroAnual', etiqueta: 'Seguro anual (USD)', entero: false, paso: '0.01' },
];

export function validarSupuestos(supuestos) {
  const errores = {};
  for (const { clave, entero } of CAMPOS) {
    const valor = supuestos[clave];
    if (valor === '' || valor == null) continue;
    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero < 0) {
      errores[clave] = 'Ingresa un número válido mayor o igual a 0.';
    } else if (entero && !Number.isInteger(numero)) {
      errores[clave] = 'Ingresa un número entero.';
    }
  }
  return errores;
}

export default function SupuestosForm({ valores, errores = {}, onCambio }) {
  return (
    <fieldset className="calculadora__supuestos">
      <legend className="calculadora__subtitulo">Supuestos opcionales</legend>
      <p className="calculadora__ayuda">Déjalos vacíos para usar los valores por defecto del sistema.</p>

      {CAMPOS.map(({ clave, etiqueta, paso }) => {
        const idCampo = `supuesto-${clave}`;
        const idError = `${idCampo}-error`;
        const error = errores[clave];
        return (
          <div key={clave} className="calculadora__campo">
            <label className="calculadora__etiqueta" htmlFor={idCampo}>
              {etiqueta}
            </label>
            <input
              id={idCampo}
              className={`calculadora__input${error ? ' calculadora__input--error' : ''}`}
              type="number"
              inputMode="decimal"
              min="0"
              step={paso}
              placeholder="Por defecto"
              value={valores[clave]}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? idError : undefined}
              onChange={(evento) => onCambio(clave, evento.target.value)}
            />
            {error && (
              <p id={idError} className="calculadora__error-campo" role="alert">
                {error}
              </p>
            )}
          </div>
        );
      })}
    </fieldset>
  );
}
