import type { NextConfig } from "next";
import path from "path";

/**
 * Fija la raíz de Turbopack al proyecto actual. Si no se define, Next puede elegir
 * otra carpeta cuando hay varios package-lock (p. ej. en el directorio del usuario)
 * y aparecen errores opacos en desarrollo.
 */
const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;
