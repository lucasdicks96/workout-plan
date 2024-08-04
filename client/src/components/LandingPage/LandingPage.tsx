import { useState } from "react";
// import Header from "../Header.tsx";
import LoginForm from "./Login/LoginForm.tsx";
import RegisterForm from "./Register/RegisterForm.tsx";
import Footer from "../Footer.tsx";
import styles from "../LandingPage.module.css";

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  // const [showButton, setShowButton] = useState(true);

  const handleLoginButtonClick = () => {
    setShowLogin(!showLogin);
  };
  const handleRegisterButtonClick = () => {
    setShowRegister(!showRegister);
  };

  return (
    <>
      <div className={styles.body}>
        <div className={styles.content}>
          <>
            <button onClick={handleLoginButtonClick}>Login</button>
            {showLogin && <LoginForm />}
          </>
          <>
            <button onClick={handleRegisterButtonClick}>Register</button>
            {showRegister && <RegisterForm />}
          </>
        </div>
        <Footer />
      </div>
    </>
  );
}
