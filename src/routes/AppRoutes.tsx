import { BrowserRouter, Navigate, Route, Routes } from 'react-router'

import { APP_ROLES } from '@/config/constants.ts'
import { AuthProvider } from '@/features/auth/AuthProvider.tsx'
import { AppLayout } from '@/layouts/AppLayout.tsx'
import { AuthLayout } from '@/layouts/AuthLayout.tsx'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage.tsx'
import { HomePage } from '@/pages/HomePage.tsx'
import { InactiveAccountPage } from '@/pages/InactiveAccountPage.tsx'
import { LoginPage } from '@/pages/LoginPage.tsx'
import { NotFoundPage } from '@/pages/NotFoundPage.tsx'
import { ProfilePage } from '@/pages/ProfilePage.tsx'
import { ProgressFormPage } from '@/pages/ProgressFormPage.tsx'
import { ProgressPage } from '@/pages/ProgressPage.tsx'
import { RoadmapPage } from '@/pages/RoadmapPage.tsx'
import { StageDetailPage } from '@/pages/StageDetailPage.tsx'
import { TaskDetailPage } from '@/pages/TaskDetailPage.tsx'
import { TaskFormPage } from '@/pages/TaskFormPage.tsx'
import { TasksPage } from '@/pages/TasksPage.tsx'
import { TeamPage } from '@/pages/TeamPage.tsx'
import { UpdatePasswordPage } from '@/pages/UpdatePasswordPage.tsx'
import { ProtectedRoute } from '@/routes/ProtectedRoute.tsx'
import { RequireRole } from '@/routes/RequireRole.tsx'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="iniciar-sesion" element={<LoginPage />} />
            <Route path="recuperar-contrasena" element={<ForgotPasswordPage />} />
            <Route path="actualizar-contrasena" element={<UpdatePasswordPage />} />
          </Route>
          <Route path="cuenta-inactiva" element={<InactiveAccountPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route path="ruta" element={<RoadmapPage />} />
              <Route path="ruta/:slug" element={<StageDetailPage />} />
              <Route path="tareas" element={<TasksPage />} />
              <Route path="tareas/nueva" element={<TaskFormPage />} />
              <Route path="tareas/:taskId/editar" element={<TaskFormPage />} />
              <Route path="tareas/:taskId" element={<TaskDetailPage />} />
              <Route path="avances" element={<ProgressPage />} />
              <Route path="avances/nuevo" element={<ProgressFormPage />} />
              <Route path="perfil" element={<ProfilePage />} />
              <Route element={<RequireRole roles={[APP_ROLES.administrador, APP_ROLES.socio]} />}>
                <Route path="equipo" element={<TeamPage />} />
              </Route>
              <Route path="inicio" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
