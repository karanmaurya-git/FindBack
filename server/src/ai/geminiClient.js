const { getModel } = require('../config/gemini');

// Downloads an image and returns it as base64 + mimeType, so it can be
// sent inline to Gemini's multimodal input. Cloudinary/local URLs only —
// Gemini's generateContent needs the actual bytes, not a remote URL.
const fetchImageAsInlinePart = async (imageUrl) => {
  try {
    // Images uploaded when Cloudinary isn't configured are stored as
    // relative paths (e.g. "/uploads/photo.png"). Node's fetch() can't
    // resolve a relative URL on its own, so point it back at this same
    // server first.
    const resolvedUrl = imageUrl.startsWith('/')
      ? `${process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`}${imageUrl}`
      : imageUrl;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(resolvedUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType: contentType,
      },
    };
  } catch (error) {
    console.error(`Could not fetch image for AI vision analysis: ${error.message}`);
    return null;
  }
};

// Analyze text similarity and generate match reasoning
const analyzeItemsWithAI = async (lostItem, foundItem) => {
  const model = getModel();
  if (!model) {
    return fallbackMatchAnalysis(lostItem, foundItem);
  }

  // Pull one representative photo from each report (if any) so the AI can
  // visually compare them, not just read the text descriptions.
  const lostImageUrl = lostItem.images?.[0]?.url;
  const foundImageUrl = foundItem.images?.[0]?.url;

  const imageParts = [];
  if (lostImageUrl) {
    const part = await fetchImageAsInlinePart(lostImageUrl);
    if (part) imageParts.push({ label: 'lost', part });
  }
  if (foundImageUrl) {
    const part = await fetchImageAsInlinePart(foundImageUrl);
    if (part) imageParts.push({ label: 'found', part });
  }

  const hasImages = imageParts.length > 0;

  const prompt = `
You are the SmartMatch AI engine for a Lost & Found platform called FindBack.
Analyze whether the following two items might be the same object.
${hasImages ? `\n${imageParts.length === 2 ? 'Two photos are attached: the FIRST photo is the reported LOST item, the SECOND photo is the reported FOUND item.' : `One photo is attached, showing the reported ${imageParts[0].label.toUpperCase()} item.`} Visually compare shape, color, brand marks, logos, wear/scuff patterns, and any other distinguishing visual details, in addition to the text below.\n` : ''}
LOST ITEM REPORT:
- Name: ${lostItem.name}
- Category: ${lostItem.category?.name || 'Unknown'}
- Subcategory: ${lostItem.subcategory || 'N/A'}
- Brand: ${lostItem.brand || 'N/A'}
- Model: ${lostItem.model || 'N/A'}
- Color: ${lostItem.color || 'N/A'}
- Description: ${lostItem.description}
- Identifying Features: ${lostItem.identifyingFeatures || 'N/A'}
- Location: ${lostItem.location?.address || lostItem.location?.area || 'N/A'}
- Date Lost: ${lostItem.lostDate ? new Date(lostItem.lostDate).toDateString() : 'N/A'}

FOUND ITEM REPORT:
- Name: ${foundItem.name}
- Category: ${foundItem.category?.name || 'Unknown'}
- Brand: ${foundItem.brand || 'N/A'}
- Model: ${foundItem.model || 'N/A'}
- Color: ${foundItem.color || 'N/A'}
- Description: ${foundItem.description}
- Identifying Features: ${foundItem.identifyingFeatures || 'N/A'}
- Location: ${foundItem.location?.address || foundItem.location?.area || 'N/A'}
- Date Found: ${foundItem.foundDate ? new Date(foundItem.foundDate).toDateString() : 'N/A'}

SAFETY & COMPLIANCE RULES:
1. AI is an assistant, NEVER state definitive ownership. Use phrasing like "Potential match", "Both reports describe...", "Features align".
2. Return a strict JSON response (NO markdown fences, just valid JSON).

JSON FORMAT:
{
  "similarityScore": <integer 0-100>,
  "matchedFeatures": [
    { "feature": "category", "score": <0-100>, "detail": "explanation" },
    { "feature": "brand_model", "score": <0-100>, "detail": "explanation" },
    { "feature": "color_visuals", "score": <0-100>, "detail": "explanation" },
    { "feature": "location_proximity", "score": <0-100>, "detail": "explanation" },
    { "feature": "date_timeline", "score": <0-100>, "detail": "explanation" }${hasImages ? ',\n    { "feature": "visual_appearance", "score": <0-100>, "detail": "what you actually observed comparing the photo(s)" }' : ''}
  ],
  "aiExplanation": "A friendly 2-3 sentence explanation of why this might be a match, highlighting key similarities and cautious advice that human verification is required."
}
`;

  try {
    const contentParts = [prompt, ...imageParts.map((i) => i.part)];
    const result = await model.generateContent(contentParts);
    const responseText = result.response.text().trim();
    // Clean potential markdown formatting
    const cleanedText = responseText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(cleanedText);
    parsed.visualAnalysisUsed = hasImages;
    return parsed;
  } catch (error) {
    console.error('Gemini AI analysis error:', error.message);
    return fallbackMatchAnalysis(lostItem, foundItem);
  }
};

// Algorithmic fallback if Gemini API key is missing or offline
const fallbackMatchAnalysis = (lostItem, foundItem) => {
  let score = 0;
  const features = [];

  // Category
  const cat1 = lostItem.category?._id?.toString() || lostItem.category?.toString();
  const cat2 = foundItem.category?._id?.toString() || foundItem.category?.toString();
  if (cat1 && cat2 && cat1 === cat2) {
    score += 25;
    features.push({ feature: 'category', score: 100, detail: 'Exact category match' });
  }

  // Brand
  if (lostItem.brand && foundItem.brand) {
    if (lostItem.brand.toLowerCase() === foundItem.brand.toLowerCase()) {
      score += 20;
      features.push({ feature: 'brand', score: 100, detail: `Same brand (${lostItem.brand})` });
    }
  }

  // Color
  if (lostItem.color && foundItem.color) {
    if (lostItem.color.toLowerCase() === foundItem.color.toLowerCase()) {
      score += 15;
      features.push({ feature: 'color', score: 95, detail: `Matching color (${lostItem.color})` });
    }
  }

  // Name keyword overlap
  const words1 = (lostItem.name || '').toLowerCase().split(/\s+/);
  const words2 = (foundItem.name || '').toLowerCase().split(/\s+/);
  const commonWords = words1.filter(w => w.length > 2 && words2.includes(w));
  if (commonWords.length > 0) {
    score += Math.min(20, commonWords.length * 10);
    features.push({ feature: 'keywords', score: 85, detail: `Shared terms: ${commonWords.join(', ')}` });
  }

  // Location/Area check
  if (lostItem.location?.area && foundItem.location?.area) {
    if (lostItem.location.area.toLowerCase() === foundItem.location.area.toLowerCase()) {
      score += 15;
      features.push({ feature: 'location', score: 90, detail: `Both reported near ${lostItem.location.area}` });
    }
  }

  const finalScore = Math.min(95, Math.max(20, score));
  const explanation = `Potential match identified with ${finalScore}% estimated similarity. Both items share matching traits such as ${features.map(f => f.feature).join(', ')}. Note: Human verification is required to confirm ownership.`;

  return {
    similarityScore: finalScore,
    matchedFeatures: features,
    aiExplanation: explanation,
    visualAnalysisUsed: false,
  };
};

module.exports = { analyzeItemsWithAI, fallbackMatchAnalysis };
