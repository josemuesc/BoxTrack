// El día del WOD se calcula en la zona horaria del box (Colombia), no en
// UTC (que es la zona de los servidores de Vercel). Con `current_date` /
// `new Date().toISOString()` crudos, un WOD subido después de las 7pm hora
// Colombia ya cae en el día UTC siguiente: queda mal etiquetado como el
// WOD de "mañana" y por eso los atletas siguen viendo el de ayer al entrar
// el día que en realidad todavía no tiene WOD oficial.
const ZONA_BOX = "America/Bogota";

export function fechaHoyBox(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_BOX,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
