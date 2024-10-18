import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./Dashboard.module.css";

export default function Logout() {
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/users/logout",
        {},
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            // "Access-Control-Allow-Origin": "http://localhost:5173/",
            // "Access-Control-Allow-Credentials": true,
            // "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
          },
        }
      );
      console.log(response.data);

      if (response.status === 200) {
        navigate("/");
      }
      console.log(response);
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <button className={styles.button} type="submit" onClick={handleLogout}>
      Logout
    </button>
  );
}
