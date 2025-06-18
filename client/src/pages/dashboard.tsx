import Sidebar from "@/components/sidebar";
import DashboardStats from "@/components/dashboard-stats";
import ExpenseTable from "@/components/expense-table";
import ExpenseModal from "@/components/expense-modal";
import SignupModal from "@/components/signup-modal";

export default function Dashboard() {
  const user = { role: "admin" }; // Mock user object for demonstration
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <div className="lg:pl-64">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-600 mt-1">Gerencie suas despesas de forma eficiente</p>
              </div>
              <div className="flex gap-2">
                <ExpenseModal />
                {user?.role === "admin" && <SignupModal />}
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