import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./Dashboard.module.css";

export default function Logout() {
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      const response = await axios.get("http://localhost:5000/logout");
      if (response.status === 200) {
        navigate("/");
      }
      console.log(response);
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <button
      className={styles.button}
      type="submit"
      formMethod="GET"
      onClick={handleLogout}
    >
      Logout
    </button>
  );
}
