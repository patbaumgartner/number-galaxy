import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import './App.css'
import HomePage from './pages/HomePage'
import GamePage from './pages/GamePage'
import HallOfFamePage from './pages/HallOfFamePage'
import SettingsPage from './pages/SettingsPage'
import ErrorBoundary from './components/ErrorBoundary'
import TimesTablesPage from './pages/TimesTablesPage'
import TableTrainerPage from './pages/TableTrainerPage'
import NumberBeamPage from './pages/NumberBeamPage'
import BeamDrillPage from './pages/BeamDrillPage'
import './timesTable.css'
import './beam.css'

export default function App() {
    return (
        <BrowserRouter basename="/math-invaders">
            <ErrorBoundary>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/game" element={<GamePage />} />
                    <Route path="/hall-of-fame" element={<HallOfFamePage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/times-tables" element={<TimesTablesPage />} />
                    <Route path="/times-tables/train/:planetId/:phase" element={<TableTrainerPage />} />
                    <Route path="/number-beam" element={<NumberBeamPage />} />
                    <Route path="/number-beam/drill/:skill" element={<BeamDrillPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </ErrorBoundary>
        </BrowserRouter>
    )
}
