import { create } from "zustand";
import axiosInstance from "../lib/axios";

export const useGoalStore = create((set) => ({
  goals: [],
  completedGoals: [],
  checkInHistory: {},
  isLoading: false,

  fetchGoals: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/goals");
      const goalsList = res.data.data || res.data;
      set({ goals: Array.isArray(goalsList) ? goalsList : [] });
      return { success: true };
    } catch (error) {
      console.error("Error in fetchGoals:", error);
      return { success: false, message: error.response?.data?.message || "An error occurred while fetching goals" };
    } finally {
      set({ isLoading: false });
    }
  },

  fetchCompletedGoals: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/goals?status=completed");
      const goalsList = res.data.data || res.data;
      set({ completedGoals: Array.isArray(goalsList) ? goalsList : [] });
      return { success: true };
    } catch (error) {
      console.error("Error in fetchCompletedGoals:", error);
      return { success: false, message: "Failed to fetch completed goals" };
    } finally {
      set({ isLoading: false });
    }
  },

  createGoal: async (goalData) => {
    set({ isLoading: true });
    try {
      // Map the payload dynamically if needed to match the schema
      const res = await axiosInstance.post("/goals", goalData);
      const newGoal = res.data.data || res.data;
      set((state) => ({ goals: [...state.goals, newGoal] }));
      return { success: true, data: newGoal };
    } catch (error) {
      console.error("Error in createGoal:", error);
      return { success: false, message: error.response?.data?.message || "An error occurred while creating the goal" };
    } finally {
      set({ isLoading: false });
    }
  },

  toggleMilestone: async (goalId, milestoneIndex) => {
    try {
      // Direct call to PUT /api/goals/:goalId/milestones/:milestoneIndex/toggle
      const res = await axiosInstance.put(`/goals/${goalId}/milestones/${milestoneIndex}/toggle`);
      const updatedGoal = res.data.data || res.data;
      
      set((state) => ({
        goals: state.goals.map((g) => (g._id === goalId ? updatedGoal : g)),
      }));
      return { success: true, data: updatedGoal };
    } catch (error) {
      console.error("Error in toggleMilestone:", error);
      return { success: false, message: error.response?.data?.message || "An error occurred while toggling the milestone" };
    }
  },

  // Submit check-in for goal
  submitCheckIn: async (goalId, note, stake, progress) => {
    try {
      const res = await axiosInstance.post("/checkins", { goalId, note, stake, progress });
      return { success: true, data: res.data.data };
    } catch (error) {
      console.error("Error in submitCheckIn:", error);
      const data = error.response?.data;
      const message = data?.errors?.[0]?.message || data?.message || "Failed to submit check-in";
      return { success: false, message };
    }
  },

  fetchCheckInHistory: async (goalId) => {
    try {
      const res = await axiosInstance.get(`/checkins/history/${goalId}`);
      const history = res.data.data || res.data;
      set((state) => ({
        checkInHistory: {
          ...state.checkInHistory,
          [goalId]: Array.isArray(history) ? history : []
        }
      }));
      return { success: true };
    } catch (error) {
      console.error("Error in fetchCheckInHistory:", error);
      return { success: false, message: "Failed to fetch check-in history" };
    }
  },
}));
