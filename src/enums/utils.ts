
export const invertEnum = <E extends Record<string, string | number>>(enumeration: E) => {
  return Object.fromEntries(
    Object.entries(enumeration).map(([key, value]) => [value, key])
  ) as Record<E[keyof E], string>;
};