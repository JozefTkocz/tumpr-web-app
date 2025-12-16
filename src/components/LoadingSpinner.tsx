import styles from "./Loader.module.css";

export function DataLoadingSpinner({ text }: { text: string | undefined }) {
  return (
    <>
      {text}
      <span className={styles.loader}></span>
    </>
  );
}
