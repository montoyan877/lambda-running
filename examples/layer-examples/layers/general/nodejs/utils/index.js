/**
 * Utils layer - Provides common utility functions (AWS Lambda structure)
 */

const formatDate = (date = new Date()) => {
  return date.toISOString();
};

const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

const logInfo = (message) => {
  console.log(`[INFO][${formatDate()}] ${message}`);
};

module.exports = {
  formatDate,
  generateId,
  logInfo,
}; 