import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './features/auth/RequireAuth'
import { AppLayout } from './layouts/AppLayout'
import { MarketingLayout } from './layouts/MarketingLayout'
import { LoginPage } from './pages/LoginPage'
import { FootprintsPage } from './pages/app/FootprintsPage'
import { PlanPage } from './pages/app/PlanPage'
import { ReviewPage } from './pages/app/ReviewPage'
import { TodayPage } from './pages/app/TodayPage'
import { HomePage } from './pages/marketing/HomePage'
import { MethodPage } from './pages/marketing/MethodPage'
import { PricingPage } from './pages/marketing/PricingPage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MarketingLayout />}>
          <Route index element={<HomePage />} />
          <Route path="method" element={<MethodPage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="login" element={<LoginPage />} />
        </Route>

        <Route path="app" element={<AppLayout />}>
          <Route index element={<TodayPage />} />
          <Route
            path="plan"
            element={
              <RequireAuth>
                <PlanPage />
              </RequireAuth>
            }
          />
          <Route path="footprints" element={<FootprintsPage />} />
          <Route
            path="review"
            element={
              <RequireAuth>
                <ReviewPage />
              </RequireAuth>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
