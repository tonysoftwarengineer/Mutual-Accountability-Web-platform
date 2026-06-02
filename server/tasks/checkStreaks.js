const mongoose = require('mongoose');
const User = require('../models/User');
const Goal = require('../models/Goal');
const CheckIn = require('../models/CheckIn');
const Notification = require('../models/Notification');
const { formatInTimeZone, toDate } = require('date-fns-tz');
const { isAfter } = require('date-fns');

/**
 * Loop through active users and their active goals.
 * If nextCheckinDue (interpreted in user's timezone) has passed
 * and there is no approved check-in after the last due date, reset streak.
 */
const runCheckStreaks = async () => {
  console.log('[checkStreaks] Starting sweep...');

  // Find all active users
  const users = await User.find({ isActive: true });

  for (const user of users) {
    const userTimezone = user.timezone || 'UTC';

    // Find active goals for this user
    const goals = await Goal.find({ owner: user._id, status: 'active' });

    for (const goal of goals) {
      if (!goal.nextCheckinDue) continue;

      // Parse nextCheckinDue into the user's timezone end-of-day instant
      // The stored date is expected to already represent the end-of-day in the user's tz,
      // but to be safe, we reformat to the tz and parse.
      const dueInTZ = toDate(formatInTimeZone(goal.nextCheckinDue, userTimezone, "yyyy-MM-dd'T'HH:mm:ssXXX"), { timeZone: userTimezone });

      const now = new Date();

      if (isAfter(now, dueInTZ)) {
        // If there is any pending check-in, wait for it to be reviewed before resetting the streak.
        // The checkinController will properly handle any calendar gaps when it is approved.
        const pendingCheckin = await CheckIn.findOne({ goal: goal._id, user: user._id, status: 'pending' });
        if (pendingCheckin) {
          continue;
        }

        // Check if there's any approved checkin for this goal after the previous nextCheckinDue -
        // If lastCheckinAt exists and is before or equal to nextCheckinDue, then no approved check-in happened.

        const approvedCheckin = await CheckIn.findOne({ goal: goal._id, user: user._id, status: 'approved' }).sort({ approvedAt: -1 });

        let hasApprovedSinceDue = false;
        if (approvedCheckin && approvedCheckin.approvedAt) {
          // If approvedAt is after the dueInTZ, then the user did check-in on time
          if (approvedCheckin.approvedAt > dueInTZ) hasApprovedSinceDue = true;
        }

        if (!hasApprovedSinceDue) {
          if (user.currentStreak !== 0) {
            user.currentStreak = 0;
            await user.save();

            await Notification.create({
              user: user._id,
              type: 'streak_reset',
              message: `Your streak for goal \"${goal.title}\" was reset due to a missed check-in.`,
              data: { goal: goal._id }
            });

            console.log(`[checkStreaks] Reset streak for user ${user._id} on goal ${goal._id}`);
          }
        }
      }
    }
  }

  console.log('[checkStreaks] Sweep complete');
};

module.exports = { runCheckStreaks };
