import axios from "axios";
import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import styles from "./Dashboard.module.css";
import Header from "./Logout";

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const navigate = useNavigate();

  // // useEffect-Hook zur Ausführung des Authentifizierungschecks beim Mounten des Components
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await axios.get("http://localhost:5000/users/users", {
        withCredentials: true,
      });

      if (response.status === 200 || response.status === 201) {
        console.log(response.data);
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error("Not logged in!");
      setIsAuthenticated(false);
      navigate("/");
    }
  }

  return (
    <div className={styles.body}>
      <div className={styles.content}>
        {isAuthenticated ? (
          <>
            <div className={styles.side}>
              <Header />
              <nav className={styles.menu}>
                <Link to="exercises">Exercises</Link>
                <Link to="workouts">Workouts</Link>
                <Link to="history">Workout history</Link>
              </nav>
            </div>
            <div className={styles.contentChild}>
              <Outlet />
            </div>
          </>
        ) : (
          "Loading..."
        )}
      </div>
    </div>
  );
}
