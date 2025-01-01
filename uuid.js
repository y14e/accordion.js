export function getUUID() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const a = URL.createObjectURL(new Blob()).slice(-36);
  URL.revokeObjectURL(a);
  return a;
}