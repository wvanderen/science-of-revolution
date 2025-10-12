import { Route, Routes } from 'react-router-dom'
import AppLayout from '../sections/AppLayout'
import DashboardPage from '../pages/DashboardPage'
import InviteGatePage from '../pages/InviteGatePage'

const AppRoutes = (): JSX.Element => (
  <Routes>
    <Route path="invite" element={<InviteGatePage />} />
    <Route path="*" element={<AppLayout />}> 
      <Route index element={<DashboardPage />} />
    </Route>
  </Routes>
)

export default AppRoutes
