import { useState } from "react";
import { useNavigate, Link, useOutletContext } from "react-router-dom";
import { useGoalStore } from "../store/useGoalStore";

// Inline SVG Icons for a premium look
const TargetIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const DescriptionIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
  </svg>
);

const CategoryIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ClockIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" />
  </svg>
);

const PlusIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ArrowDownIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const InfoIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const NewGoalPage = () => {
  const navigate = useNavigate();
  const { showToast } = useOutletContext();
  const { createGoal, isLoading } = useGoalStore();

  const [goalTitle, setGoalTitle] = useState("");
  const [goalCategory, setGoalCategory] = useState("study");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("");
  const [goalFrequency, setGoalFrequency] = useState("daily");
  const [goalMilestones, setGoalMilestones] = useState([""]);
  const [goalError, setGoalError] = useState("");

  const handleAddMilestoneField = () => {
    setGoalMilestones([...goalMilestones, ""]);
  };

  const handleMilestoneFieldChange = (index, value) => {
    const updated = [...goalMilestones];
    updated[index] = value;
    setGoalMilestones(updated);
  };

  const handleRemoveMilestoneField = (index) => {
    if (goalMilestones.length === 1) return;
    const updated = goalMilestones.filter((_, i) => i !== index);
    setGoalMilestones(updated);
  };

  const handleCreateGoalSubmit = async (e) => {
    e.preventDefault();
    setGoalError("");

    if (!goalTitle.trim()) {
      setGoalError("Goal Title is required.");
      return;
    }

    if (!goalDeadline) {
      setGoalError("A target deadline date is required.");
      return;
    }

    const filteredMilestones = goalMilestones.filter((m) => m.trim() !== "");
    if (filteredMilestones.length === 0) {
      setGoalError("At least one milestone is required.");
      return;
    }

    const milestonesPayload = filteredMilestones.map(m => ({
      title: m,
      targetDate: goalDeadline
    }));

    const res = await createGoal({
      title: goalTitle,
      category: goalCategory,
      description: goalDescription,
      deadline: goalDeadline,
      frequency: goalFrequency,
      milestones: milestonesPayload
    });

    if (res.success) {
      if (showToast) showToast("New performance cycle initiated! 🎯");
      navigate("/goals");
    } else {
      setGoalError(res.message || "Failed to create goal. Try again.");
    }
  };

  return (
    <div className="space-y-6 animate-[fadeInUp_0.4s_ease-out]">
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-2 bg-slate-50/60 border border-slate-200/60 px-4 py-2 rounded-full text-xs font-semibold text-slate-500 shadow-xs backdrop-blur-xs">
          <li className="inline-flex items-center">
            <Link to="/dashboard" className="inline-flex items-center text-slate-400 hover:text-[#00685f] transition-colors duration-200">
              <svg className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z"/>
              </svg>
              Home
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <svg className="w-3 h-3 text-slate-300 mx-1" aria-hidden="true" fill="none" viewBox="0 0 6 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
              </svg>
              <Link to="/goals" className="ml-1 text-slate-400 hover:text-[#00685f] transition-colors duration-200 md:ml-2">My Goals</Link>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <svg className="w-3 h-3 text-slate-300 mx-1" aria-hidden="true" fill="none" viewBox="0 0 6 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
              </svg>
              <span className="ml-1 text-[#00685f] font-bold md:ml-2">Create Goal</span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-[#00685f] to-emerald-600"></div>
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#00685f]/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="mb-8 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-50 to-[#00685f]/10 border border-[#00685f]/20 flex items-center justify-center shrink-0 shadow-xs">
              <TargetIcon className="w-6 h-6 text-[#00685f]" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Initialize Goal Cycle</h3>
              <p className="text-slate-500 text-sm mt-0.5">Setup your commitment targets, choose frequency, and partition milestones.</p>
            </div>
          </div>

          <form onSubmit={handleCreateGoalSubmit} className="space-y-6">
            {goalError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl font-bold flex items-start gap-2.5 shadow-xs">
                <span className="text-base leading-none shrink-0 mt-0.5">⚠️</span>
                <div className="flex-1">{goalError}</div>
              </div>
            )}

            <div className="space-y-2 group">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 group-focus-within:text-[#00685f] transition-colors flex items-center gap-1.5">
                <TargetIcon className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-[#00685f] transition-colors" />
                Goal Title
              </label>
              <div className="relative rounded-xl transition-all duration-300 group-focus-within:shadow-md group-focus-within:shadow-[#00685f]/5">
                <input
                  type="text"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="e.g., Learn MERN stack backend development"
                  className="w-full px-4 py-3.5 text-base placeholder-slate-400 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00685f]/20 focus:border-[#00685f] text-slate-800 font-medium transition-all duration-200"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 group-focus-within:text-[#00685f] transition-colors flex items-center gap-1.5">
                <DescriptionIcon className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-[#00685f] transition-colors" />
                Description
              </label>
              <div className="relative rounded-xl transition-all duration-300 group-focus-within:shadow-md group-focus-within:shadow-[#00685f]/5">
                <textarea
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  placeholder="Describe your commitment and why it matters..."
                  className="w-full px-4 py-3.5 text-base placeholder-slate-400 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white rounded-xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-[#00685f]/20 focus:border-[#00685f] text-slate-800 font-medium h-28 resize-none transition-all duration-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2 group">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 group-focus-within:text-[#00685f] transition-colors flex items-center gap-1.5">
                  <CategoryIcon className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-[#00685f] transition-colors" />
                  Category
                </label>
                <div className="relative">
                  <select
                    value={goalCategory}
                    onChange={(e) => setGoalCategory(e.target.value)}
                    className="w-full px-4 py-3.5 text-base bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00685f]/20 focus:border-[#00685f] text-slate-800 font-medium transition-all duration-200 appearance-none cursor-pointer"
                  >
                    <option value="study">Study</option>
                    <option value="fitness">Fitness</option>
                    <option value="career">Career</option>
                    <option value="habit">Habit</option>
                    <option value="other">Other</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <ArrowDownIcon className="w-4 h-4" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 group">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 group-focus-within:text-[#00685f] transition-colors flex items-center gap-1.5">
                  <ClockIcon className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-[#00685f] transition-colors" />
                  Frequency
                </label>
                <div className="relative">
                  <select
                    value={goalFrequency}
                    onChange={(e) => setGoalFrequency(e.target.value)}
                    className="w-full px-4 py-3.5 text-base bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00685f]/20 focus:border-[#00685f] text-slate-800 font-medium transition-all duration-200 appearance-none cursor-pointer"
                  >
                    <option value="daily">Daily</option>
                    <option value="every2days">Every 2 days</option>
                    <option value="weekly">Weekly</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <ArrowDownIcon className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 group">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 group-focus-within:text-[#00685f] transition-colors flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-[#00685f] transition-colors" />
                Target Deadline Date
              </label>
              <div className="relative rounded-xl transition-all duration-300 group-focus-within:shadow-md group-focus-within:shadow-[#00685f]/5">
                <input
                  type="date"
                  value={goalDeadline}
                  onChange={(e) => setGoalDeadline(e.target.value)}
                  className="w-full px-4 py-3.5 text-base bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00685f]/20 focus:border-[#00685f] text-slate-800 font-medium transition-all duration-200 cursor-pointer"
                  required
                />
              </div>
            </div>

            <div className="space-y-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-200/80 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00685f]/2 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Partition Milestones</label>
                  <p className="text-[11px] text-slate-400 font-medium">Break your goal down into clear actionable pieces.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddMilestoneField}
                  className="text-[#00685f] hover:text-[#004d46] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-xs hover:shadow-sm hover:border-[#00685f]/30 transition-all duration-200 active:scale-95"
                >
                  <PlusIcon className="w-3 h-3 text-[#00685f] stroke-[3]" /> Add Milestone
                </button>
              </div>

              <div className="relative space-y-4 pr-1 max-h-56 overflow-y-auto">
                {goalMilestones.length > 1 && (
                  <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-200 pointer-events-none"></div>
                )}
                
                {goalMilestones.map((milestone, idx) => (
                  <div key={idx} className="flex items-center gap-3 group/item">
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-extrabold shadow-sm shrink-0 z-10 transition-all duration-300 ${
                      milestone.trim() 
                        ? "bg-[#00685f] border-[#00685f] text-white scale-105" 
                        : "bg-white border-slate-200 text-slate-500 group-focus-within/item:border-[#00685f] group-focus-within/item:text-[#00685f]"
                    }`}>
                      {idx + 1}
                    </div>
                    
                    <div className="flex-1 relative rounded-xl transition-all duration-300 group-focus-within/item:shadow-md group-focus-within/item:shadow-[#00685f]/5">
                      <input
                        type="text"
                        value={milestone}
                        onChange={(e) => handleMilestoneFieldChange(idx, e.target.value)}
                        placeholder={`e.g., Complete section ${idx + 1} coding practice`}
                        className="w-full px-4 py-2.5 bg-white hover:bg-slate-50/50 focus:bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00685f]/10 focus:border-[#00685f] text-sm font-medium transition-all duration-200"
                        required
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => handleRemoveMilestoneField(idx)}
                      disabled={goalMilestones.length === 1}
                      className={`p-2.5 rounded-xl border transition-all duration-200 ${
                        goalMilestones.length === 1
                          ? "text-slate-300 border-slate-100 bg-slate-50 cursor-not-allowed"
                          : "text-red-400 border-red-100 bg-red-50/30 hover:bg-red-50 hover:text-red-600 hover:border-red-200 active:scale-95"
                      }`}
                      title="Remove Milestone"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-slate-100">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:flex-1 bg-gradient-to-r from-[#00685f] to-[#008378] hover:from-[#004d46] hover:to-[#00685f] text-white py-4 font-bold text-xs uppercase tracking-widest rounded-xl transition-all duration-300 shadow-md shadow-[#00685f]/15 hover:shadow-lg hover:shadow-[#00685f]/25 active:scale-98 disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Provisioning...
                  </>
                ) : (
                  "Provision Goal Cycle"
                )}
              </button>
              <Link
                to="/goals"
                className="w-full sm:w-auto px-8 py-4 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500 hover:text-slate-700 font-bold text-xs uppercase tracking-widest rounded-xl transition-all duration-200 text-center active:scale-98"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-50/50 via-white to-slate-50/30 rounded-2xl border border-slate-200/80 p-6 space-y-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
            <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-[#00685f]/2 rounded-full blur-2xl pointer-events-none"></div>
            
            <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200/60 pb-3">
              <InfoIcon className="w-4 h-4 text-[#00685f]" />
              Goal Blueprint Guide
            </h4>
            
            <div className="space-y-5 text-xs font-medium text-slate-600 leading-relaxed">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-lg bg-teal-50 flex items-center justify-center shrink-0 border border-teal-100/50">
                  <CategoryIcon className="w-3 h-3 text-[#00685f]" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-800 mb-0.5 uppercase tracking-wider text-[10px]">Category Alignment</h5>
                  <p className="text-slate-500">Choose the category matching your target. Categorization aids in finding relevant, domain-specific accountability partners.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-lg bg-teal-50 flex items-center justify-center shrink-0 border border-teal-100/50">
                  <ClockIcon className="w-3 h-3 text-[#00685f]" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-800 mb-0.5 uppercase tracking-wider text-[10px]">Rhythm & Frequency</h5>
                  <p className="text-slate-500">Select **Daily** for constant habit building, or **Weekly** for deeper milestones. Partners must verify check-ins in alignment with this cadence.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-lg bg-teal-50 flex items-center justify-center shrink-0 border border-teal-100/50">
                  <TargetIcon className="w-3 h-3 text-[#00685f]" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-800 mb-0.5 uppercase tracking-wider text-[10px]">Milestone Partitioning</h5>
                  <p className="text-slate-500">Formulate clear, atomic, and measurable milestones. Verifying these milestones drives your overall progress score.</p>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50/30 rounded-xl p-4 border border-emerald-100/60 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/2 rounded-full blur-xl pointer-events-none"></div>
              <div className="flex gap-3">
                <div className="mt-0.5 shrink-0">
                  <div className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </div>
                </div>
                <div className="text-xs">
                  <span className="font-extrabold text-emerald-800 uppercase tracking-wider text-[10px] block mb-1">Dual-binding covenant</span>
                  <span className="text-emerald-700/90 leading-relaxed font-medium block">
                    After provisioning this goal, visit the **Partners Hub** to link with an active partner and initiate reciprocal progress verifications.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default NewGoalPage;
