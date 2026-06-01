const CheckIn = require('../models/CheckIn');
const Goal = require('../models/Goal');
const Partnership = require('../models/Partnership');
const User = require('../models/User');
const { createNotification } = require('../utils/notifications');
const { formatInTimeZone, toDate } = require('date-fns-tz');
const { differenceInCalendarDays, addDays } = require('date-fns');

// @route   POST /api/checkins/submit (or POST /api/checkins)
// @desc    Submit a check-in for a milestone/goal
// @access  Private
const submitCheckIn = async (req, res) => {
  try {
    const { goalId, note, stake, progress } = req.body;
    const userId = req.user._id;

    // 1. Verify that the goal exists and belongs to the current user
    const goal = await Goal.findOne({ _id: goalId, owner: userId });
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found or unauthorized',
      });
    }

    const userTimezone = req.user.timezone || 'UTC';
    const now = new Date();
    const todayStr = formatInTimeZone(now, userTimezone, 'yyyy-MM-dd');

    // 2. Prevent duplicate check-ins (pending or approved) for the same day
    const recentCheckins = await CheckIn.find({
      goal: goalId,
      user: userId,
      createdAt: { $gte: new Date(Date.now() - 36 * 60 * 60 * 1000) } // Cover overlapping timezones
    });

    const hasCheckinToday = recentCheckins.some(c => {
      const checkinDateStr = formatInTimeZone(c.createdAt, userTimezone, 'yyyy-MM-dd');
      return checkinDateStr === todayStr;
    });

    if (hasCheckinToday) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a check-in for this goal today! 🤝',
      });
    }


    // 3. Create the check-in with pending status
    const checkIn = await CheckIn.create({
      goal: goalId,
      user: userId,
      note,
      stake,
      progress: progress !== undefined ? progress : goal.progress,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Check-in submitted successfully, waiting for partner approval',
      data: checkIn,
    });
  } catch (error) {
    console.error('Error in submitCheckIn:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during check-in submission',
    });
  }
};

