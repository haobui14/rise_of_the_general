import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CreatePlayerPage } from './pages/CreatePlayerPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { BattlePage } from './pages/BattlePage';
import { RankPage } from './pages/RankPage';
import { InventoryPage } from './pages/InventoryPage';
import { GeneralsPage } from './pages/GeneralsPage';
import { ArmyPage } from './pages/ArmyPage';
import { WorldPage } from './pages/WorldPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { DynastyPage } from './pages/DynastyPage';
import { CharactersPage } from './pages/CharactersPage';
import { SuccessionPage } from './pages/SuccessionPage';
import { PoliticsPage } from './pages/PoliticsPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/create" element={<CreatePlayerPage />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/battle" element={<BattlePage />} />
        <Route path="/rank" element={<RankPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/generals" element={<GeneralsPage />} />
        <Route path="/army" element={<ArmyPage />} />
        <Route path="/world" element={<WorldPage />} />
        <Route path="/campaigns" element={<CampaignsPage />} />
        <Route path="/dynasty" element={<DynastyPage />} />
        <Route path="/characters" element={<CharactersPage />} />
        <Route path="/succession" element={<SuccessionPage />} />
        <Route path="/politics" element={<PoliticsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
