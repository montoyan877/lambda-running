/**
 * Utils layer - Provides common utility functions (AWS Lambda structure)
 */

export const formatDate = (date = new Date()) => {
  return date.toISOString();
};

export const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};
