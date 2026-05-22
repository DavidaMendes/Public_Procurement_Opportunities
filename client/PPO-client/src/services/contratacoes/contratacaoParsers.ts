export function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function formatCurrency(value: unknown) {
  const number = readNumber(value);

  if (number === null) {
    return "Nao informado";
  }

  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(number);
}

export function readNestedObject(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}
