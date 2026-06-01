import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useGoalStore } from "../store/useGoalStore";
import { usePartnershipStore } from "../store/usePartnershipStore";
import Sidebar from "./Dashboard/Sidebar";
import Header from "./Dashboard/Header";
import CheckInModal from "./Modals/CheckInModal";
import { connectSocket, disconnectSocket } from '../lib/socket';
import useNotificationStore from "../store/useNotificationStore";

const DashboardLayout = () => {
  const { authUser, logout, updateProfileSettings, checkAuth } = useAuthStore();
  const { goals, createGoal, toggleMilestone, fetchGoals, submitCheckIn, isLoading: isGoalsLoading, checkInHistory, fetchCheckInHistory } = useGoalStore();
  const { addNotification, fetchNotifications } = useNotificationStore();

  const {
    feed,
    feedHasMore,
    feedIsLoadingMore,
    publicFeed,
    publicFeedHasMore,
    publicFeedIsLoadingMore,
    leaderboard,
    approveCheckin,
    partner,
    activePartners,
    activePartnershipData,
    searchUser,
    sendInvite,
    partnerships,
    fetchPartnerships,
    respondToInvite,
    fetchActivePartnership,
    fetchFeed,
    fetchMoreFeed,
    fetchPublicFeed,
    fetchMorePublicFeed,
    fetchLeaderboard,
    dissolvePartnership,
    sendNudge,
    sendReaction,
    addComment
  } = usePartnershipStore();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Navigation & View State
  const [settingsTimezone, setSettingsTimezone] = useState(authUser?.timezone || "UTC");
  const [settingsBio, setSettingsBio] = useState(authUser?.bio || "");
  const [settingsCategories, setSettingsCategories] = useState(authUser?.categories || []);

  // Sync state with authUser updates using render-phase adjustment pattern (React recommended)
  const [prevAuthUser, setPrevAuthUser] = useState(authUser);
  if (authUser !== prevAuthUser) {
    setPrevAuthUser(authUser);
    setSettingsTimezone(authUser?.timezone || "UTC");
    setSettingsBio(authUser?.bio || "");
    setSettingsCategories(authUser?.categories || []);
  }

  const activePartnersList = activePartners && activePartners.length > 0
    ? activePartners
    : (partner ? [partner] : []);

  const activePactsList = (() => {
    if (!activePartnershipData) {
      return activePartnersList.map(p => ({
        id: p._id || "mock-id",
        partner: p,
        goalTitle: "Custom Goal",
        progress: 45
      }));
    }
    if (Array.isArray(activePartnershipData)) {
      return activePartnershipData.map(p => {
        const partnerInfo = p.partner || (p.recipient?._id === authUser?._id ? p.requester : p.recipient) || { name: "User", username: "user" };
        const goalInfo = p.myGoal || p.partnerGoal || p.goal;
        return {
          id: p.partnershipId || p._id,
          partner: partnerInfo,
          goalTitle: goalInfo?.title || "Custom Goal",
          progress: goalInfo?.progress || 0
        };
      });
    } else {
      const partnerInfo = activePartnershipData.partner || { name: "User", username: "user" };
      const goalInfo = activePartnershipData.myGoal || activePartnershipData.partnerGoal || activePartnershipData.goal;
      return [{
        id: activePartnershipData.partnershipId || activePartnershipData._id,
        partner: partnerInfo,
        goalTitle: goalInfo?.title || "Custom Goal",
        progress: goalInfo?.progress || 0
      }];
    }
  })();

  const location = useLocation();
  const pathParts = location.pathname.split("/").filter(Boolean);
  const currentView = pathParts[0] || "dashboard";



  // Search Partner Drawer/Modal State
  const [searchUsername, setSearchUsername] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteGoalId, setInviteGoalId] = useState("");

  // Success / Status Toasts
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  // Check-In Modal State
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [checkInGoalId, setCheckInGoalId] = useState("");
  const [checkInNote, setCheckInNote] = useState("");
  const [checkInStake, setCheckInStake] = useState("");
  const [checkInProgress, setCheckInProgress] = useState(10);
  const [checkInError, setCheckInError] = useState("");
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState(false);

  useEffect(() => {
    fetchGoals();
    fetchPartnerships();
    fetchActivePartnership();
    fetchFeed();
    fetchPublicFeed();
    fetchLeaderboard();
  }, [fetchGoals, fetchPartnerships, fetchActivePartnership, fetchFeed, fetchPublicFeed, fetchLeaderboard]);

  useEffect(() => {
    if (goals.length > 0) {
      goals.forEach(goal => {
        if (goal.status === 'active' && !checkInHistory[goal._id]) {
          fetchCheckInHistory(goal._id);
        }
      });
    }
  }, [goals, checkInHistory, fetchCheckInHistory]);

  const showToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage("");
    }, 4000);
  };

  useEffect(() => {
    if (authUser?._id) {
      const socket = connectSocket(authUser._id);

      socket.on('notification_received', (notification) => {
        showToast(notification.message, 'success');
        addNotification(notification);
      });

      socket.on('nudge_received', (data) => {
        showToast(`${data.senderName} sent you a Fire Nudge! ⚡`, 'success');
        addNotification({
          _id: Date.now().toString(),
          type: 'reminder',
          message: data.message || `${data.senderName} sent you a Fire Nudge! ⚡ Keep up the consistency!`,
          read: false,
          createdAt: new Date().toISOString()
        });
      });

      socket.on('checkin_approved', () => {
        showToast('Your check-in was approved by your partner! 🤝', 'success');
        fetchFeed();
        fetchGoals();
        checkAuth();
      });

      socket.on('comment_added', () => {
        fetchFeed();
      });

      socket.on('reaction_added', () => {
        fetchFeed();
      });

      return () => {
        disconnectSocket();
      };
    }
  }, [authUser?._id, fetchFeed, fetchGoals, checkAuth]);

  // Handle Milestone toggling with index mapped to backend
  const handleToggleMilestone = async (goalId, milestoneIndex) => {
    const res = await toggleMilestone(goalId, milestoneIndex);
    if (res.success) {
      showToast("Milestone status updated!");
    } else {
      showToast(res.message || "Failed to update milestone", "error");
    }
  };

  // Handle feed check-in approval
  const handleApproveCheckin = async (feedId, checkInId) => {
    const res = await approveCheckin(feedId, checkInId);
    if (res.success) {
      showToast("Partner check-in approved! Momentum maintained. 🤝");
    } else {
      showToast(res.message || "Failed to approve check-in", "error");
    }
  };

  const handleSendNudge = async (partnerId) => {
    const res = await sendNudge(partnerId);
    if (res.success) {
      showToast("Fire Nudge sent! ⚡", "success");
    } else {
      showToast(res.message, "error");
    }
  };



  // Search Teammate Handler
  const handleSearchPartnerSubmit = async (e) => {
    e.preventDefault();
    setSearchError("");
    setSearchResult(null);
    setInviteSent(false);

    if (!searchUsername.trim()) {
      setSearchError("Please enter a username to search.");
      return;
    }

    setIsSearching(true);
    const res = await searchUser(searchUsername);
    setIsSearching(false);

    if (res.success) {
      setSearchResult(res.user);
    } else {
      setSearchError(res.message);
    }
  };

  // Invite Partner Handler
  const handleInvitePartnerSubmit = async (username) => {
    const activeGoals = goals.filter(g => g.status === "active");
    if (activeGoals.length === 0) {
      showToast("Create at least one active goal first before inviting a partner!", "error");
      return;
    }

    const targetGoalId = inviteGoalId || activeGoals[0]._id;
    const res = await sendInvite(username, targetGoalId);
    if (res.success) {
      setInviteSent(true);
      showToast("Accountability invite successfully sent! ✉️");
    } else {
      showToast(res.message || "Failed to send invite.", "error");
    }
  };

  // Submit Check-In Handler
  const handleCreateCheckInSubmit = async (e) => {
    e.preventDefault();
    setCheckInError("");

    if (!checkInGoalId) {
      setCheckInError("Please select a goal to check-in for.");
      return;
    }

    if (!checkInNote.trim()) {
      setCheckInError("Please provide proof (note) of your progress.");
      return;
    }

    setIsSubmittingCheckIn(true);
    const res = await submitCheckIn(checkInGoalId, checkInNote, checkInStake, checkInProgress);
    setIsSubmittingCheckIn(false);

    if (res.success) {
      showToast("Check-in submitted! Waiting for partner verification. 🤝");
      setIsCheckInModalOpen(false);
      // Refresh check-in history to immediately reflect the new pending check-in
      fetchCheckInHistory(checkInGoalId);
      // Reset form
      setCheckInNote("");
      setCheckInStake("");
      setCheckInProgress(10);
    } else {
      setCheckInError(res.message || "Failed to submit check-in. Try again.");
    }
  };

  // Calculate pending milestones
  const pendingMilestonesCount = goals.flatMap(g => g.milestones || []).filter(m => !m.completed).length;

  // Calculate if there are active goals unchecked today (neither pending nor approved check-ins exist for today)
  const hasUncheckedActiveGoal = goals.length > 0 && goals.some(g => {
    if (g.status !== 'active') return false;
    
    const todayStr = new Date().toDateString();
    
    // Check if there is any check-in today in the local history
    const history = checkInHistory[g._id];
    if (history && Array.isArray(history)) {
      const hasCheckinToday = history.some(c => new Date(c.createdAt).toDateString() === todayStr);
      return !hasCheckinToday;
    }
    
    // Fallback to lastCheckinAt if history is not loaded yet
    if (!g.lastCheckinAt) return true;
    const lastCheckinStr = new Date(g.lastCheckinAt).toDateString();
    return lastCheckinStr !== todayStr;
  });

  // Calculate days left helper
  const getDaysLeft = (deadlineStr) => {
    const days = Math.max(0, Math.ceil((new Date(deadlineStr) - new Date()) / (1000 * 60 * 60 * 24)));
    return days;
  };

  // Filter incoming pending partnership invites
  const incomingPendingInvites = partnerships ? partnerships.filter(p => {
    const recipientId = p.recipient?._id || p.recipient;
    return p.status === "pending" && recipientId === authUser?._id;
  }) : [];

  // Get header details dynamically based on path
  const getHeaderContent = () => {
    switch (currentView) {
      case "dashboard":
        return {
          badge: "Overview",
          title: `Welcome back, ${authUser?.name?.split(' ')[0] || "Alex"} 👋`,
          description: `You have ${pendingMilestonesCount} milestones to complete today. Keep the momentum going!`,
          icon: "📊"
        };
      case "goals":
        return {
          badge: "Focus List",
          title: "Your Accountability Goals 🎯",
          description: "Define milestones, track check-ins, and build consistency.",
          icon: "🎯"
        };
      case "partners":
        return {
          badge: "Sync Link Sequence",
          title: "Accountability Pact Hub 🤝",
          description: "Establish agreements, search peers, and verify partner check-ins.",
          icon: "🤝"
        };
      case "community":
        return {
          badge: "Pulse",
          title: "Global Proof of Work 💬",
          description: "See what other accountability peers are achieving in real time.",
          icon: "💬"
        };
      case "profile":
        return {
          badge: "Personal Hub",
          title: "Consistency Performance 👤",
          description: "Analyze your streak records, verification statistics, and earned badges.",
          icon: "👤"
        };
      case "settings":
        return {
          badge: "Configuration",
          title: "Preferences & Profiles ⚙️",
          description: "Adjust your timezone, target accountability categories, and bio details.",
          icon: "⚙️"
        };
      default:
        return {
          badge: "Overview",
          title: `Welcome back, ${authUser?.name?.split(' ')[0] || "Alex"} 👋`,
          description: `You have ${pendingMilestonesCount} milestones to complete today.`,
          icon: "📊"
        };
    }
  };

  const headerContent = getHeaderContent();

  return (
    <div className="min-h-screen bg-white font-inter text-text flex overflow-hidden">

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-[100] px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 border transition-all animate-bounce ${toastType === "success"
            ? "bg-[#00685f]/95 border-[#00685f] text-white"
            : "bg-red-500/95 border-red-500 text-white"
          }`}>
          <span className="text-lg">{toastType === "success" ? "✓" : "⚠"}</span>
          <span className="text-sm font-bold tracking-wider">{toastMessage}</span>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <Sidebar
        currentView={currentView}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        logout={logout}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto w-full lg:pl-0 bg-white">
        {/* Mobile Header */}
        <header className="lg:hidden bg-[#f8fafc] border-b border-gray-200 px-6 py-4 flex items-center justify-between z-30">
          <h1 className="text-xl font-bold text-[#00685f] tracking-tight">MUTUAL</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-2xl text-gray-600 focus:outline-none"
          >
            {sidebarOpen ? "✕" : "☰"}
          </button>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 max-w-[1200px] w-full mx-auto p-6 md:p-10">

          {/* Header */}
          <Header
            headerContent={headerContent}
            currentView={currentView}
            authUser={authUser}
            goals={goals}
            activePactsList={activePactsList}
          />

          <Outlet context={{
            authUser, logout, updateProfileSettings,
            goals, createGoal, toggleMilestone, fetchGoals, submitCheckIn, isGoalsLoading, checkInHistory, fetchCheckInHistory,
            feed, feedHasMore, feedIsLoadingMore, publicFeed, publicFeedHasMore, publicFeedIsLoadingMore, leaderboard, approveCheckin, partner, activePartners, activePartnershipData,
            searchUser, sendInvite, partnerships, fetchPartnerships, respondToInvite, fetchActivePartnership, fetchFeed, fetchMoreFeed, fetchPublicFeed, fetchMorePublicFeed, fetchLeaderboard, dissolvePartnership, sendReaction, addComment,
            sidebarOpen, setSidebarOpen,
            activePartnersList, activePactsList,
            searchUsername, setSearchUsername, searchResult, setSearchResult, searchError, setSearchError, isSearching, setIsSearching, inviteSent, setInviteSent, inviteGoalId, setInviteGoalId,
            isCheckInModalOpen, setIsCheckInModalOpen, checkInGoalId, setCheckInGoalId, checkInNote, setCheckInNote, checkInStake, setCheckInStake, checkInProgress, setCheckInProgress, checkInError, setCheckInError, isSubmittingCheckIn, setIsSubmittingCheckIn,
            showToast, handleToggleMilestone, handleApproveCheckin, handleSearchPartnerSubmit, handleInvitePartnerSubmit, handleCreateCheckInSubmit, handleSendNudge,
            pendingMilestonesCount, hasUncheckedActiveGoal, getDaysLeft, incomingPendingInvites,
            settingsTimezone, setSettingsTimezone, settingsBio, setSettingsBio, settingsCategories, setSettingsCategories
          }} />
        </main>
      </div>



      {/* CHECK-IN SUBMISSION MODAL */}
      <CheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => {
          setIsCheckInModalOpen(false);
          setCheckInNote("");
          setCheckInStake("");
          setCheckInProgress(10);
          setCheckInError("");
        }}
        goals={goals}
        checkInGoalId={checkInGoalId}
        setCheckInGoalId={setCheckInGoalId}
        checkInNote={checkInNote}
        setCheckInNote={setCheckInNote}
        checkInStake={checkInStake}
        setCheckInStake={setCheckInStake}
        checkInProgress={checkInProgress}
        setCheckInProgress={setCheckInProgress}
        checkInError={checkInError}
        isSubmittingCheckIn={isSubmittingCheckIn}
        handleCreateCheckInSubmit={handleCreateCheckInSubmit}
      />
    </div>
  );
};

export default DashboardLayout;
