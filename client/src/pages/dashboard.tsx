import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import DashboardStats from "@/components/dashboard-stats";
import ExpenseTable from "@/components/expense-table";
import ExpenseModal from "@/components/expense-modal";
import SignupModal from "@/components/signup-modal";
import { authApi } from "@/lib/auth";

export default function Dashboard() {
  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: authApi.getCurrentUser,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className="lg:pl-64">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-xs sm:text-sm text-gray-600">Gerencie suas despesas de forma eficiente</p>
              </div>
              <div className="flex justify-end">
                <ExpenseModal />
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          <DashboardStats />
          <ExpenseTable />
        </main>
      </div>
    </div>
  );
}