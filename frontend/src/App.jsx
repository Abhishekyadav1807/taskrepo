import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage.jsx";
import { AppHomePage } from "./pages/AppHomePage.jsx";
import { EntityPage } from "./pages/EntityPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/app" element={<AppHomePage />} />
      <Route path="/app/:entity" element={<EntityPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
