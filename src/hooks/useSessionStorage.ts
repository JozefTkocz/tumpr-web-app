import { useEffect } from "react";

export function useSessionStorage({
  key,
  initialValue,
}: {
  key: string;
  initialValue?: string;
}) {
  useEffect(() => {
    initialValue && globalThis.sessionStorage.setItem(key, initialValue);
  }, []);

  const value = globalThis.sessionStorage.getItem(key);

  return {
    value,
    setValue: (value: string) => globalThis.sessionStorage.setItem(key, value),
    clearValue: () => globalThis.sessionStorage.removeItem(key),
  };
}

export function useSessionObjectStorage<T>({
  key,
  initialValue,
}: {
  key: string;
  initialValue?: T;
}) {
  const { value, setValue, clearValue } = useSessionStorage({
    key,
    initialValue: initialValue ? JSON.stringify(initialValue) : undefined,
  });
  const object = value ? (JSON.parse(value) as T) : null;
  const setObject = (object: T) => setValue(JSON.stringify(object));
  return {
    value: object,
    setValue: setObject,
    clearValue,
  };
}
