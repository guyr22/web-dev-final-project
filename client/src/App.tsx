import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { GoogleOAuthProvider } from '@react-oauth/google';
import FeedPage from './pages/FeedPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import CommentsPage from './pages/CommentsPage';
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
        <Navbar expand="lg" className="glass-nav sticky-top py-3">
          <Container>
            <Navbar.Brand href="/feed" className="fw-bold fs-3 text-white d-flex align-items-center gap-2">
              <span style={{ fontSize: '1.5rem' }}>✨</span>
              <span className="text-gradient">ShlakshukGram</span>
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" className="border-0 shadow-none">
               <span className="navbar-toggler-icon" style={{ filter: 'invert(1)' }}></span>
            </Navbar.Toggle>
            <Navbar.Collapse id="basic-navbar-nav">
              {isAuthenticated && (
                <Nav className="ms-auto align-items-center gap-3 mt-3 mt-lg-0">
                  <Nav.Link href="/feed" className="text-muted hover-white fw-medium">Home</Nav.Link>
                  <Nav.Link href="/profile" className="text-muted hover-white fw-medium">Profile</Nav.Link>
                  <Button variant="link" onClick={logout} className="text-muted hover-white fw-medium text-decoration-none p-0">
                    Sign out
                  </Button>
                </Nav>
              )}
            </Navbar.Collapse>
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
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/posts/:postId/comments"
          element={
            <PrivateRoute>
              <CommentsPage />
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
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;

