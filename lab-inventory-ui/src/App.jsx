import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Assets from "./pages/Assets";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import AssetDetails from "./pages/AssetDetails";
import Containers from "./pages/Containers";
import ContainerDetails from "./pages/ContainerDetails";
import MoveContainer from "./pages/MoveContainer";
import RequireAdmin from "./components/RequireAdmin";
import AdminUsers from "./pages/AdminUsers";
import Locations from "./pages/Locations";
import LocationDetails from "./pages/LocationDetails";
import AdminUserCreate from "./pages/AdminUserCreate";
import AdminUserEdit from "./pages/AdminUserEdit";
import History from "./pages/History";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Assets />} />
                <Route path="/assets/:id" element={<AssetDetails />} />
                <Route path="/containers" element={<Containers />} />
                <Route path="/containers/:id" element={<ContainerDetails />} />
                <Route path="/containers/:id/move" element={<MoveContainer />} />
                <Route path="/admin/users" element={<RequireAdmin> <AdminUsers /> </RequireAdmin>}/>
                <Route path="/locations" element={<Locations />} />
                <Route path="/locations/:id" element={<LocationDetails />} />
                <Route path="/admin/users/create" element={<AdminUserCreate />} />
                <Route path="/admin/users/:id/edit" element={<AdminUserEdit />} />
                <Route path="/history" element={<History />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
