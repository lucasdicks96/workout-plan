// import React from "react";
// import ReactDom from "reac-dom/client";
import { Link, Outlet } from "react-router-dom";
// import Footer from "../Footer";
import Header from "./Logout";
// import stylesLandingPage from "../LandingPage/LandingPage.module.css";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  return (
    <div className={styles.body}>
      <div className={styles.content}>
        <div className={styles.side}>
          <Header />
          <nav className={styles.menu}>
            <Link to="exercises">Exercises</Link>
            <Link to="workouts">Workouts</Link>
            {/* <Link to="#">edit Exercise</Link> */}
            {/* <Link to="#">edit Workout</Link> */}
            {/* <Link to="#">Workouts</Link> */}
            <Link to="history">Workout history</Link>
          </nav>
        </div>
        <div className={styles.contentChild}>
          <Outlet />
        </div>
      </div>
      {/* <Footer /> */}
    </div>
  );
}
