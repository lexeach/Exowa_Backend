/**
 * Utility to send a structured response for success cases
 * @param {Object} res - Express response object
 * @param {number} code - HTTP status code
 * @param {string} message - Response message
 * @param {Object | Array} [data] - Response data (optional)
 * @param {Object} [pagination] - Pagination metadata (optional)
 * @param {number} pagination.current_page - Current page number
 * @param {number} pagination.per_page - Items per page
 * @param {number} pagination.total - Total number of items
 * @param {number} pagination.last_page - Total number of pages
 * @param {number} pagination.from - Starting index of the current page
 * @param {number} pagination.to - Ending index of the current page
 * @returns {Object} Express response object
 */
exports.successResponse = async (res, code, message, data = [], pagination = null) => {
  const response = {
    code,
    message,
    data: data,
  };

  // Add meta if pagination is provided
  if (pagination) {
    response.meta = {
      current_page: pagination.current_page,
      per_page: pagination.per_page,
      total: pagination.total,
      last_page: pagination.last_page,
      from: pagination.from,
      to: pagination.to,
    };
  }

  return res.status(code).json(response);
};


/**
 * Utility to handle and send error responses
 * @param {Object} res - Express response object
 * @param {Object} err - Error object or string
 * @returns {Object} Express response object
 */
exports.errorResponse = async (res, err) => {
  console.error("Error:", err); // Log error for debugging
  const message = err.message || err;
  return res.status(400).json({
    code: 400,
    message,
    body: [],
  });
};



/**
 * Utility to handle and send custom error responses
 * @param {Object} res - Express response object
 * @param {number} code - HTTP status code
 * @param {string} message - Error message
 * @param {Object | Array} [data] - Optional additional data for the response body
 * @returns {Object} Express response object
 */
exports.customErrorResponse = async (res, code, message, data = []) => {
  const response = {
    code,
    message,
    body: data,
  };
  return res.status(code).json(response);
};