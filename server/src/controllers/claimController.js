const Claim = require('../models/Claim');
const Item = require('../models/Item');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const crypto = require('crypto');
const QRCode = require('qrcode');
const { sendEmail } = require('../services/emailService');

// Submit a claim on an item
exports.submitClaim = async (req, res, next) => {
  try {
    const { itemId, matchId, description, verificationAnswers, handoverMethod, handoverLocation } = req.body;

    const item = await Item.findById(itemId);
    if (!item) return next(ApiError.notFound('Item not found'));

    if (item.user.toString() === req.user._id.toString()) {
      return next(ApiError.badRequest('You cannot submit a claim on your own report'));
    }

    // Only Found items can be claimed. A Lost item report has nothing in
    // anyone's possession to hand over — if you found something matching
    // someone's lost report, message them instead of "claiming" it.
    if (item.type !== 'found') {
      return next(
        ApiError.badRequest(
          'You can only submit an ownership claim on a Found item. This is a Lost item report — message the reporter directly if you believe you found their item.'
        )
      );
    }

    if (item.status === 'returned' || item.status === 'closed') {
      return next(ApiError.badRequest('This item has already been marked as returned or closed'));
    }

    // Check if user already submitted a pending claim
    const existing = await Claim.findOne({
      claimant: req.user._id,
      item: itemId,
      claimStatus: { $in: ['pending', 'under_verification', 'approved'] },
    });
    if (existing) {
      return next(ApiError.conflict('You already have an active claim on this item'));
    }

    const claim = await Claim.create({
      claimant: req.user._id,
      item: itemId,
      match: matchId || undefined,
      description,
      verificationAnswers: verificationAnswers || [],
      handoverMethod,
      handoverLocation,
      claimStatus: 'pending',
    });

    // Update item status
    item.status = 'claimed';
    await item.save();

    // Log Activity
    await Activity.create({
      item: item._id,
      user: req.user._id,
      action: 'claimed',
      description: `Claim submitted by ${req.user.name}`,
    });

    // Notify item reporter
    const notif = await Notification.create({
      recipient: item.user,
      type: 'claim_request',
      title: '📦 New Ownership Claim Received',
      message: `${req.user.name} submitted an ownership claim on "${item.name}". Please verify the private details.`,
      relatedItem: item._id,
      relatedClaim: claim._id,
      link: `/claims/${claim._id}`,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${item.user.toString()}`).emit('notification', notif);
    }

    return ApiResponse.created(res, 'Claim submitted successfully for verification', claim);
  } catch (error) {
    next(error);
  }
};

// Get claims (either submitted by user or received on user's reported items)
exports.getMyClaims = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Claims submitted by me
    const submittedClaims = await Claim.find({ claimant: userId })
      .populate({
        path: 'item',
        select: 'name type category images location status user',
        populate: [
          { path: 'category', select: 'name icon' },
          { path: 'user', select: 'name' },
        ],
      })
      .sort({ createdAt: -1 });

    // Find items reported by me
    const myItemIds = await Item.find({ user: userId }).distinct('_id');

    // Claims received on my items
    const receivedClaims = await Claim.find({ item: { $in: myItemIds } })
      .populate('claimant', 'name email avatar isVerified')
      .populate({
        path: 'item',
        select: 'name type category images location status',
        populate: { path: 'category', select: 'name icon' },
      })
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, 'Claims retrieved', {
      submitted: submittedClaims,
      received: receivedClaims,
    });
  } catch (error) {
    next(error);
  }
};

// Get single claim details (Only claimant or item owner or admin can view verification)
exports.getClaimById = async (req, res, next) => {
  try {
    const claim = await Claim.findById(req.params.id)
      .populate('claimant', 'name email phone avatar isVerified')
      .populate({
        path: 'item',
        populate: [
          { path: 'category', select: 'name icon' },
          { path: 'user', select: 'name email phone avatar isVerified' },
        ],
      })
      .select('+verificationAnswers.answer +reviewNotes');

    if (!claim) return next(ApiError.notFound('Claim not found'));

    const isClaimant = claim.claimant._id.toString() === req.user._id.toString();
    const isReporter = claim.item.user._id.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'moderator'].includes(req.user.role);

    if (!isClaimant && !isReporter && !isAdmin) {
      return next(ApiError.forbidden('You are not authorized to view this claim'));
    }

    return ApiResponse.success(res, 'Claim details retrieved', claim);
  } catch (error) {
    next(error);
  }
};

// Approve or Reject Claim (Reporter or Admin)
exports.reviewClaim = async (req, res, next) => {
  try {
    const { action, reviewNotes, handoverMethod, handoverLocation } = req.body; // action: 'approve' | 'reject'
    const claim = await Claim.findById(req.params.id).populate('item');

    if (!claim) return next(ApiError.notFound('Claim not found'));

    const isReporter = claim.item.user.toString() === req.user._id.toString();
    const isAdmin = ['admin', 'moderator'].includes(req.user.role);

    if (!isReporter && !isAdmin) {
      return next(ApiError.forbidden('Only the item reporter or platform moderators can review this claim'));
    }

    if (action === 'approve') {
      claim.claimStatus = 'approved';
      claim.reviewedBy = req.user._id;
      claim.reviewNotes = reviewNotes || 'Ownership details verified';
      if (handoverMethod) claim.handoverMethod = handoverMethod;
      if (handoverLocation) claim.handoverLocation = handoverLocation;
      // Generate the token used for the in-person QR handover confirmation
      claim.handoverQrToken = crypto.randomBytes(16).toString('hex');

      claim.item.status = 'approved';
      await claim.item.save();

      // Log activity
      await Activity.create({
        item: claim.item._id,
        user: req.user._id,
        action: 'approved',
        description: `Claim approved for handover`,
      });

      // Notify claimant
      const notif = await Notification.create({
        recipient: claim.claimant,
        type: 'claim_approved',
        title: '🎉 Ownership Claim Approved!',
        message: `Your claim for "${claim.item.name}" has been approved. Please coordinate the handover.`,
        relatedItem: claim.item._id,
        relatedClaim: claim._id,
        link: `/claims/${claim._id}`,
      });

      const io = req.app.get('io');
      if (io) {
        io.to(`user_${claim.claimant.toString()}`).emit('notification', notif);
      }

      // Email the claimant too, in case they aren't actively in the app
      const claimantUser = await require('../models/User').findById(claim.claimant).select('email name');
      if (claimantUser?.email) {
        await sendEmail({
          to: claimantUser.email,
          subject: `🎉 FindBack — Your claim for "${claim.item.name}" was approved`,
          text: `Good news! Your ownership claim for "${claim.item.name}" has been approved. Sign in to FindBack to arrange the handover: ${process.env.CLIENT_URL}/claims/${claim._id}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #1e293b;">
              <h2>🎉 Your Claim Was Approved!</h2>
              <p>Your ownership claim for <strong>${claim.item.name}</strong> has been approved by the reporter.</p>
              <p>Next step: coordinate a safe handover. When you meet, use the QR handover confirmation in the app to verify the return.</p>
              <a href="${process.env.CLIENT_URL}/claims/${claim._id}" style="background-color: #16a34a; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">View Your Claim</a>
            </div>
          `,
        });
      }
    } else {
      claim.claimStatus = 'rejected';
      claim.reviewedBy = req.user._id;
      claim.reviewNotes = reviewNotes || 'Verification details did not match';

      claim.item.status = 'active';
      await claim.item.save();

      // Notify claimant
      const notif = await Notification.create({
        recipient: claim.claimant,
        type: 'claim_rejected',
        title: 'Claim Update',
        message: `Your claim for "${claim.item.name}" could not be verified by the reporter.`,
        relatedItem: claim.item._id,
        relatedClaim: claim._id,
        link: `/claims/${claim._id}`,
      });

      const io = req.app.get('io');
      if (io) {
        io.to(`user_${claim.claimant.toString()}`).emit('notification', notif);
      }

      const claimantUser = await require('../models/User').findById(claim.claimant).select('email name');
      if (claimantUser?.email) {
        await sendEmail({
          to: claimantUser.email,
          subject: `FindBack — Update on your claim for "${claim.item.name}"`,
          text: `Your ownership claim for "${claim.item.name}" could not be verified by the reporter. Reason: ${claim.reviewNotes}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #1e293b;">
              <h2>Claim Update</h2>
              <p>Your ownership claim for <strong>${claim.item.name}</strong> could not be verified by the reporter.</p>
              <p><em>${claim.reviewNotes}</em></p>
              <p>You can view the item and submit further verification details if you believe this is a mistake.</p>
            </div>
          `,
        });
      }
    }

    await claim.save();
    return ApiResponse.success(res, `Claim ${action}d successfully`, claim);
  } catch (error) {
    next(error);
  }
};

// Shared logic: records a handover confirmation for whichever side the
// requesting user is on, and finalizes the return once both sides have
// confirmed. Used by both the manual "Confirm Safe Handover" button and
// the QR-scan handover flow below.
const applyHandoverConfirmation = async (claim, req) => {
  const isClaimant = claim.claimant.toString() === req.user._id.toString();
  const isReporter = claim.item.user.toString() === req.user._id.toString();

  if (!isClaimant && !isReporter) {
    throw ApiError.forbidden('Only participants of this claim can confirm the item return');
  }

  if (isReporter) claim.confirmedByReporter = true;
  if (isClaimant) claim.confirmedByClaimant = true;

  if (claim.confirmedByReporter && claim.confirmedByClaimant) {
    claim.claimStatus = 'completed';
    claim.returnedAt = new Date();
    claim.item.status = 'returned';
    await claim.item.save();

    await Activity.create({
      item: claim.item._id,
      user: req.user._id,
      action: 'returned',
      description: 'Item successfully returned to rightful owner. Case closed.',
    });

    const notifyParty = async (recipientId) => {
      const notif = await Notification.create({
        recipient: recipientId,
        type: 'item_returned',
        title: '✨ Item Successfully Returned',
        message: `Both parties have confirmed the safe handover for "${claim.item.name}". Thank you for using FindBack!`,
        relatedItem: claim.item._id,
        relatedClaim: claim._id,
        link: `/items/${claim.item._id}`,
      });
      const io = req.app.get('io');
      if (io) io.to(`user_${recipientId.toString()}`).emit('notification', notif);
    };

    await notifyParty(claim.claimant);
    await notifyParty(claim.item.user);

    // Email both parties a closing confirmation
    const User = require('../models/User');
    const [claimantUser, reporterUser] = await Promise.all([
      User.findById(claim.claimant).select('email name'),
      User.findById(claim.item.user).select('email name'),
    ]);
    const closingEmail = (toEmail) =>
      sendEmail({
        to: toEmail,
        subject: `✨ FindBack — "${claim.item.name}" has been returned`,
        text: `Both parties have confirmed the handover for "${claim.item.name}". This case is now closed. Thank you for using FindBack!`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #1e293b;">
            <h2>✨ Item Successfully Returned</h2>
            <p>Both parties have confirmed the safe handover for <strong>${claim.item.name}</strong>. This case is now closed.</p>
            <p>Thank you for using FindBack!</p>
          </div>
        `,
      });
    if (claimantUser?.email) await closingEmail(claimantUser.email);
    if (reporterUser?.email) await closingEmail(reporterUser.email);
  }

  await claim.save();
};

