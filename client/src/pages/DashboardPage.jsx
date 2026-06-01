import { useEffect, useRef, useState } from "react";
import { useOutletContext, Link } from "react-router-dom";

const DashboardPage = () => {
  const context = useOutletContext();
  const {
    authUser, goals, partner, activePartnersList, activePactsList, checkInHistory,
    feed, feedHasMore, feedIsLoadingMore, fetchMoreFeed, approveCheckin, respondToInvite, searchUser, sendInvite,
    isGoalsLoading, pendingMilestonesCount, hasUncheckedActiveGoal, getDaysLeft, incomingPendingInvites,
    sidebarOpen, setSidebarOpen,
    searchUsername, setSearchUsername, searchResult, setSearchResult, searchError, setSearchError, isSearching, setIsSearching, inviteSent, setInviteSent, inviteGoalId, setInviteGoalId,
    isCheckInModalOpen, setIsCheckInModalOpen, checkInGoalId, setCheckInGoalId, checkInNote, setCheckInNote, checkInStake, setCheckInStake, checkInProgress, setCheckInProgress, checkInError, setCheckInError, isSubmittingCheckIn, setIsSubmittingCheckIn,
    showToast, handleToggleMilestone, handleApproveCheckin, handleSearchPartnerSubmit, handleInvitePartnerSubmit, handleCreateCheckInSubmit, handleSendNudge,
    settingsTimezone, setSettingsTimezone, settingsBio, setSettingsBio, settingsCategories, setSettingsCategories, updateProfileSettings
  } = context;

  const observerRef = useRef(null);
  const [heatmapRange, setHeatmapRange] = useState(30);

  const goalsThisWeek = goals.filter(g => new Date(g.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
  const uniquePartnersCount = new Set(activePartnersList.map(p => p.partner._id)).size;

  useEffect(() => {
    if (!feedHasMore || feedIsLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchMoreFeed();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    const currentRef = observerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [feedHasMore, feedIsLoadingMore, fetchMoreFeed]);

  return (
    <>
      <style>{`
        @keyframes premium-shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .animate-premium-shimmer {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.6) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          background-size: 200% 100%;
          animation: premium-shimmer 1.6s infinite linear;
        }
        .animate-premium-pulse {
          animation: premium-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes premium-pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: .85;
            transform: scale(0.995);
          }
        }
      `}</style>
      {/* Quick Metrics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">Active Goals</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-[#00685f] leading-none">{goals.filter(g => g.status === 'active').length}</span>
                    {goalsThisWeek > 0 && (
                      <span className="text-xs font-bold text-[#c26d2e]">+{goalsThisWeek} this week</span>
                    )}
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">Daily Streak</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-[#c26d2e] leading-none">{authUser?.currentStreak || 0}</span>
                    <span className="text-sm font-medium text-gray-500">days</span>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">Partners</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-[#4c51bf] leading-none">{uniquePartnersCount}</span>
                    <span className="text-sm font-medium text-gray-500">active</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (goals.filter(g => g.status === 'active').length === 0) {
                      showToast("Please create at least one active goal first before checking in!", "error");
                    } else {
                      // Set default to first active goal
                      const firstActiveGoal = goals.find(g => g.status === 'active');
                      setCheckInGoalId(firstActiveGoal._id);
                      setIsCheckInModalOpen(true);
                    }
                  }}
                  className="bg-[#00685f] hover:bg-[#004d46] rounded-2xl p-6 shadow-md flex flex-col justify-center text-left group transition-colors relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-5 rounded-full -mr-8 -mt-8 transform scale-150"></div>
                  <h3 className="text-sm font-semibold text-teal-100 mb-2 relative z-10">Quick Check-in</h3>
                  <div className="flex items-center justify-between relative z-10 mt-auto">
                    <span className="text-xl font-bold text-white">Log Progress</span>
                    <span className="text-white text-2xl transform group-hover:translate-x-2 transition-transform">→</span>
                  </div>
                </button>
              </div>

              {/* Bento Grid Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Column 1 & 2: Active Goals progress tracker */}
                <div className="lg:col-span-2">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Goal Overview</h3>
                    <a href="#all" className="text-sm font-bold text-[#00685f] hover:underline">View all</a>
                  </div>

                  {/* Goal List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {isGoalsLoading ? (
                      <div className="col-span-2 flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00685f]"></div>
                      </div>
                    ) : (
                      goals.map((goal, i) => {
                        // Visual assignments based on index
                        const colors = [
                          { bg: 'bg-[#b2f5ea]', text: 'text-teal-700', bar: 'bg-[#00685f]', icon: '🏋️' },
                          { bg: 'bg-[#c3dafe]', text: 'text-indigo-700', bar: 'bg-indigo-500', icon: '📖' },
                          { bg: 'bg-[#feebc8]', text: 'text-orange-700', bar: 'bg-[#8a5a33]', icon: '🎯' }
                        ];
                        const theme = colors[i % colors.length];

                        return (
                          <div key={goal._id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                            <div className="flex justify-between items-start mb-5">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${theme.bg} ${theme.text}`}>
                                {goal.category === 'fitness' ? '🏋️' : goal.category === 'study' ? '📖' : '🎯'}
                              </div>
                              <div className="flex items-center gap-1.5 text-[#c26d2e] text-xs font-bold bg-orange-50 px-2.5 py-1 rounded-full">
                                <span>🔥</span> {authUser?.currentStreak || 0} Streak
                              </div>
                            </div>

                            <h4 className="text-lg font-bold text-gray-900 mb-4 tracking-tight leading-snug line-clamp-2">{goal.title}</h4>

                            {/* Interactive Milestone Checkboxes Inside Goal Card */}
                            {goal.milestones && goal.milestones.length > 0 && (
                              <div className="space-y-2 mb-6">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Interactive Milestones</span>
                                {goal.milestones.map((m, idx) => (
                                  <label key={idx} className="flex items-center gap-2.5 text-xs text-gray-600 hover:text-gray-900 cursor-pointer font-medium">
                                    <input
                                      type="checkbox"
                                      checked={m.completed}
                                      onChange={() => handleToggleMilestone(goal._id, idx)}
                                      className="rounded text-[#00685f] focus:ring-[#00685f] border-gray-300 w-4 h-4 cursor-pointer"
                                    />
                                    <span className={m.completed ? "line-through text-gray-400" : ""}>{m.title}</span>
                                  </label>
                                ))}
                              </div>
                            )}

                            {/* GitHub-Style Habit Heatmap */}
                            <div className="mb-6">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">{heatmapRange}-Day Consistency</span>
                                <div className="flex space-x-1">
                                  {[7, 14, 30].map(range => (
                                    <button
                                      key={range}
                                      onClick={() => setHeatmapRange(range)}
                                      className={`text-[9px] px-1.5 py-0.5 rounded-sm ${heatmapRange === range ? 'bg-gray-200 text-gray-700 font-bold' : 'text-gray-400 hover:bg-gray-100'}`}
                                    >
                                      {range}d
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className={`grid ${heatmapRange === 7 ? 'grid-cols-7' : heatmapRange === 14 ? 'grid-cols-7' : 'grid-cols-10'} gap-1`}>
                                {Array.from({ length: heatmapRange }).map((_, i) => {
                                  const d = new Date();
                                  d.setDate(d.getDate() - (heatmapRange - 1 - i));
                                  const dateStr = d.toISOString().split('T')[0];
                                  const history = checkInHistory[goal._id] || [];
                                  const checkIn = history.find(c => c.createdAt.startsWith(dateStr));
                                  
                                  let statusClass = "bg-[#e2e8f0]";
                                  let tooltipMsg = `No check-in (${dateStr})`;
                                  
                                  if (checkIn) {
                                    if (checkIn.status === 'approved') {
                                      statusClass = "bg-[#10b981]";
                                      tooltipMsg = `Verified check-in! (${dateStr})`;
                                    } else {
                                      statusClass = "bg-[#f97316]";
                                      tooltipMsg = `Pending partner approval (${dateStr})`;
                                    }
                                  } else if (new Date(dateStr) < new Date(goal.createdAt).setHours(0,0,0,0)) {
                                    statusClass = "bg-[#e2e8f0]";
                                    tooltipMsg = `Before goal creation (${dateStr})`;
                                  } else if (new Date(dateStr) < new Date().setHours(0,0,0,0)) {
                                    statusClass = "bg-[#ef4444]";
                                    tooltipMsg = `Missed check-in (${dateStr})`;
                                  }

                                  return (
                                    <div key={i} className={`w-full pt-[100%] rounded-sm ${statusClass} relative group cursor-pointer`}>
                                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block z-20 whitespace-nowrap bg-gray-800 text-white text-[10px] font-bold py-1 px-2 rounded">
                                        {tooltipMsg}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="mb-6 mt-auto">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-semibold text-gray-500">Progress</span>
                                <span className="text-xs font-bold text-gray-700">{goal.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-1000 ease-out ${theme.bar}`}
                                  style={{ width: `${goal.progress}%` }}
                                ></div>
                              </div>
                            </div>

                            <div className="flex justify-between items-end pt-2 border-t border-gray-50 mt-2">
                              <div className="flex -space-x-2">
                                <div className="w-7 h-7 rounded-full border-2 border-white shadow-sm overflow-hidden">
                                  <img src={`https://ui-avatars.com/api/?name=${authUser?.name || 'User'}&background=e2e8f0`} alt="You" />
                                </div>
                                {partner && (
                                  <div className="w-7 h-7 rounded-full border-2 border-white shadow-sm overflow-hidden">
                                    <img src={`https://ui-avatars.com/api/?name=${partner.name}&background=b2f5ea`} alt="Partner" />
                                  </div>
                                )}
                              </div>
                              <span className="text-xs font-medium text-gray-500">
                                {goal.frequency === 'daily' ? 'Daily Goal' : `${getDaysLeft(goal.deadline)} days left`}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {/* Start a new journey card */}
                    <Link
                      to="/goals/new"
                      className="rounded-2xl border-2 border-dashed border-gray-300 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-colors min-h-[240px] group"
                    >
                      <div className="w-12 h-12 rounded-full bg-white border border-gray-300 shadow-sm flex items-center justify-center text-gray-400 mb-4 text-2xl group-hover:scale-110 group-hover:text-[#00685f] group-hover:border-[#00685f] transition-all">
                        +
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 mb-1 tracking-tight group-hover:text-[#00685f] transition-colors">Start a new journey</h4>
                      <p className="text-sm text-gray-500 font-medium">Focus on what matters most.</p>
                    </Link>
                  </div>

                  {/* My Accountability Pact Hub */}
                  <div className="mt-10">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 tracking-tight">My Accountability Pact Hub</h3>
                      <span className="bg-[#ebf4ff] text-[#4c51bf] text-xs font-bold px-2 py-1 rounded-full">{activePactsList.length} Active</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {activePactsList.length === 0 ? (
                        <div className="col-span-2 text-center py-8 bg-gray-50 rounded-2xl border border-gray-200">
                          <p className="text-sm font-bold text-gray-400">No active partners yet.</p>
                        </div>
                      ) : (
                        activePactsList.map((pact, idx) => {
                          const p = pact.partner;
                          return (
                            <div key={idx} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden group hover:border-[#4c51bf] transition-colors">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-full border-2 border-white shadow-sm overflow-hidden">
                                    <img src={`https://ui-avatars.com/api/?name=${p.name}&background=b2f5ea`} alt={p.name} />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-gray-900 leading-tight">{p.name}</h4>
                                    <p className="text-xs text-gray-500 font-medium">@{p.username}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-[#c26d2e] text-xs font-bold bg-orange-50 px-2.5 py-1 rounded-full">
                                  <span>🔥</span> {p.currentStreak || p.streak || 0} Streak
                                </div>
                              </div>

                              <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Associated Pact Goal</span>
                                <span className="text-xs font-bold text-gray-700 leading-snug">{pact.goalTitle}</span>
                              </div>

                              {p.bio && (
                                <p className="text-xs text-gray-600 italic line-clamp-2">&quot;{p.bio}&quot;</p>
                              )}
                              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden mt-1">
                                <div className="h-full rounded-full transition-all duration-1000 ease-out bg-[#00685f]" style={{ width: `${pact.progress}%` }}></div>
                              </div>
                              <button
                                onClick={() => handleSendNudge(p._id)}
                                className="mt-2 w-full py-2 bg-[#fff7ed] hover:bg-[#ffedd5] text-[#ea580c] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                              >
                                <span>⚡</span> Send Fire Nudge
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Column 3: Partner Pulse Feed */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Activity Feed</h3>
                    <button className="text-gray-400 hover:text-gray-600 text-xl font-bold pb-2">...</button>
                  </div>

                  <div className="bg-[#f8fafc] rounded-2xl border border-gray-200 p-6 space-y-6 shadow-sm">

                    {/* Loop Feed Items */}
                    <div className="space-y-6 relative">
                      {feed.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-sm font-bold text-gray-400">Activity feed is quiet.</p>
                          <p className="text-xs text-gray-400 mt-1">Pending check-ins will appear here.</p>
                        </div>
                      ) : (
                        feed.map((item, idx) => (
                          <div key={item.id} className="flex gap-4 relative">
                            {/* Vertical line connector */}
                            {idx !== feed.length - 1 && <div className="absolute top-10 left-5 w-px h-[calc(100%-10px)] bg-gray-200 z-0"></div>}

                            <div className="w-10 h-10 shrink-0 rounded-full bg-white border border-gray-200 shadow-sm overflow-hidden relative z-10">
                              <img src={`https://ui-avatars.com/api/?name=${item.partnerName}&background=fff`} alt={item.partnerName} className="w-full h-full object-cover" />
                              {idx === 0 && <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#00685f] rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white">✓</div>}
                              {idx === 1 && <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white">⚡</div>}
                            </div>

                            <div className="flex-1 pb-2 min-w-0 w-full overflow-hidden">
                              <p className="text-sm text-gray-800 font-medium leading-snug break-all sm:break-words">
                                <span className="font-bold text-gray-900">{item.partnerName}</span> {item.action} {item.isBadge ? `"${item.badgeName}"` : ""}
                              </p>
                              <span className="text-[11px] font-medium text-gray-400 block mb-2">{item.timestamp}</span>

                              {!item.isBadge && item.note && (
                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-sm italic text-gray-600 mb-3 relative break-all sm:break-words">
                                  "{item.note}"
                                  {/* Little triangle pointer */}
                                  <div className="absolute -left-1.5 top-3 w-3 h-3 bg-white border-l border-b border-gray-200 transform rotate-45"></div>
                                </div>
                              )}

                              {/* Social Buttons */}
                              {item.isBadge && (
                                <div className="flex gap-2 mt-3">
                                  <button className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-full hover:bg-blue-100 flex items-center gap-1.5 transition-colors">
                                    👍 High Five
                                  </button>
                                  <button className="px-3 py-1.5 bg-gray-200 text-gray-600 text-xs font-bold rounded-full hover:bg-gray-300 transition-colors">
                                    Reply
                                  </button>
                                </div>
                              )}

                              {/* Approval Trigger */}
                              {!item.isBadge && !item.approved && (
                                <button
                                  onClick={async () => {
                                    const res = await approveCheckin(item.id, item.checkInId);
                                    if (res.success) {
                                      showToast("Check-in verified! Partner streak updated.");
                                    } else {
                                      showToast(res.message || "Failed to verify check-in", "error");
                                    }
                                  }}
                                  className="text-xs font-bold text-[#00685f] hover:underline"
                                >
                                  Verify Check-in
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Infinite Scroll Intersection Observer Trigger & Premium Skeletons */}
                    {feedHasMore && (
                      <div ref={observerRef} className="pt-2">
                        {feedIsLoadingMore ? (
                          <div className="space-y-6">
                            {[1, 2].map((n) => (
                              <div key={n} className="flex gap-4 relative animate-premium-pulse">
                                {/* Connector line skeleton */}
                                <div className="absolute top-10 left-5 w-px h-[calc(100%-10px)] bg-gray-200/50 z-0"></div>

                                <div className="w-10 h-10 shrink-0 rounded-full bg-white/60 border border-gray-200/50 shadow-sm relative z-10 overflow-hidden">
                                  <div className="w-full h-full animate-premium-shimmer"></div>
                                </div>

                                <div className="flex-1 pb-2 space-y-3">
                                  <div className="flex items-center gap-2">
                                    <div className="h-4 bg-gray-200/60 rounded-md w-1/3 relative overflow-hidden">
                                      <div className="absolute inset-0 animate-premium-shimmer"></div>
                                    </div>
                                    <div className="h-3 bg-gray-200/40 rounded-md w-1/4 relative overflow-hidden">
                                      <div className="absolute inset-0 animate-premium-shimmer"></div>
                                    </div>
                                  </div>
                                  
                                  <div className="h-3 bg-gray-200/40 rounded-md w-1/6 relative overflow-hidden">
                                    <div className="absolute inset-0 animate-premium-shimmer"></div>
                                  </div>

                                  <div className="bg-white/40 backdrop-blur-md p-4 rounded-xl border border-white/40 shadow-sm relative overflow-hidden h-20">
                                    <div className="absolute inset-0 animate-premium-shimmer"></div>
                                    <div className="absolute -left-1.5 top-3 w-3 h-3 bg-white/40 border-l border-b border-white/40 transform rotate-45"></div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-6 flex items-center justify-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400/60 animate-pulse">
                              Loading older updates...
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Alert Banner for Streak at Risk */}
                    {hasUncheckedActiveGoal && (
                      <div className="mt-8 bg-orange-500 rounded-xl p-5 shadow-md relative overflow-hidden">
                        <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 text-7xl opacity-10">⚠️</div>
                        <h4 className="text-xs font-bold text-orange-100 uppercase tracking-widest mb-2 relative z-10">Streak at Risk!</h4>
                        <p className="text-sm text-white font-medium leading-relaxed mb-4 relative z-10">
                          You haven't checked in for your active goals yet today.
                        </p>
                        <button
                          onClick={() => {
                            // Find the first active goal that has not been checked in today (neither pending nor approved)
                            const todayStr = new Date().toDateString();
                            const uncheckedGoal = goals.find(g => {
                              if (g.status !== 'active') return false;
                              const history = checkInHistory[g._id];
                              if (history && Array.isArray(history)) {
                                const hasCheckinToday = history.some(c => new Date(c.createdAt).toDateString() === todayStr);
                                return !hasCheckinToday;
                              }
                              if (!g.lastCheckinAt) return true;
                              return new Date(g.lastCheckinAt).toDateString() !== todayStr;
                            });

                            if (uncheckedGoal) {
                              setCheckInGoalId(uncheckedGoal._id);
                              setIsCheckInModalOpen(true);
                            }
                          }}
                          className="w-full bg-white hover:bg-orange-50 text-orange-600 font-bold text-sm py-2.5 rounded-lg transition-colors shadow-sm relative z-10"
                        >
                          Complete Now
                        </button>
                      </div>
                    )}

                  </div>
                </div>

              </div>
    </>
  );
};

export default DashboardPage;
