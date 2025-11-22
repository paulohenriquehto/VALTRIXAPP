import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { useAuth } from './stores/appStore';
import Layout from './components/Layout';
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import Calendar from './pages/Calendar';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Tags from './pages/Tags';
import Team from './pages/Team';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Pricing from './pages/Pricing';
import Pomodoro from './pages/Pomodoro';
import './index.css';

function App() {
  const { isAuthenticated, setUser, setIsAuthenticated } = useAuth();

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          fullName: session.user.user_metadata?.full_name || 'Usuário',
          avatarUrl: session.user.user_metadata?.avatar_url || undefined,
          timezone: 'America/Sao_Paulo',
          theme: 'light',
          isActive: true,
          createdAt: session.user.created_at,
          updatedAt: session.user.updated_at || new Date().toISOString(),
        });
        setIsAuthenticated(true);
      }
    });

    // Escutar mudanças de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session: Session | null) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          fullName: session.user.user_metadata?.full_name || 'Usuário',
          avatarUrl: session.user.user_metadata?.avatar_url || undefined,
          timezone: 'America/Sao_Paulo',
          theme: 'light',
          isActive: true,
          createdAt: session.user.created_at,
          updatedAt: session.user.updated_at || new Date().toISOString(),
        });
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setIsAuthenticated]);

  return (
    <>
      <Router>
        <Routes>
          {/* Rotas públicas */}
          <Route
            path="/login"
            element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/register"
            element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" replace />}
          />

          {/* Rotas protegidas */}
          <Route
            path="/"
            element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="tasks/:id" element={<TaskDetail />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="clients" element={<Clients />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="tags" element={<Tags />} />
            <Route path="team" element={<Team />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="pomodoro" element={<Pomodoro />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Rota 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        expand={true}
        richColors
        closeButton
        duration={4000}
      />

      {/* PWA Update Prompt */}
      <PWAUpdatePrompt />
    </>
  );
}

export default App;