// @route   POST /api/checkins/approve/:id
// @desc    Verify and approve a partner's check-in (triggers streak calculation)
// @access  Private
const approveCheckIn = async (req, res) => {
  try {
    const checkInId = req.params.id;
    const partnerId = req.user._id;

    // 1. Find the check-in
    const checkIn = await CheckIn.findById(checkInId);
    if (!checkIn) {
      return res.status(404).json({
        success: false,
        message: 'Check-in not found',
      });
    }

    // 2. Check if already approved
    if (checkIn.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Check-in has already been approved',
      });
    }

    // 3. Verify partnership exists, is active, AND is linked to this check-in's goal
    const partnership = await Partnership.findOne({
      $and: [
        { status: 'active' },
        { $or: [
          { requester: checkIn.user, recipient: partnerId },
          { recipient: checkIn.user, requester: partnerId },
        ]},
        { $or: [
          { goal: checkIn.goal },
          { partnerGoal: checkIn.goal }
        ]}
      ]
    });

    if (!partnership) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to approve this check-in. Active partnership required.',
      });
    }

    // 4. Update check-in status
    checkIn.status = 'approved';
    checkIn.partnerApproval = {
      approved: true,
      approvedAt: new Date(),
      approvedBy: partnerId
    };
    await checkIn.save();

    // 5. Update goal's lastCheckinAt, progress, and status
    const goal = await Goal.findById(checkIn.goal);
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal associated with check-in not found',
      });
    }

    const now = new Date();
    goal.lastCheckinAt = now;
    // Decoupled: Check-in progress no longer overrides milestone-driven goal progress.
    // Progress remains historical to the check-in only.

    // 6. Dynamically calculate the streak for the check-in OWNER based on Check-in Submission Date
    const checkinOwner = await User.findById(checkIn.user);
    const userTimezone = checkinOwner.timezone || 'UTC';
    let newCurrentStreak = checkinOwner.currentStreak;

    // Find the most recent approved check-in (excluding the current one)
    const lastApprovedCheckIn = await CheckIn.findOne({
      user: checkIn.user,
      status: 'approved',
      _id: { $ne: checkIn._id }
    }).sort({ createdAt: -1 });

    if (newCurrentStreak === 0) {
      // If streak was reset to 0, start fresh from 1
      newCurrentStreak = 1;
    } else if (lastApprovedCheckIn) {
      const checkinDateStr = formatInTimeZone(checkIn.createdAt, userTimezone, 'yyyy-MM-dd');
      const lastCheckinDateStr = formatInTimeZone(lastApprovedCheckIn.createdAt, userTimezone, 'yyyy-MM-dd');

      if (checkinDateStr === lastCheckinDateStr) {
        // Double check-in on the same calendar day, streak remains unchanged
      } else {
        const [currYear, currMonth, currDate] = checkinDateStr.split('-').map(Number);
        const [lastYear, lastMonth, lastDate] = lastCheckinDateStr.split('-').map(Number);

        const localCurr = new Date(currYear, currMonth - 1, currDate);
        const localLast = new Date(lastYear, lastMonth - 1, lastDate);

        const daysDifference = differenceInCalendarDays(localCurr, localLast);

        if (daysDifference === 1) {
          // Checked in on consecutive calendar days, streak continues!
          newCurrentStreak += 1;
        } else if (daysDifference > 1) {
          // Missed one or more days, streak resets to 1
          newCurrentStreak = 1;
        }
      }
    } else {
      // First ever approved check-in
      newCurrentStreak = 1;
    }

    // Update longest streak
    const longestStreak = Math.max(checkinOwner.longestStreak, newCurrentStreak);

    // Update check-in owner profile
    checkinOwner.currentStreak = newCurrentStreak;
    checkinOwner.longestStreak = longestStreak;
    checkinOwner.lastActiveAt = now;

    // Badge triggers
    if (newCurrentStreak >= 5 && !checkinOwner.badges.includes('pact_keeper')) checkinOwner.badges.push('pact_keeper');
    if (newCurrentStreak >= 14 && !checkinOwner.badges.includes('streak_legend')) checkinOwner.badges.push('streak_legend');
    
    // Check if goal is fully completed (100% progress)
    if (goal.progress === 100) {
      goal.status = 'completed';
      checkinOwner.completedGoals += 1;
    }

    await checkinOwner.save();

    // Calculate nextCheckinDue for the goal
    const daysToAdd = goal.frequency === 'daily' ? 1 : goal.frequency === 'every2days' ? 2 : 7;
    const deadlineDate = addDays(now, daysToAdd);
    goal.nextCheckinDue = toDate(formatInTimeZone(deadlineDate, userTimezone, "yyyy-MM-dd'T'23:59:59.SSSXXX"), { timeZone: userTimezone });

    await goal.save();

    // Persistent Notification for the owner
    await createNotification(req.app, {
      userId: checkIn.user,
      type: 'checkin_approved',
      message: `Your check-in for goal "${goal.title}" was approved by ${req.user.name}! 🤝`,
      data: { partnerId: req.user._id, checkInId: checkIn._id }
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${checkIn.user.toString()}`).emit('checkin_approved', {
        checkInId: checkIn._id,
        streak: {
          currentStreak: checkinOwner.currentStreak,
          longestStreak: checkinOwner.longestStreak,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Check-in approved successfully! Partner pulse and streaks updated.',
      data: checkIn,
      streak: {
        currentStreak: checkinOwner.currentStreak,
        longestStreak: checkinOwner.longestStreak
      }
    });
  } catch (error) {
    console.error('Error in approveCheckIn:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during check-in approval',
    });
  }
};

/**
 * @desc    Get check-in feed for active partnerships (pending partner approval)
 * @route   GET /api/checkins/feed
 * @access  Private
 */
const getCheckInFeed = async (req, res) => {
  try {
    // Find active partnerships first
    const activePartnerships = await Partnership.find({
      $or: [{ requester: req.user._id }, { recipient: req.user._id }],
      status: 'active'
    })
    .populate('requester', 'name username')
    .populate('recipient', 'name username');

    if (!activePartnerships || activePartnerships.length === 0) {
      return res.status(200).json({ success: true, data: [], hasMore: false, nextCursor: null });
    }

    // Determine the partner IDs and build a name map
    const partnerIds = [];
    const partnerNameMap = {};

    activePartnerships.forEach(active => {
      const isRequester = active.requester._id.toString() === req.user._id.toString();
      const partner = isRequester ? active.recipient : active.requester;
      partnerIds.push(partner._id);
      partnerNameMap[partner._id.toString()] = partner.name;
    });

    const limit = parseInt(req.query.limit) || 10;
    const query = { user: { $in: partnerIds } };
    
    // If cursor (timestamp string) is passed, get items created before that timestamp
    if (req.query.cursor) {
      query.createdAt = { $lt: new Date(req.query.cursor) };
    }

    // Find recent checkins by the partners that need approval, or were recently approved
    // Fetch one extra item to determine if there is a next page
    const checkIns = await CheckIn.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate('goal', 'title category');

    const hasMore = checkIns.length > limit;
    const paginatedCheckIns = hasMore ? checkIns.slice(0, limit) : checkIns;
    const nextCursor = hasMore && paginatedCheckIns.length > 0 ? paginatedCheckIns[paginatedCheckIns.length - 1].createdAt : null;

    const feedItems = paginatedCheckIns.map(c => ({
      id: c._id.toString(),
      checkInId: c._id.toString(),
      partnerName: partnerNameMap[c.user.toString()] || "Partner",
      action: "completed a check-in",
      goalTitle: c.goal?.title || "Goal",
      timestamp: new Date(c.createdAt).toLocaleDateString(),
      note: c.note,
      approved: c.status === 'approved',
      isBadge: false,
      comments: c.comments || [],
      reactions: {
        fire: c.reactions?.fire?.length || 0,
        clap: c.reactions?.clap?.length || 0,
        muscle: c.reactions?.muscle?.length || 0
      },
      createdAt: c.createdAt
    }));

    res.status(200).json({ success: true, data: feedItems, hasMore, nextCursor });
  } catch (error) {
    console.error('Get Checkin Feed Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving feed' });
  }
};

/**
 * @desc    Get check-in history for a specific goal
 * @route   GET /api/checkins/history/:goalId
 * @access  Private
 */
const getCheckInHistory = async (req, res) => {
  try {
    const { goalId } = req.params;
    
    const Goal = require('../models/Goal');
    const Partnership = require('../models/Partnership');
    
    const goal = await Goal.findById(goalId);
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    
    const isOwner = goal.owner.toString() === req.user._id.toString();
    
    let isPartner = false;
    if (!isOwner) {
      const activePartnership = await Partnership.findOne({
        $or: [
          { requester: req.user._id, recipient: goal.owner },
          { requester: goal.owner, recipient: req.user._id }
        ],
        status: 'active'
      });
      isPartner = !!activePartnership;
    }
    
    if (!isOwner && !isPartner && !goal.isPublic) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this goal history' });
    }

    const checkIns = await CheckIn.find({ goal: goalId })
      .sort({ createdAt: 1 }); // Chronological order
      
    res.status(200).json({ success: true, data: checkIns });
  } catch (error) {
    console.error('Get Checkin History Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving history' });
  }
};

/**
 * @desc    Add a comment to a check-in
 * @route   POST /api/checkins/:id/comments
 * @access  Private
 */
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Comment text is required' });

    const checkIn = await CheckIn.findById(req.params.id).populate('goal');
    if (!checkIn) return res.status(404).json({ success: false, message: 'Check-in not found' });

    const Goal = require('../models/Goal');
    const Partnership = require('../models/Partnership');
    const isOwner = checkIn.user.toString() === req.user._id.toString();
    
    let isPartner = false;
    if (!isOwner) {
      const activePartnership = await Partnership.findOne({
        $or: [
          { requester: req.user._id, recipient: checkIn.user },
          { requester: checkIn.user, recipient: req.user._id }
        ],
        status: 'active'
      });
      isPartner = !!activePartnership;
    }

    if (!isOwner && !isPartner && !checkIn.goal.isPublic) {
      return res.status(403).json({ success: false, message: 'Not authorized to comment on this check-in' });
    }

    const comment = { user: req.user._id, text };
    checkIn.comments.push(comment);
    await checkIn.save();

    // Re-fetch to populate user
    const updatedCheckIn = await CheckIn.findById(req.params.id).populate('comments.user', 'name username');

    if (checkIn.user.toString() !== req.user._id.toString()) {
      await createNotification(req.app, {
        userId: checkIn.user,
        type: 'comment',
        message: `${req.user.name} commented on your check-in: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
        data: { senderId: req.user._id, checkInId: checkIn._id }
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${checkIn.user.toString()}`).emit('comment_added', {
        checkInId: req.params.id,
        comments: updatedCheckIn.comments,
      });
    }

    res.status(201).json({ success: true, data: updatedCheckIn.comments });
  } catch (error) {
    console.error('Add Comment Error:', error);
    res.status(500).json({ success: false, message: 'Server error adding comment' });
  }
};

/**
 * @desc    Add a reaction to a check-in
 * @route   POST /api/checkins/:id/reactions
 * @access  Private
 */
const addReaction = async (req, res) => {
  try {
    const { type } = req.body; // 'fire', 'clap', 'muscle'
    if (!['fire', 'clap', 'muscle'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid reaction type' });
    }

    const checkIn = await CheckIn.findById(req.params.id).populate('goal');
    if (!checkIn) return res.status(404).json({ success: false, message: 'Check-in not found' });

    const Goal = require('../models/Goal');
    const Partnership = require('../models/Partnership');
    const isOwner = checkIn.user.toString() === req.user._id.toString();
    
    let isPartner = false;
    if (!isOwner) {
      const activePartnership = await Partnership.findOne({
        $or: [
          { requester: req.user._id, recipient: checkIn.user },
          { requester: checkIn.user, recipient: req.user._id }
        ],
        status: 'active'
      });
      isPartner = !!activePartnership;
    }

    if (!isOwner && !isPartner && !checkIn.goal.isPublic) {
      return res.status(403).json({ success: false, message: 'Not authorized to react to this check-in' });
    }

    if (!checkIn.reactions) checkIn.reactions = { fire: [], clap: [], muscle: [] };
    if (!checkIn.reactions[type]) checkIn.reactions[type] = [];
    
    const userId = req.user._id.toString();
    const existingIndex = checkIn.reactions[type].findIndex(id => id.toString() === userId);
    
    if (existingIndex > -1) {
      checkIn.reactions[type].splice(existingIndex, 1); // Toggle off
    } else {
      checkIn.reactions[type].push(req.user._id); // Toggle on
    }
    
    await checkIn.save();

    const formattedReactions = {
      fire: checkIn.reactions.fire.length,
      clap: checkIn.reactions.clap.length,
      muscle: checkIn.reactions.muscle.length
    };

    if (checkIn.user.toString() !== req.user._id.toString() && existingIndex === -1) {
      await createNotification(req.app, {
        userId: checkIn.user,
        type: 'reaction',
        message: `${req.user.name} reacted with ${type} to your check-in!`,
        data: { senderId: req.user._id, checkInId: checkIn._id }
      });
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${checkIn.user.toString()}`).emit('reaction_added', {
        checkInId: req.params.id,
        reactions: formattedReactions,
      });
    }

    res.status(200).json({ success: true, data: checkIn.reactions });
  } catch (error) {
    console.error('Add Reaction Error:', error);
    res.status(500).json({ success: false, message: 'Server error adding reaction' });
  }
};

