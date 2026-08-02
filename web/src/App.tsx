import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import './App.css'
import HomePage from './pages/HomePage'
import GamePage from './pages/GamePage'
import HallOfFamePage from './pages/HallOfFamePage'
import SettingsPage from './pages/SettingsPage'
import ErrorBoundary from './components/ErrorBoundary'
import TimesTablesPage from './pages/TimesTablesPage'
import TableTrainerPage from './pages/TableTrainerPage'
import './timesTable.css'

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
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </ErrorBoundary>
        </BrowserRouter>
    )
}
