const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { sanitizeUser } = require('../utils/helpers');
const { sendEmail } = require('../services/emailService');
const crypto = require('crypto');

// Register user
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, organization } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(ApiError.conflict('An account with this email already exists'));
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      organization: organization || undefined,
    });

    const token = user.generateAuthToken();

    return ApiResponse.created(res, 'User registered successfully', {
      user: sanitizeUser(user),
      token,
    });
  } catch (error) {
    next(error);
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(ApiError.badRequest('Please provide email and password'));
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(ApiError.unauthorized('Invalid email or password'));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(ApiError.unauthorized('Invalid email or password'));
    }

    if (!user.isActive) {
      return next(ApiError.forbidden('Your account has been deactivated. Please contact support.'));
    }

    const token = user.generateAuthToken();

    return ApiResponse.success(res, 'Login successful', {
      user: sanitizeUser(user),
      token,
    });
  } catch (error) {
    next(error);
  }
};

// Get current logged-in user profile
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('organization', 'name type');
    return ApiResponse.success(res, 'Current user retrieved', sanitizeUser(user));
  } catch (error) {
    next(error);
  }
};

// Forgot password request
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Return success even if email doesn't exist for security
      return ApiResponse.success(res, 'If an account exists, a password reset link has been dispatched');
    }

    const resetToken = user.generateResetToken();
    await user.save({ validateBeforeSave: false });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    const message = `You requested a password reset on FindBack. Please navigate to the link below to set a new password:\n\n${resetUrl}\n\nThis link is valid for 30 minutes. If you did not request this, you can ignore this email.`;

    await sendEmail({
      to: user.email,
      subject: 'FindBack — Password Reset Request',
      text: message,
      html: `
        <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #1e293b;">
          <h2>Reset Your FindBack Password</h2>
          <p>Click the button below to reset your password. This link is valid for 30 minutes.</p>
          <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
          <p style="font-size: 12px; color: #64748b; margin-top: 20px;">If the button doesn't work, copy and paste this URL into your browser: ${resetUrl}</p>
        </div>
      `,
    });

    return ApiResponse.success(res, 'If an account exists, a password reset link has been dispatched');
  } catch (error) {
    next(error);
  }
};

// Reset password
exports.resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(ApiError.badRequest('Invalid or expired reset token'));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = user.generateAuthToken();

    return ApiResponse.success(res, 'Password successfully reset', {
      user: sanitizeUser(user),
      token,
    });
  } catch (error) {
    next(error);
  }
};
