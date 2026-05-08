const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const COMPACT_DATE_PATTERN = /^(\d{4})(\d{2})(\d{2})$/;

function buildLocalDate(year: string, month: string, day: string) {
  const parsedYear = Number(year);
  const parsedMonth = Number(month);
  const parsedDay = Number(day);
  const date = new Date(parsedYear, parsedMonth - 1, parsedDay);

  if (
    date.getFullYear() !== parsedYear ||
    date.getMonth() !== parsedMonth - 1 ||
    date.getDate() !== parsedDay
  ) {
    return null;
  }

  return date;
}

export function formatDate(value: string | null | undefined, fallback = "Data nao informada") {
  if (!value?.trim()) {
    return fallback;
  }

  const dateValue = value.trim();
  const dateOnlyMatch = dateValue.match(DATE_ONLY_PATTERN);
  const compactDateMatch = dateValue.match(COMPACT_DATE_PATTERN);

  const date = dateOnlyMatch
    ? buildLocalDate(dateOnlyMatch[1], dateOnlyMatch[2], dateOnlyMatch[3])
    : compactDateMatch
      ? buildLocalDate(compactDateMatch[1], compactDateMatch[2], compactDateMatch[3])
      : new Date(dateValue);

  if (!date || Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