// Confirm safe handover and finalize return
exports.confirmReturn = async (req, res, next) => {
  try {
    const claim = await Claim.findById(req.params.id).populate('item');
    if (!claim) return next(ApiError.notFound('Claim not found'));

    await applyHandoverConfirmation(claim, req);

    return ApiResponse.success(res, 'Return confirmation recorded', {
      claimStatus: claim.claimStatus,
      confirmedByReporter: claim.confirmedByReporter,
      confirmedByClaimant: claim.confirmedByClaimant,
    });
  } catch (error) {
    next(error);
  }
};

// Generate a QR code for the in-person handover. Either participant can
// pull this up on their phone screen for the other party to scan.
exports.getHandoverQrCode = async (req, res, next) => {
  try {
    const claim = await Claim.findById(req.params.id).select('+handoverQrToken').populate('item');
    if (!claim) return next(ApiError.notFound('Claim not found'));

    const isClaimant = claim.claimant.toString() === req.user._id.toString();
    const isReporter = claim.item.user.toString() === req.user._id.toString();
    if (!isClaimant && !isReporter) {
      return next(ApiError.forbidden('Only participants of this claim can access the handover QR code'));
    }

    if (claim.claimStatus !== 'approved') {
      return next(ApiError.badRequest('A QR handover code is only available once the claim has been approved'));
    }

    if (!claim.handoverQrToken) {
      claim.handoverQrToken = crypto.randomBytes(16).toString('hex');
      await claim.save();
    }

    const payload = JSON.stringify({ claimId: claim._id.toString(), token: claim.handoverQrToken });
    const qrCodeDataUrl = await QRCode.toDataURL(payload, { margin: 1, width: 320 });

    return ApiResponse.success(res, 'QR code generated', { qrCodeDataUrl });
  } catch (error) {
    next(error);
  }
};

