import styles from "./LandingPage.module.css";

export default function Header() {
  return (
    <>
      <div className={styles.header}>
      <div className={styles.header_navbar}>
        <ul>
          <li>Login</li>
          <li>Register</li>
        </ul>
      </div>
      </div>
    </>
  );
}
