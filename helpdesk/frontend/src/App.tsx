import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import UsersPage from './pages/admin/UsersPage';
import NewTicketPage from './pages/tickets/NewTicketPage';
import MyTicketsPage from './pages/tickets/MyTicketsPage';
import TicketListPage from './pages/tickets/TicketListPage';
import TicketDetailPage from './pages/tickets/TicketDetailPage';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Protected routes (any authenticated user) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/tickets/:id" element={<TicketDetailPage />} />
            </Route>

            {/* Customer-only routes */}
            <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
              <Route path="/tickets/new" element={<NewTicketPage />} />
              <Route path="/tickets/mine" element={<MyTicketsPage />} />
            </Route>

            {/* Agent/Admin routes */}
            <Route element={<ProtectedRoute allowedRoles={['agent', 'admin']} />}>
              <Route path="/tickets" element={<TicketListPage />} />
            </Route>

            {/* Admin-only routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin/users" element={<UsersPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
