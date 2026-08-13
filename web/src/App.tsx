import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import './styles/index.css'
import HomePage from './pages/HomePage'
import ArcadePage from './pages/ArcadePage'
import GamePage from './pages/GamePage'
import DuelSetupPage from './pages/DuelSetupPage'
import DuelPlayPage from './pages/DuelPlayPage'
import HallOfFamePage from './pages/HallOfFamePage'
import SettingsPage from './pages/SettingsPage'
import ErrorBoundary from './components/ErrorBoundary'
import TimesTablesPage from './pages/TimesTablesPage'
import TableTrainerPage from './pages/TableTrainerPage'
import NumberBeamPage from './pages/NumberBeamPage'
import BeamDrillPage from './pages/BeamDrillPage'
import NumberSensePage from './pages/NumberSensePage'
import SenseDrillPage from './pages/SenseDrillPage'
import SensePlayPage from './pages/SensePlayPage'
import ProgressPage from './pages/ProgressPage'
import PrintablesPage from './pages/PrintablesPage'

export default function App() {
    return (
        <BrowserRouter basename={import.meta.env.BASE_URL}>
            <ErrorBoundary>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/game" element={<ArcadePage />} />
                    <Route path="/game/play" element={<GamePage />} />
                    <Route path="/game/two" element={<DuelSetupPage />} />
                    <Route path="/game/two/play" element={<DuelPlayPage />} />
                    <Route path="/hall-of-fame" element={<HallOfFamePage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/progress" element={<ProgressPage />} />
                    <Route path="/printables" element={<PrintablesPage />} />
                    <Route path="/times-tables" element={<TimesTablesPage />} />
                    <Route path="/times-tables/train/:planetId/:phase" element={<TableTrainerPage />} />
                    <Route path="/number-beam" element={<NumberBeamPage />} />
                    <Route path="/number-beam/drill/:skill" element={<BeamDrillPage />} />
                    <Route path="/number-sense" element={<NumberSensePage />} />
                    <Route path="/number-sense/play" element={<SensePlayPage />} />
                    <Route path="/number-sense/drill/:skill" element={<SenseDrillPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </ErrorBoundary>
        </BrowserRouter>
    )
}
