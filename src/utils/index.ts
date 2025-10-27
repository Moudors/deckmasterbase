// src/utils/index.ts

// ✅ Formata uma data no padrão brasileiro
export const formatDate = (date: Date): string =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);

// ✅ Cria uma URL com query params a partir de um objeto
export function createPageUrl(
  base: string,
  params: Record<string, string | number | boolean> = {}
): string {
  const url = new URL(base, window.location.origin);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  return url.toString();
}
