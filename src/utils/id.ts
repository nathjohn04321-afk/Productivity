let counter = 0;

/** Time-ordered unique id; no native crypto dependency required. */
export function generateId(): string {
  counter = (counter + 1) % 1_000_000;
  return `${Date.now().toString(36)}${counter
    .toString(36)
    .padStart(4, '0')}${Math.random().toString(36).slice(2, 8)}`;
}
