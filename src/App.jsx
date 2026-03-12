import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './views/Login.jsx';
import Layout from './components/Layout.jsx';
import Dashboard from './views/Dashboard.jsx';
import Placeholder from './views/Placeholder.jsx';
import Leads from './views/Leads.jsx';
import { isAuthenticatedFunc } from './utils/auth.js';
import RecuperarPassword from "./views/RecuperarPassword";
import Contacts from './views/Contacts.jsx';

function App() {
    // Al cargar la app verificamos si hay un token válido guardado en localStorage
    const [isAuthenticated, setIsAuthenticated] = useState(isAuthenticatedFunc());

    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/login"
                    element={isAuthenticated ? <Navigate to="/" replace /> : <Login onLogin={() => setIsAuthenticated(true)} />}
                />
                <Route path="/recuperar-password" element={<RecuperarPassword />} />
                <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}>
                    <Route index element={<Dashboard />} />
                    <Route path="leads" element={<Leads />} />
                    <Route path="contacts" element={<Contacts />} />
                    <Route path="properties" element={<Placeholder title="Properties" />} />
                    <Route path="opportunities" element={<Placeholder title="Opportunities" />} />
                    <Route path="account" element={<Placeholder title="Account" />} />
                    <Route path="invoices" element={<Placeholder title="Invoices" />} />
                    <Route path="tasks" element={<Placeholder title="Tasks" />} />
                    <Route path="meetings" element={<Placeholder title="Meetings" />} />
                    <Route path="calls" element={<Placeholder title="Calls" />} />
                    <Route path="emails" element={<Placeholder title="Emails" />} />
                    <Route path="email-templates" element={<Placeholder title="Email Templates" />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
