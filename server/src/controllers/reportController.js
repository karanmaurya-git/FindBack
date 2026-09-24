const Report = require('../models/Report');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

// Submit an abuse report
exports.submitReport = async (req, res, next) => {
  try {
    const { reportedUserId, reportedItemId, reportedConversationId, reason, description } = req.body;

    if (!reason || !description) {
      return next(ApiError.badRequest('Please provide reason and description for this report'));
    }

    const report = await Report.create({
      reporter: req.user._id,
      reportedUser: reportedUserId || undefined,
      reportedItem: reportedItemId || undefined,
      reportedConversation: reportedConversationId || undefined,
      reason,
      description,
    });

    return ApiResponse.created(res, 'Report submitted for moderator review', report);
  } catch (error) {
    next(error);
  }
};

// Get reports (Admin / Moderator only)
exports.getReports = async (req, res, next) => {
  try {
    const { status = 'pending' } = req.query;
    const filter = {};
    if (status !== 'all') filter.status = status;

    const reports = await Report.find(filter)
      .populate('reporter', 'name email')
      .populate('reportedUser', 'name email role')
      .populate('reportedItem', 'name type')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, 'Reports retrieved', reports);
  } catch (error) {
    next(error);
  }
};

// Review report (Admin / Moderator only)
exports.reviewReport = async (req, res, next) => {
  try {
    const { status, reviewNotes, actionTaken } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return next(ApiError.notFound('Report not found'));

    report.status = status || 'resolved';
    report.reviewedBy = req.user._id;
    if (reviewNotes) report.reviewNotes = reviewNotes;
    if (actionTaken) report.actionTaken = actionTaken;

    await report.save();
    return ApiResponse.success(res, 'Report updated', report);
  } catch (error) {
    next(error);
  }
};
