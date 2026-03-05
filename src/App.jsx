import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './views/Dashboard.jsx';
import Placeholder from './views/Placeholder.jsx';
import Leads from './views/Leads.jsx';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="leads" element={<Leads />} />
                    <Route path="contacts" element={<Placeholder title="Contacts" />} />
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
