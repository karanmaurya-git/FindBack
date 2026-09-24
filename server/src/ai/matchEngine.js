const Item = require('../models/Item');
const Match = require('../models/Match');
const Notification = require('../models/Notification');
const { analyzeItemsWithAI } = require('./geminiClient');

/**
 * SmartMatch Engine
 * When an item is reported (lost or found), searches candidates of the opposite type
 * and executes AI matching.
 */
class SmartMatchEngine {
  // Find potential candidate items from MongoDB
  static async findCandidates(item) {
    const targetType = item.type === 'lost' ? 'found' : 'lost';

    // Candidate query: opposite type, active or under_review, not reported by same user
    const query = {
      type: targetType,
      status: { $in: ['active', 'potential_match'] },
      user: { $ne: item.user },
      category: item.category,
    };

    // If item has an organization, optionally prioritize or include
    if (item.organization) {
      query.$or = [
        { organization: item.organization },
        { visibility: 'public' },
      ];
    }

    // Limit candidates to top 15 most recent to prevent high latency/token usage
    const candidates = await Item.find(query)
      .populate('category', 'name')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(15);

    return candidates;
  }

  // Process a newly created or updated item
  static async processItem(itemId, io = null) {
    try {
      const item = await Item.findById(itemId)
        .populate('category', 'name')
        .populate('user', 'name email');

      if (!item) return;

      const candidates = await this.findCandidates(item);
      if (!candidates || candidates.length === 0) return;

      for (const candidate of candidates) {
        const lostItem = item.type === 'lost' ? item : candidate;
        const foundItem = item.type === 'found' ? item : candidate;

        // Check if a match record already exists
        const existingMatch = await Match.findOne({
          lostItem: lostItem._id,
          foundItem: foundItem._id,
        });

        if (existingMatch) continue;

        // Run AI analysis
        const analysis = await analyzeItemsWithAI(lostItem, foundItem);

        // Minimum threshold for creating a match suggestion
        if (analysis.similarityScore >= 55) {
          const match = await Match.create({
            lostItem: lostItem._id,
            foundItem: foundItem._id,
            similarityScore: analysis.similarityScore,
            matchedFeatures: analysis.matchedFeatures || [],
            aiExplanation: analysis.aiExplanation || 'A potential match based on shared attributes.',
            visualAnalysisUsed: !!analysis.visualAnalysisUsed,
            status: 'pending',
            notifiedUsers: [lostItem.user._id || lostItem.user, foundItem.user._id || foundItem.user],
          });

          // Update items status to 'potential_match' if active
          if (lostItem.status === 'active') {
            lostItem.status = 'potential_match';
            await lostItem.save();
          }
          if (foundItem.status === 'active') {
            foundItem.status = 'potential_match';
            await foundItem.save();
          }

          // Create in-app notifications for both users
          const notifyUser = async (recipientId, title, message) => {
            const notif = await Notification.create({
              recipient: recipientId,
              type: 'match_found',
              title,
              message,
              relatedItem: item._id,
              relatedMatch: match._id,
              link: `/matches/${match._id}`,
            });

            if (io) {
              io.to(`user_${recipientId.toString()}`).emit('notification', notif);
            }
          };

          const lostOwnerId = lostItem.user._id || lostItem.user;
          const foundOwnerId = foundItem.user._id || foundItem.user;

          await notifyUser(
            lostOwnerId,
            '🔎 SmartMatch AI: Potential match found!',
            `A found item matching your lost "${lostItem.name}" has been detected (${analysis.similarityScore}% match).`
          );

          await notifyUser(
            foundOwnerId,
            '🔎 SmartMatch AI: Potential owner located!',
            `A lost item report resembles the "${foundItem.name}" you found (${analysis.similarityScore}% match).`
          );
        }
      }
    } catch (error) {
      console.error('SmartMatch processing error:', error);
    }
  }
}

module.exports = SmartMatchEngine;
