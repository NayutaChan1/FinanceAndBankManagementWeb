import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import LoginPage from "./Page/LoginPage.tsx";
import RegisterPage from "./Page/RegisterPage.tsx";
import DashboardPage from "./Page/DashboardPage.tsx";
import UploadFilePage from "./Page/UploadFilePage.tsx";
import TransactionsPage from "./Page/TransactionsPage.tsx";
import AnalyticsPage from "./Page/AnalyticsPage.tsx";
import GoalsPage from "./Page/GoalsPage.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      {/* <App /> */}
      <Routes>
        <Route path="/" element={<LoginPage></LoginPage>} />
        <Route path="/register" element={<RegisterPage></RegisterPage>} />
        <Route path="/dashboard" element={<DashboardPage></DashboardPage>} />
        <Route path="/transactions" element={<TransactionsPage></TransactionsPage>} />
        <Route path="/analytics" element={<AnalyticsPage></AnalyticsPage>} />
        <Route path="/goals" element={<GoalsPage></GoalsPage>} />
        <Route path="/uploadfile" element={<UploadFilePage></UploadFilePage>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
