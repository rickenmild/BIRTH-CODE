import { HashRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CollectionDetailPage } from './pages/CollectionDetail';
import { CollectionPage } from './pages/Collection';
import { HomePage } from './pages/Home';
import { LoadingPage } from './pages/DiagnosisLoading';
import { ProfileInputPage } from './pages/ProfileInput';
import { BoardPage, PedalPage, ResultPage } from './pages/ResultPages';
import { SettingsPage } from './pages/Settings';
import { NotFound } from './components/common';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="profile" element={<ProfileInputPage />} />
          <Route path="loading" element={<LoadingPage />} />
          <Route path="result/:id" element={<ResultPage />} />
          <Route path="board/:id" element={<BoardPage />} />
          <Route path="pedal/:id" element={<PedalPage />} />
          <Route path="collection" element={<CollectionPage />} />
          <Route path="collection/:personId" element={<CollectionDetailPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound message="ページが見つかりませんでした。" />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
