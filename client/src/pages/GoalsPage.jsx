import { useOutletContext, Link } from "react-router-dom";
import { useState } from "react";

const GoalsPage = () => {
  const context = useOutletContext();
  const {
    authUser, goals, activePartnersList, checkInHistory,
    handleToggleMilestone, getDaysLeft
  } = context;

  const [heatmapRange, setHeatmapRange] = useState(30);

  return (
    <>
      <div className="animate-in fade-in duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-gray-50 rounded-2xl border border-gray-200">
              <p className="text-sm font-bold text-gray-400">No active goals yet.</p>
            </div>
          ) : (
            goals.map((goal) => {
              const partner = activePartnersList.find(p => p.goalId === goal._id);
              return (
                <div key={goal._id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-[#e6f4f2] text-[#00685f] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        {goal.category}
                      </span>
                      <div className="flex items-center gap-1.5 text-[#c26d2e] text-xs font-bold bg-orange-50 px-2.5 py-1 rounded-full">
                        <span>🔥</span> {authUser?.currentStreak || 0} Streak
                      </div>
                    </div>

                    <h4 className="text-lg font-bold text-gray-900 mb-4 tracking-tight leading-snug">{goal.title}</h4>

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

                          // Determine if this date is an expected check-in day based on frequency
                          const freq = goal.frequency || 'daily';
                          const goalStart = new Date(goal.createdAt);
                          goalStart.setHours(0, 0, 0, 0);
                          const cellDate = new Date(dateStr);
                          const diffDays = Math.round((cellDate - goalStart) / (1000 * 60 * 60 * 24));

                          let isExpectedDay = true; // daily by default
                          if (freq === 'every2days') {
                            isExpectedDay = diffDays >= 0 && diffDays % 2 === 0;
                          } else if (freq === 'weekly') {
                            isExpectedDay = diffDays >= 0 && diffDays % 7 === 0;
                          }

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
                          } else if (cellDate < goalStart) {
                            statusClass = "bg-[#e2e8f0]";
                            tooltipMsg = `Before goal creation (${dateStr})`;
                          } else if (cellDate < new Date(new Date().setHours(0,0,0,0))) {
                            if (isExpectedDay) {
                              statusClass = "bg-[#ef4444]";
                              tooltipMsg = `Missed check-in (${dateStr})`;
                            } else {
                              statusClass = "bg-[#e2e8f0]";
                              tooltipMsg = `Off day (${dateStr})`;
                            }
                          }

                          return (
                            <div
                              key={i}
                              className={`w-full pt-[100%] rounded-sm ${statusClass} cursor-pointer hover:opacity-80 transition-opacity relative group`}
                            >
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-max max-w-[120px] bg-gray-900 text-white text-[10px] py-1 px-2 rounded z-20 pointer-events-none">
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
                          className="h-full rounded-full transition-all duration-1000 ease-out bg-[#00685f]"
                          style={{ width: `${goal.progress}%` }}
                        ></div>
                      </div>
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
      </div>
    </>
  );
};

export default GoalsPage;
