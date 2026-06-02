const User = require('../models/User');
const Goal = require('../models/Goal');
const CheckIn = require('../models/CheckIn');
const Notification = require('../models/Notification');
const { formatInTimeZone, toDate } = require('date-fns-tz');
const { isAfter } = require('date-fns');

/**
 * Lazy-evaluated streak auditor middleware.
 * Checks the req.user's active goals for missed deadlines and resets the streak if needed.
 */
const auditUserStreak = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return next();
    }

    const userId = req.user._id;
    const userTimezone = req.user.timezone || 'UTC';

    // Find active goals for this user
    const goals = await Goal.find({ owner: userId, status: 'active' });

    let streakReset = false;

    for (const goal of goals) {
      if (!goal.nextCheckinDue) continue;

      const dueInTZ = toDate(formatInTimeZone(goal.nextCheckinDue, userTimezone, "yyyy-MM-dd'T'HH:mm:ssXXX"), { timeZone: userTimezone });
      const now = new Date();

      if (isAfter(now, dueInTZ)) {
        // If there is any pending check-in, wait for it to be reviewed before resetting the streak.
        // The checkinController will properly handle any calendar gaps when it is approved.
        const pendingCheckin = await CheckIn.findOne({ goal: goal._id, user: userId, status: 'pending' });
        if (pendingCheckin) {
          continue;
        }

        const approvedCheckin = await CheckIn.findOne({ goal: goal._id, user: userId, status: 'approved' }).sort({ approvedAt: -1 });

        let hasApprovedSinceDue = false;
        if (approvedCheckin && approvedCheckin.approvedAt) {
          if (approvedCheckin.approvedAt > dueInTZ) hasApprovedSinceDue = true;
        }

        if (!hasApprovedSinceDue) {
          // If the user's streak isn't already zero, we need to reset it
          if (req.user.currentStreak !== 0 && !streakReset) {
            req.user.currentStreak = 0;
            // Also update the database
            await User.findByIdAndUpdate(userId, { currentStreak: 0 });
            streakReset = true;

            await Notification.create({
              user: userId,
              type: 'streak_reset',
              message: `Your streak for goal "${goal.title}" was reset due to a missed check-in.`,
              data: { goal: goal._id }
            });

            console.log(`[streakAuditor] Reset streak for user ${userId} on goal ${goal._id}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('[streakAuditor] Error auditing streak:', error);
  } finally {
    next();
  }
};

module.exports = { auditUserStreak };
