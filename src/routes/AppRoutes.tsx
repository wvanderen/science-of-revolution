import { Route, Routes } from 'react-router-dom'
import AppLayout from '../sections/AppLayout'
import DashboardPage from '../pages/DashboardPage'
import InviteGatePage from '../pages/InviteGatePage'
import LoginPage from '../pages/LoginPage'
import { LibraryPage } from '../features/library/pages/LibraryPage'
import { ReaderPage } from '../features/reader/pages/ReaderPage'
import { ResourceUploadPage } from '../features/library/pages/ResourceUploadPage'
import { EducationPlansPage } from '../features/education-plans/pages/EducationPlansPage'
import { MyPlansPage } from '../features/education-plans/pages/MyPlansPage'
import { TopicDetailPage } from '../features/education-plans/pages/TopicDetailPage'

const AppRoutes = (): JSX.Element => (
  <Routes>
    <Route path="invite" element={<InviteGatePage />} />
    <Route path="login" element={<LoginPage />} />
    <Route path="*" element={<AppLayout />}>
      <Route index element={<DashboardPage />} />
      <Route path="library" element={<LibraryPage />} />
      <Route path="library/upload" element={<ResourceUploadPage />} />
      <Route path="reader/:resourceId" element={<ReaderPage />} />
      <Route path="education-plans/my-plans" element={<MyPlansPage />} />
      <Route path="education-plans/topics/:topicId" element={<TopicDetailPage />} />
      <Route path="education-plans/:planId" element={<EducationPlansPage />} />
      <Route path="education-plans" element={<EducationPlansPage />} />
    </Route>
  </Routes>
)

export default AppRoutes
