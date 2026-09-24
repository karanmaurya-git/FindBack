const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
let model = null;

const initializeGemini = () => {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY not set — AI matching will be disabled');
    return null;
  }
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash' });
  console.log('Gemini AI initialized');
  return model;
};

const getModel = () => {
  if (!model) {
    initializeGemini();
  }
  return model;
};

module.exports = { initializeGemini, getModel };
