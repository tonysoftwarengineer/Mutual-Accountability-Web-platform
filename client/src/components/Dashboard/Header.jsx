import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import useNotificationStore from "../../store/useNotificationStore";

const Header = ({ headerContent, currentView, authUser, goals, activePactsList }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);
  const { notifications, unreadCount, fetchNotifications, markAsRead } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getNotificationIconDetails = (type) => {
    switch (type) {
      case 'streak_reset':
        return { emoji: '🚨', bg: 'bg-red-50 text-red-600 border border-red-100' };
      case 'partnership_invite':
        return { emoji: '✉️', bg: 'bg-indigo-50 text-indigo-600 border border-indigo-100' };
      case 'partnership_accept':
        return { emoji: '🤝', bg: 'bg-emerald-50 text-emerald-600 border border-emerald-100' };
      case 'checkin_approved':
        return { emoji: '✅', bg: 'bg-teal-50 text-teal-650 border border-teal-100' };
      case 'comment':
        return { emoji: '💬', bg: 'bg-blue-50 text-blue-600 border border-blue-100' };
      case 'reaction':
        return { emoji: '🔥', bg: 'bg-orange-50 text-orange-600 border border-orange-100' };
      case 'reminder':
      default:
        return { emoji: '⚡', bg: 'bg-yellow-50 text-yellow-600 border border-yellow-100' };
    }
  };

  return (
    <header className="relative bg-gradient-to-r from-teal-50/30 via-white to-slate-50 border border-slate-200/80 rounded-2xl p-6 md:p-8 mb-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      {/* Decorative radial blur for a subtle premium glass glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#00685f]/5 rounded-full blur-3xl -z-10 pointer-events-none transform translate-x-12 -translate-y-12"></div>
      
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex w-14 h-14 rounded-xl bg-white border border-slate-200 shadow-sm items-center justify-center text-2xl">
          {headerContent.icon}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-[#e6f4f2] text-[#00685f] text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest border border-[#00685f]/15">
              {headerContent.badge}
            </span>
            {currentView === "dashboard" && authUser?.currentStreak > 0 && (
              <span className="bg-orange-50 text-[#c26d2e] text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border border-orange-100 flex items-center gap-1 animate-pulse">
                🔥 {authUser.currentStreak} day streak
              </span>
            )}
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
            {headerContent.title}
          </h2>
          <p className="text-gray-500 text-sm mt-1.5 font-medium leading-relaxed max-w-2xl">
            {headerContent.description}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 self-end md:self-auto">
        {currentView === "dashboard" && (
          <div className="hidden lg:flex flex-col items-end border-l border-slate-200 pl-6 h-10 justify-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Goals</span>
            <span className="text-lg font-extrabold text-[#00685f] leading-none mt-1">
              {goals.filter(g => g.status === 'active').length} Active
            </span>
          </div>
        )}
        {currentView === "goals" && (
          <Link
            to="/goals/new"
            className="bg-[#00685f] hover:bg-[#004d46] text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-sm border border-[#00685f]/10 flex items-center justify-center"
          >
            + Add New Goal
          </Link>
        )}
        {currentView === "partners" && activePactsList.length > 0 && (
          <div className="hidden lg:flex flex-col items-end border-l border-slate-200 pl-6 h-10 justify-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Pacts</span>
            <span className="text-lg font-extrabold text-[#00685f] leading-none mt-1">
              {activePactsList.length} Active
            </span>
          </div>
        )}
        
        <div className="flex items-center gap-3 relative">
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs text-slate-500 hover:text-slate-700 transition-colors hover:border-slate-300 relative"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className="fixed sm:absolute left-4 right-4 top-24 sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[100] origin-top">
                <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-bold text-sm text-gray-900 tracking-wide">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                <div className="max-h-[350px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map(n => {
                      const details = getNotificationIconDetails(n.type);
                      return (
                        <div 
                          key={n._id} 
                          onClick={() => { if(!n.read) markAsRead(n._id); }}
                          className={`p-4 border-b border-gray-50 hover:bg-slate-50 cursor-pointer transition-colors ${!n.read ? 'bg-emerald-50/30' : ''}`}
                        >
                          <div className="flex gap-3">
                            <div className={`w-8 h-8 rounded-full ${details.bg} flex items-center justify-center shrink-0`}>
                              <span className="text-sm">{details.emoji}</span>
                            </div>
                            <div>
                              <p className={`text-xs ${!n.read ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>
                                {n.message}
                              </p>
                              <span className="text-[10px] text-gray-400 mt-1 block font-medium">
                                {new Date(n.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-gray-400">
                      <span className="text-3xl opacity-50 mb-2 block">📭</span>
                      <p className="text-xs font-medium">No notifications yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <Link to="/settings" className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs text-slate-500 hover:text-slate-700 transition-colors hover:border-slate-300">
            ⚙️
          </Link>
          <div className="w-10 h-10 rounded-xl bg-gray-100 border border-slate-200 shadow-sm overflow-hidden shrink-0">
            <img src={`https://ui-avatars.com/api/?name=${authUser?.name || 'User'}&background=e6f4f2&color=00685f`} alt="Avatar" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
