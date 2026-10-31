import { Routes, Route, Navigate } from "react-router-dom";
import { useApp } from "./context";
import Layout from "./components/Layout";
import { Spinner } from "./components/ui";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Farms from "./pages/Farms";
import Weather from "./pages/Weather";
import Irrigation from "./pages/Irrigation";
import Water from "./pages/Water";
import Crops from "./pages/Crops";
import Assistant from "./pages/Assistant";
import Tips from "./pages/Tips";
import Reports from "./pages/Reports";

export default function App() {
  const { user, booting } = useApp();
  if (booting) return <Spinner />;
  if (!user) return <Login />;
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/farms" element={<Farms />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/irrigation" element={<Irrigation />} />
        <Route path="/water" element={<Water />} />
        <Route path="/crops" element={<Crops />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/tips" element={<Tips />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}
