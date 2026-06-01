import { Link } from "react-router-dom";

const Sidebar = ({ currentView, sidebarOpen, logout }) => {
  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#f8fafc] border-r border-gray-200 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0 flex flex-col justify-between ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
      <div>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-[#00685f] tracking-tight">MUTUAL</h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">Progress as a Path</p>
        </div>
        <nav className="px-4 space-y-1 mt-4">
          <Link
            to="/dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${currentView === "dashboard" ? "bg-[#00685f] text-white" : "text-gray-500 hover:bg-gray-100"}`}
          >
            <span className="text-lg">📊</span> Dashboard
          </Link>
          <Link
            to="/goals"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${currentView === "goals" ? "bg-[#00685f] text-white" : "text-gray-500 hover:bg-gray-100"}`}
          >
            <span className="text-lg">🎯</span> My Goals
          </Link>
          <Link
            to="/partners"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${currentView === "partners" ? "bg-[#00685f] text-white" : "text-gray-500 hover:bg-gray-100"}`}
          >
            <span className="text-lg">🤝</span> Partners
          </Link>
          <Link
            to="/community"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${currentView === "community" ? "bg-[#00685f] text-white" : "text-gray-500 hover:bg-gray-100"}`}
          >
            <span className="text-lg">💬</span> Community
          </Link>
          <Link
            to="/profile"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${currentView === "profile" ? "bg-[#00685f] text-white" : "text-gray-500 hover:bg-gray-100"}`}
          >
            <span className="text-lg">👤</span> Profile
          </Link>
          <Link
            to="/settings"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-colors ${currentView === "settings" ? "bg-[#00685f] text-white" : "text-gray-500 hover:bg-gray-100"}`}
          >
            <span className="text-lg">⚙️</span> Settings
          </Link>
        </nav>
      </div>
      <div className="p-6 space-y-4">
        <Link
          to="/goals/new"
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg font-medium text-sm text-white bg-[#00685f] hover:bg-[#004d46] transition-colors shadow-sm justify-center"
        >
          <span className="text-lg">✨</span> New Goal
        </Link>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg font-medium text-sm text-red-600 bg-red-50 border border-red-200/40 hover:bg-red-100 hover:text-red-700 transition-colors duration-200 shadow-xs"
        >
          <span className="text-lg">🚪</span> Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
