const validateRequiredFields = (requiredFields, requestBody, res) => {
    const missingFields = requiredFields.filter((field) => !requestBody[field]);
  
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `The following fields are required: ${missingFields.join(", ")}`,
      });
    }
  
    return null; // Return null if there are no missing fields
  };
  
  module.exports = { validateRequiredFields };
  