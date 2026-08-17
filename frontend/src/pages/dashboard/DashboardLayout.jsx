import { useNavigate } from 'react-router';

import DashboardSidebar from '../../pages/dashboard/DashboardSidebar';

function DashboardLayout({ children }) {
  const navigate = useNavigate();

  function openCompose() {
    navigate('/compose');
  }

  return (
    <div className="min-h-screen bg-gray-100">

      <main className="mx-auto flex max-w-7xl gap-6 px-6 py-6 pb-8">

        {/* Sidebar */}
        <DashboardSidebar
          onCompose={openCompose}
        />

        {/* Page Content */}
        <section className="min-w-0 flex-1">
          {children}
        </section>

      </main>

    </div>
  );
}

export default DashboardLayout;