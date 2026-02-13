import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CreatePlayerPage } from './pages/CreatePlayerPage';
import { DashboardPage } from './pages/DashboardPage';
import { BattlePage } from './pages/BattlePage';
import { RankPage } from './pages/RankPage';
import { InventoryPage } from './pages/InventoryPage';
import { GeneralsPage } from './pages/GeneralsPage';

export function App() {
  return (
    <Routes>
      <Route path="/create" element={<CreatePlayerPage />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/battle" element={<BattlePage />} />
        <Route path="/rank" element={<RankPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/generals" element={<GeneralsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
