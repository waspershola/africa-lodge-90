export function timeout<T>(ms: number, err = new Error('timeout')): Promise<T> {
  return new Promise<T>((_, reject) => setTimeout(() => reject(err), ms));
}
