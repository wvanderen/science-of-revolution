import { Route, Routes } from 'react-router-dom'
import AppLayout from '../sections/AppLayout'
import DashboardPage from '../pages/DashboardPage'
import InviteGatePage from '../pages/InviteGatePage'
import LoginPage from '../pages/LoginPage'
import { LibraryPage } from '../features/library/pages/LibraryPage'
import { ReaderPage } from '../features/reader/pages/ReaderPage'
import { ResourceUploadPage } from '../features/library/pages/ResourceUploadPage'

const AppRoutes = (): JSX.Element => (
  <Routes>
    <Route path="invite" element={<InviteGatePage />} />
    <Route path="login" element={<LoginPage />} />
    <Route path="*" element={<AppLayout />}>
      <Route index element={<DashboardPage />} />
      <Route path="library" element={<LibraryPage />} />
      <Route path="library/upload" element={<ResourceUploadPage />} />
      <Route path="reader/:resourceId" element={<ReaderPage />} />
    </Route>
  </Routes>
)

export default AppRoutes
