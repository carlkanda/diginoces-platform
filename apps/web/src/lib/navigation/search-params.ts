export function searchParamText(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = searchParams[key];

  return typeof value === "string" ? value : undefined;
}
