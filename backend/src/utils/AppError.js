// A small typed error for cases where WE deliberately reject a request
// (bad credentials, forbidden role, not found, etc.) as opposed to an
// unexpected bug. errorHandler.js checks `err.isOperational` to decide
// whether to trust `err.message` in the response, or hide it behind a
// generic "Internal Server Error" message.

export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
