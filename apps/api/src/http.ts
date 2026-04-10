export function ok<T>(data: T) {
  return {
    success: true,
    data,
  };
}

export function fail(message: string, details?: unknown) {
  return {
    success: false,
    error: message,
    details: details ?? null,
  };
}
