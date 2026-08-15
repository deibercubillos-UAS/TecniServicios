/** Departamentos de Colombia y sus ciudades/municipios principales (DANE) —
 * lista curada, no exhaustiva (Colombia tiene ~1100 municipios; acá solo
 * capitales y ciudades intermedias relevantes para cobertura de servicio
 * técnico). Evita error ortográfico y permite filtrar por departamento en
 * vez de texto libre. Si falta una ciudad real, se agrega a su
 * departamento — nunca se inventa una que no exista. */
export const COLOMBIA_DEPARTMENTS_CITIES: Record<string, string[]> = {
  Amazonas: ["Leticia", "Puerto Nariño"],
  Antioquia: ["Medellín", "Bello", "Itagüí", "Envigado", "Rionegro", "Apartadó", "Turbo", "Sabaneta", "Caldas", "La Estrella"],
  Arauca: ["Arauca", "Saravena", "Tame"],
  Atlántico: ["Barranquilla", "Soledad", "Malambo", "Puerto Colombia", "Sabanalarga"],
  "Bogotá D.C.": ["Bogotá"],
  Bolívar: ["Cartagena", "Magangué", "Turbaco", "Arjona"],
  Boyacá: ["Tunja", "Duitama", "Sogamoso", "Chiquinquirá"],
  Caldas: ["Manizales", "La Dorada", "Chinchiná", "Villamaría"],
  Caquetá: ["Florencia", "San Vicente del Caguán"],
  Casanare: ["Yopal", "Aguazul", "Villanueva"],
  Cauca: ["Popayán", "Santander de Quilichao", "Puerto Tejada"],
  Cesar: ["Valledupar", "Aguachica", "Codazzi"],
  Chocó: ["Quibdó", "Istmina"],
  Córdoba: ["Montería", "Cereté", "Lorica", "Sahagún"],
  Cundinamarca: ["Soacha", "Chía", "Zipaquirá", "Facatativá", "Fusagasugá", "Girardot", "Mosquera", "Madrid", "Funza"],
  Guainía: ["Inírida"],
  Guaviare: ["San José del Guaviare"],
  Huila: ["Neiva", "Pitalito", "Garzón"],
  "La Guajira": ["Riohacha", "Maicao", "Uribia"],
  Magdalena: ["Santa Marta", "Ciénaga", "Fundación"],
  Meta: ["Villavicencio", "Acacías", "Granada"],
  Nariño: ["Pasto", "Tumaco", "Ipiales"],
  "Norte de Santander": ["Cúcuta", "Ocaña", "Villa del Rosario", "Pamplona"],
  Putumayo: ["Mocoa", "Puerto Asís"],
  Quindío: ["Armenia", "Calarcá", "La Tebaida"],
  Risaralda: ["Pereira", "Dosquebradas", "Santa Rosa de Cabal"],
  "San Andrés y Providencia": ["San Andrés", "Providencia"],
  Santander: ["Bucaramanga", "Floridablanca", "Girón", "Piedecuesta", "Barrancabermeja"],
  Sucre: ["Sincelejo", "Corozal"],
  Tolima: ["Ibagué", "Espinal", "Melgar"],
  "Valle del Cauca": ["Cali", "Palmira", "Buenaventura", "Tuluá", "Cartago", "Buga", "Jamundí", "Yumbo"],
  Vaupés: ["Mitú"],
  Vichada: ["Puerto Carreño"],
} as const;

export const COLOMBIA_DEPARTMENTS = Object.keys(COLOMBIA_DEPARTMENTS_CITIES).sort((a, b) => a.localeCompare(b, "es"));
