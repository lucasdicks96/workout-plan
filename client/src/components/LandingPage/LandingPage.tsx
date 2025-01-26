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
            <Link to="/login" className={styles.button}>
              Login
            </Link>

            <Link to="/register" className={styles.button}>
              Register
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
