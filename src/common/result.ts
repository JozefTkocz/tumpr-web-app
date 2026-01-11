export type Result<T> =
  | {
    ok: T;
    error: null;
  }
  | { ok: null; error: Error };
