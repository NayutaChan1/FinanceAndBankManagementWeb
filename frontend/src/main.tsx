import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
// import App from './App.tsx'
import LoginPage from './Page/LoginPage.tsx'
import RegisterPage from './Page/RegisterPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {/* <App /> */}
      <Routes>
        <Route path='/' element={<LoginPage></LoginPage>} />
        <Route path='/register' element={<RegisterPage></RegisterPage>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