/**
 * @desc    Get public check-ins for community feed
 * @route   GET /api/checkins/public
 * @access  Private
 */
const getPublicCheckIns = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const query = { status: 'approved' };
    
    if (req.query.cursor) {
      query.createdAt = { $lt: new Date(req.query.cursor) };
    }

    const checkIns = await CheckIn.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate('user', 'name username avatar currentStreak')
      .populate('goal', 'title category');

    const hasMore = checkIns.length > limit;
    const paginatedCheckIns = hasMore ? checkIns.slice(0, limit) : checkIns;
    const nextCursor = hasMore && paginatedCheckIns.length > 0 ? paginatedCheckIns[paginatedCheckIns.length - 1].createdAt : null;

    const feedItems = paginatedCheckIns.map(c => ({
      _id: c._id.toString(),
      user: {
        _id: c.user?._id,
        name: c.user?.name || 'User',
        username: c.user?.username || 'user',
        avatar: c.user?.avatar || '',
        currentStreak: c.user?.currentStreak || 0
      },
      goal: {
        title: c.goal?.title || 'Goal',
        category: c.goal?.category || 'other'
      },
      note: c.note,
      createdAt: c.createdAt,
      comments: c.comments || [],
      reactions: {
        fire: c.reactions?.fire?.length || 0,
        clap: c.reactions?.clap?.length || 0,
        muscle: c.reactions?.muscle?.length || 0
      }
    }));

    res.status(200).json({ success: true, data: feedItems, hasMore, nextCursor });
  } catch (error) {
    console.error('Get Public Checkins Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving public checkins' });
  }
};

module.exports = {
  submitCheckIn,
  approveCheckIn,
  getCheckInFeed,
  getCheckInHistory,
  addComment,
  addReaction,
  getPublicCheckIns,
};
