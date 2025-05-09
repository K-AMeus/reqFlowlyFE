import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
  useNavigate,
} from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Login from "./components/Login";
import LandingPage from "./components/LandingPage";
import ProjectList from "./components/ProjectList";
import Project from "./components/Project";
import DomainObjectUseCases from "./components/DomainObjectUseCases";
import UseCaseTestCases from "./components/UseCaseTestCases";
import ToastContainer from "./components/ToastContainer";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ScrollToTop from "./hooks/ScrollToTop";
import ExportPage from "./components/ExportPage";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const AppRoutes = () => {
  const { currentUser, logout } = useAuth();

  return (
    <>
      <Header isLoggedIn={!!currentUser} onLogout={logout} />
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              currentUser ? <Navigate to="/projects" replace /> : <Login />
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId"
            element={
              <ProtectedRoute>
                <Project />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/domain-objects"
            element={
              <ProtectedRoute>
                <Project initialView="domain-objects" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/use-cases"
            element={
              <ProtectedRoute>
                <Project initialView="use-cases" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/use-cases/:requirementId"
            element={
              <ProtectedRoute>
                <Project initialView="use-cases" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/export/:requirementId"
            element={
              <ProtectedRoute>
                <Project initialView="export" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/requirements/:requirementId/generate-use-cases"
            element={
              <ProtectedRoute>
                <DomainObjectUseCasesRouteWrapper />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/requirements/:requirementId/use-cases/:useCaseId/generate-test-cases"
            element={
              <ProtectedRoute>
                <UseCaseTestCasesRouteWrapper />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/requirements/:requirementId/export"
            element={
              <ProtectedRoute>
                <ExportPageRouteWrapper />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:projectId/test-cases"
            element={
              <ProtectedRoute>
                <Project initialView="test-cases" />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
};

const DomainObjectUseCasesRouteWrapper = () => {
  const { projectId, requirementId } = useParams();

  if (!projectId || !requirementId) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <DomainObjectUseCases projectId={projectId} requirementId={requirementId} />
  );
};

const UseCaseTestCasesRouteWrapper = () => {
  const { projectId, requirementId, useCaseId } = useParams();
  const navigate = useNavigate();

  if (!projectId || !requirementId || !useCaseId) {
    return (
      <Navigate
        to={
          projectId && requirementId
            ? `/projects/${projectId}/use-cases/${requirementId}`
            : "/projects"
        }
        replace
      />
    );
  }

  return (
    <UseCaseTestCases
      projectId={projectId}
      requirementId={requirementId}
      initialUseCaseId={useCaseId}
      onClose={() =>
        navigate(
          projectId && requirementId
            ? `/projects/${projectId}/use-cases/${requirementId}`
            : `/projects/${projectId}/use-cases`
        )
      }
    />
  );
};

const ExportPageRouteWrapper = () => {
  const { projectId, requirementId } = useParams();

  if (!projectId || !requirementId) {
    return <Navigate to="/projects" replace />;
  }
  return <ExportPage />;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop>
          <AppRoutes />
          <ToastContainer />
        </ScrollToTop>
      </Router>
    </AuthProvider>
  );
};

export default App;
