import styles from "./LandingPage/LandingPage.module.css";

export default function Footer() {
  const date = new Date().getFullYear();
  return (
    <>
      <div className={styles.footer}>
        <div className={styles.footer_content}>Copyright {date}</div>
      </div>
    </>
  );
}
