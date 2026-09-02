import { SiigoRealClient, type SiigoConfig } from "./client";
import { SiigoMockClient } from "./mock-client";
import type { SiigoClient } from "./types";

/**
 * Selecciona el cliente de Siigo según haya o no credenciales — el resto de
 * la aplicación (`resolvePrice` en core) siempre programa contra la
 * interfaz `SiigoClient`, nunca contra una implementación concreta
 * (docs/08-INTEGRATION-SIIGO.md sección 8: "Hasta resolver el primer punto,
 * la fase de catálogo se desarrolla con un adaptador simulado").
 */
export function getSiigoClient(config: SiigoConfig | null): SiigoClient {
  if (!config) return new SiigoMockClient();
  return new SiigoRealClient(config);
}
