import { Route, Routes } from 'react-router-dom'
import AppLayout from '../sections/AppLayout'
import DashboardPage from '../pages/DashboardPage'
import InviteGatePage from '../pages/InviteGatePage'
import { LibraryPage } from '../features/library/pages/LibraryPage'
import { ReaderPage } from '../features/reader/pages/ReaderPage'

const AppRoutes = (): JSX.Element => (
  <Routes>
    <Route path="invite" element={<InviteGatePage />} />
    <Route path="*" element={<AppLayout />}>
      <Route index element={<DashboardPage />} />
      <Route path="library" element={<LibraryPage />} />
      <Route path="reader/:resourceId" element={<ReaderPage />} />
    </Route>
  </Routes>
)

export default AppRoutes
