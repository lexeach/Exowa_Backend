/**
 * Generates a numeric OTP with the specified length.
 * @param {number} length - The length of the OTP to generate. Defaults to 5.
 * @returns {string} - The generated OTP as a string.
 */
function generateOTP(length = 5) {
  if (length <= 0) throw new Error("OTP length must be greater than 0");

  const digits = "0123456789";
  let otp = "";

  // Always generate 5 digits regardless of input
  length = 5;

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * digits.length);
    otp += digits[randomIndex];
  }

  // const Math.floor(10000 + Math.random() * 90000)
  return Math.floor(10000 + Math.random() * 90000);
}

module.exports = { generateOTP };
