import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import styles from "../../styles/Layout.module.css";

function DashboardLayout() {
  return (
    <div className={styles.mainLayout}>
      <Sidebar />
      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
}
export default DashboardLayout;
