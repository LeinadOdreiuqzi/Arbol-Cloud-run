"use client";
import * as React from "react";
import { useEffect, useState } from "react";
import { compile } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import { MDXProvider } from "@mdx-js/react";

type Props = {
  code: string;
};

export function DynamicMdx({ code }: Props) {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        console.log("[DynamicMdx] Código recibido:", code);
        if (!code) {
          setComponent(() => () => <em>Sin contenido</em>);
          console.log("[DynamicMdx] Sin contenido");
          return;
        }
        // Compila el MDX con outputFormat: "function-body"
        const compiled = await compile(code, {
          outputFormat: "function-body",
          development: false,
          jsx: true,
        });
        console.log("[DynamicMdx] Compilación exitosa:", compiled.value);
        // Evalúa el código generado y obtiene el export default correctamente
        const wrapped = `(function(React, runtime, exports){${compiled.value}; return exports.default;})`;
        // eslint-disable-next-line no-eval
        const Comp = eval(wrapped)(React, runtime, {});
        console.log("[DynamicMdx] Componente generado:", Comp);
        if (!cancelled) {
          setComponent(() => Comp);
          console.log("[DynamicMdx] Componente seteado");
        }
      } catch (err) {
        // Muestra siempre el error en pantalla y consola
        console.error("Error compilando MDX dinámico:", err, code);
        setComponent(() => () => <pre style={{color: 'red', whiteSpace: 'pre-wrap'}}>Error al renderizar MDX:\n{String(err)}</pre>);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [code]);

  if (!Component) return <div style={{color: 'orange'}}>Cargando contenido... (o el componente MDX no fue generado)</div>;
  return (
    <MDXProvider>
      <Component />
    </MDXProvider>
  );
}