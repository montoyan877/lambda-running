"use strict";

/**
 * Lambda Running
 * Main entry point for the lambda-running package
 */

const {
  runHandler,
  scanForHandlers
} = require("./lambda-runner");
const {
  saveEvent,
  getEvents,
  getEvent,
  deleteEvent
} = require("./event-store");
module.exports = {
  runHandler,
  scanForHandlers,
  saveEvent,
  getEvents,
  getEvent,
  deleteEvent
};