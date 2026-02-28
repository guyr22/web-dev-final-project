import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { Navbar, Container, Nav } from 'react-bootstrap';
import { GoogleOAuthProvider } from '@react-oauth/google';
import FeedPage from './pages/FeedPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Route guard – redirects unauthenticated users to /login
// ---------------------------------------------------------------------------
function PrivateRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// ---------------------------------------------------------------------------
// App shell
// ---------------------------------------------------------------------------
function AppShell() {
  const { isAuthenticated, logout } = useAuth();
  const { pathname } = useLocation();
  const hideNav = pathname === '/login' || pathname === '/register';

  return (
    <>
      {!hideNav && (
        <Navbar bg="dark" data-bs-theme="dark" className="shadow-sm sticky-top">
          <Container>
            <Navbar.Brand href="/feed" className="fw-bold fs-4">ShlakshukGram</Navbar.Brand>
            {isAuthenticated && (
              <Nav className="ms-auto">
                <Nav.Link onClick={logout} className="text-white-50">Sign out</Nav.Link>
              </Nav>
            )}
          </Container>
        </Navbar>
      )}
      <Routes>
        <Route path="/" element={<Navigate to="/feed" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/feed"
          element={
            <PrivateRoute>
              <FeedPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </>
  );
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------
function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;

