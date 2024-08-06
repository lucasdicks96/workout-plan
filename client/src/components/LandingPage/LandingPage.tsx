import { Link } from "react-router-dom";
import Footer from "../Footer.tsx";
import styles from "./LandingPage.module.css";

export default function LandingPage() {
  // const [showLogin, setShowLogin] = useState<boolean>(false);
  // const [showRegister, setShowRegister] = useState<boolean>(false);
  // const [isActive, setIsActive] = useState<boolean>(true);

  // const handleLoginButtonClick = () => {
  //   setShowLogin(!showLogin);
  //   setIsActive(!isActive);
  // };
  // const handleRegisterButtonClick = () => {
  //   setShowRegister(!showRegister);
  //   setIsActive(!isActive);
  // };

  return (
    <>
      <div className={styles.body}>
        <div className={styles.content}>
          <div className={styles.button_group}>
            <div className={styles.button}>
              <Link to="login">Login</Link>
            </div>
            <div className={styles.button}>
              <Link to="register">Register</Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
