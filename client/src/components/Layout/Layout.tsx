import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import styles from "../../styles/Layout.module.css";
import { useState } from "react";
import { TitleContext } from "../../context/TitleContext";

function Layout() {
  const [title, setTitle] = useState<string>("");
  return (
    <TitleContext.Provider value={setTitle}>
      <div className={styles.layout}>
        <Sidebar />
        <div className={styles.wrapper}>
          <h1 className={styles.title}>{title}</h1>
          <main className={styles.content}>
            <Outlet />
          </main>
        </div>
      </div>
    </TitleContext.Provider>
  );
}
export default Layout;
