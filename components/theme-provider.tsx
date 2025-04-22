"use client";

import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";
import * as React from "react";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false);

  // Apenas montar o provider após a hidratação no lado do cliente
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Evitar renderização prematura para evitar incompatibilidade de hidratação
  if (!mounted) {
    return <>{children}</>;
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