// Scan the other party's QR code to confirm the handover in person.
// This calls the exact same completion logic as the manual "Confirm Safe
// Handover" button, but only after verifying the scanned token matches —
// so it can't be triggered by guessing or by tapping a button remotely.
exports.scanHandoverQr = async (req, res, next) => {
  try {
    const { scannedData } = req.body;
    if (!scannedData) return next(ApiError.badRequest('No QR data provided'));

    let parsed;
    try {
      parsed = JSON.parse(scannedData);
    } catch {
      return next(ApiError.badRequest('That QR code is not a valid FindBack handover code'));
    }

    if (parsed.claimId !== req.params.id) {
      return next(ApiError.badRequest('This QR code belongs to a different claim'));
    }

    const claim = await Claim.findById(req.params.id).select('+handoverQrToken').populate('item');
    if (!claim) return next(ApiError.notFound('Claim not found'));

    if (!claim.handoverQrToken || claim.handoverQrToken !== parsed.token) {
      return next(ApiError.badRequest('Invalid or expired handover QR code'));
    }

    await applyHandoverConfirmation(claim, req);

    return ApiResponse.success(res, 'Handover verified via QR scan', {
      claimStatus: claim.claimStatus,
      confirmedByReporter: claim.confirmedByReporter,
      confirmedByClaimant: claim.confirmedByClaimant,
    });
  } catch (error) {
    next(error);
  }
};
