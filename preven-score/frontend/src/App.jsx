import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import DetailView from './components/DetailView';
import AgendaView from './components/AgendaView';
import SimulatorView from './components/SimulatorView';
import HistoricoView from './components/HistoricoView';
import InfoView from './components/InfoView';
import { LayoutDashboard, CalendarDays, FlaskConical, TrendingUp, Info } from 'lucide-react';
import './styles/achs-tokens.css';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon">PR</div>
            <div className="logo-text">Preven-Score</div>
          </div>
          <nav className="sidebar-nav">
            <NavLink to="/" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <LayoutDashboard size={20}/> <span>Ranking</span>
            </NavLink>
            <NavLink to="/agenda" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <CalendarDays size={20}/> <span>Agenda</span>
            </NavLink>
            <NavLink to="/historico" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <TrendingUp size={20}/> <span>Histórico</span>
            </NavLink>
            <NavLink to="/simulator" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <FlaskConical size={20}/> <span>Simulador</span>
            </NavLink>
            <NavLink to="/info" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
              <Info size={20}/> <span>Cálculo del Score</span>
            </NavLink>
          </nav>
        </aside>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/empresa/:id" element={<DetailView />} />
            <Route path="/agenda" element={<AgendaView />} />
            <Route path="/historico" element={<HistoricoView />} />
            <Route path="/simulator" element={<SimulatorView />} />
            <Route path="/info" element={<InfoView />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
