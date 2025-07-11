const express = require("express");
const multer = require("multer");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

// Load env vars
dotenv.config({ path: ".env.local" });

// Import our encryption modules
const { encryptText } = require("./encrypt-text");
const { decryptText } = require("./decrypt-text");
const { encryptImage } = require("./encrypt-image");
const { decryptImage } = require("./decrypt-image");
const { encryptVideo } = require("./encrypt-video");
const { decryptVideo } = require("./decrypt-video");

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Add some security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Rate limiting - 100 requests per 15 min should be enough
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});
app.use(limiter);

// File upload config - storing in memory for now
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB max
  },
});

// Storage for OTPs and rate limiting
const otpStore = new Map(); // email -> { otp, expiresAt }
const rateLimitStore = new Map(); // ip -> { count, resetTime }

// Clean up user input
function sanitizeInput(input) {
  if (typeof input !== "string") return "";
  return input.replace(/[<>]/g, "").trim().substring(0, 1000);
}

// Simple rate limiting per IP for contact form
function rateLimitIP(ip, limit = 5, windowMs = 60000) {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= limit) return false;

  record.count++;
  return true;
}

// Validation for contact form with comprehensive email validation
function validateInput(data) {
  const errors = [];

  // Name validation
  if (!data.name) {
    errors.push("Name is required");
  } else if (typeof data.name !== "string") {
    errors.push("Name must be a valid text string");
  } else if (data.name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
  } else if (data.name.trim().length > 50) {
    errors.push("Name cannot exceed 50 characters");
  } else if (!/^[a-zA-Z\s\-'\.]+$/.test(data.name.trim())) {
    errors.push(
      "Name can only contain letters, spaces, hyphens, apostrophes, and periods"
    );
  }

  // Comprehensive email validation
  if (!data.email) {
    errors.push("Email is required");
  } else if (typeof data.email !== "string") {
    errors.push("Email must be a valid text string");
  } else {
    const email = data.email.trim().toLowerCase();

    // Check for empty email after trimming
    if (!email) {
      errors.push("Email cannot be empty or contain only whitespace");
    } else {
      // Check overall email length
      if (email.length > 254) {
        errors.push("Email address is too long (maximum 254 characters)");
      }

      // Check for minimum length
      if (email.length < 5) {
        errors.push("Email address is too short (minimum 5 characters)");
      }

      // Check for exactly one @ symbol
      const atCount = (email.match(/@/g) || []).length;
      if (atCount === 0) {
        errors.push("Email address must contain an @ symbol");
      } else if (atCount > 1) {
        errors.push("Email address cannot contain multiple @ symbols");
      } else {
        const [localPart, domain] = email.split("@");

        // Local part validation (before @)
        if (!localPart) {
          errors.push("Email address must have content before the @ symbol");
        } else {
          if (localPart.length > 64) {
            errors.push(
              "Email local part (before @) cannot exceed 64 characters"
            );
          }

          if (localPart.startsWith(".")) {
            errors.push("Email local part cannot start with a period");
          }

          if (localPart.endsWith(".")) {
            errors.push("Email local part cannot end with a period");
          }

          if (localPart.includes("..")) {
            errors.push("Email local part cannot contain consecutive periods");
          }

          // Check for valid characters in local part
          if (!/^[a-zA-Z0-9._%+-]+$/.test(localPart)) {
            errors.push(
              "Email local part contains invalid characters (only letters, numbers, dots, underscores, percent signs, plus signs, and hyphens allowed)"
            );
          }

          // Check for special character combinations
          if (
            localPart.startsWith("+") ||
            localPart.startsWith("-") ||
            localPart.startsWith("_")
          ) {
            errors.push("Email local part cannot start with +, -, or _");
          }

          if (
            localPart.endsWith("+") ||
            localPart.endsWith("-") ||
            localPart.endsWith("_")
          ) {
            errors.push("Email local part cannot end with +, -, or _");
          }
        }

        // Domain validation (after @)
        if (!domain) {
          errors.push("Email address must have a domain after the @ symbol");
        } else {
          if (domain.length > 253) {
            errors.push("Email domain is too long (maximum 253 characters)");
          }

          if (domain.length < 3) {
            errors.push("Email domain is too short (minimum 3 characters)");
          }

          if (domain.startsWith(".")) {
            errors.push("Email domain cannot start with a period");
          }

          if (domain.endsWith(".")) {
            errors.push("Email domain cannot end with a period");
          }

          if (domain.includes("..")) {
            errors.push("Email domain cannot contain consecutive periods");
          }

          if (domain.startsWith("-") || domain.endsWith("-")) {
            errors.push("Email domain cannot start or end with a hyphen");
          }

          // Check for at least one period in domain
          if (!domain.includes(".")) {
            errors.push("Email domain must contain at least one period");
          } else {
            const domainParts = domain.split(".");

            // Check each domain part
            for (let i = 0; i < domainParts.length; i++) {
              const part = domainParts[i];

              if (part.length === 0) {
                errors.push(
                  "Email domain cannot contain empty parts between periods"
                );
                break;
              }

              if (part.length > 63) {
                errors.push(
                  `Email domain part '${part}' is too long (maximum 63 characters)`
                );
                break;
              }

              if (!/^[a-zA-Z0-9-]+$/.test(part)) {
                errors.push(
                  `Email domain part '${part}' contains invalid characters (only letters, numbers, and hyphens allowed)`
                );
                break;
              }

              if (part.startsWith("-") || part.endsWith("-")) {
                errors.push(
                  `Email domain part '${part}' cannot start or end with a hyphen`
                );
                break;
              }

              // Check if it's the TLD (last part)
              if (i === domainParts.length - 1) {
                if (part.length < 2) {
                  errors.push(
                    "Email top-level domain must be at least 2 characters long"
                  );
                }

                if (!/^[a-zA-Z]+$/.test(part)) {
                  errors.push(
                    "Email top-level domain can only contain letters"
                  );
                }
              }
            }
          }

          // Check for common invalid domains
          const invalidDomains = [
            "localhost",
            "test.com",
            "example.com",
            "test.test",
            "example.example",
          ];

          if (invalidDomains.includes(domain)) {
            errors.push("Please use a valid email domain");
          }

          // Check for disposable email domains
          const disposableDomains = [
            "tempmail.org",
            "10minutemail.com",
            "guerrillamail.com",
            "mailinator.com",
            "yopmail.com",
            "throwaway.email",
            "temp-mail.org",
            "sharklasers.com",
            "grr.la",
            "dispostable.com",
          ];

          if (disposableDomains.includes(domain)) {
            errors.push(
              "Please use a permanent email address (disposable email services are not allowed)"
            );
          }

          // Check for suspicious patterns
          if (
            domain.includes("test") ||
            domain.includes("fake") ||
            domain.includes("invalid")
          ) {
            errors.push(
              "Email domain appears to be invalid or for testing purposes"
            );
          }

          // Check for IP addresses in domain (basic check)
          if (/^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
            errors.push("Email domain cannot be an IP address");
          }

          // Check for bracket notation (not commonly supported)
          if (domain.includes("[") || domain.includes("]")) {
            errors.push("Email domain cannot contain square brackets");
          }
        }
      }

      // Final comprehensive regex check if no other errors
      if (errors.length === 0) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
          errors.push("Email address format is invalid");
        }
      }
    }
  }

  // Message validation
  if (!data.message) {
    errors.push("Message is required");
  } else if (typeof data.message !== "string") {
    errors.push("Message must be a valid text string");
  } else if (data.message.trim().length < 10) {
    errors.push("Message must be at least 10 characters long");
  } else if (data.message.trim().length > 1000) {
    errors.push("Message cannot exceed 1000 characters");
  } else if (!/^[\w\s\.\,\!\?\-\'\"\:\;\(\)]+$/.test(data.message.trim())) {
    errors.push("Message contains invalid characters");
  }

  return {
    isValid: errors.length === 0,
    errors,
    // Return sanitized data
    sanitizedData: {
      name: data.name?.trim(),
      email: data.email?.trim().toLowerCase(),
      message: data.message?.trim(),
    },
  };
}

// Setup nodemailer transporter
function createTransporter() {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      pool: true, // Connection pooling helps with performance
      maxConnections: 5,
      maxMessages: 10,
      rateLimit: 3, // 3 messages per second max
      tls: {
        rejectUnauthorized: false, // Sometimes needed for self-signed certs
      },
    });

    return transporter;
  } catch (error) {
    console.error("❌ Error creating email transporter:", error);
    throw new Error("Failed to create email transporter");
  }
}

// Send OTP endpoint
app.post("/api/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    // Check if email is valid
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address.",
      });
    }

    // Make sure we have email config
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error("❌ Missing email configuration:");
      console.error("GMAIL_USER:", process.env.GMAIL_USER ? "Set" : "Missing");
      console.error(
        "GMAIL_APP_PASSWORD:",
        process.env.GMAIL_APP_PASSWORD ? "Set" : "Missing"
      );

      return res.status(500).json({
        success: false,
        message: "Email service not configured properly",
      });
    }

    const sanitizedEmail = sanitizeInput(email);

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store the OTP
    otpStore.set(sanitizedEmail, { otp, expiresAt });

    // Try to create email transporter
    let transporter;
    try {
      transporter = createTransporter();

      // Test connection first
      await transporter.verify();
    } catch (transporterError) {
      console.error("❌ Email transporter error:", transporterError);
      return res.status(500).json({
        success: false,
        message: "Unable to send email at this time. Please try again later.",
        details: transporterError.message,
      });
    }

    // OTP Email
    const mailOptions = {
      from: `"Deimos Cipher Security" <${process.env.GMAIL_USER}>`,
      to: sanitizedEmail,
      subject: `Verification Code - Expires in 5 minutes`,
      html: `
        <!DOCTYPE html>
        <html lang="en" xmlns="http://www.w3.org/1999/xhtml">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <title>Verification Code</title>
            <!--[if mso]>
            <noscript>
                <xml>
                    <o:OfficeDocumentSettings>
                        <o:AllowPNG/>
                        <o:PixelsPerInch>96</o:PixelsPerInch>
                    </o:OfficeDocumentSettings>
                </xml>
            </noscript>
            <![endif]-->
            <style>
                /* Reset and Base Styles */
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    background-color: #f5f5f7;
                    color: #1d1d1f;
                    line-height: 1.6;
                    -webkit-text-size-adjust: 100%;
                    -ms-text-size-adjust: 100%;
                }
                
                /* Container */
                .email-container {
                    max-width: 600px;
                    margin: 20px auto;
                    background-color: #ffffff;
                    border-radius: 12px;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
                    overflow: hidden;
                }
                
                /* Header */
                .email-header {
                    background-color: #f1f3f4;
                    padding: 40px 32px;
                    text-align: center;
                    color: #212529;
                    border-bottom: 1px solid #e9ecef;
                }
                
                .email-header h1 {
                    margin: 0;
                    font-size: 28px;
                    font-weight: 600;
                    letter-spacing: -0.5px;
                }
                
                .email-header p {
                    margin: 8px 0 0 0;
                    font-size: 16px;
                    font-weight: 400;
                    opacity: 0.7;
                }
                
                /* Main Content */
                .email-content {
                    padding: 48px 32px;
                }
                
                .otp-section {
                    text-align: center;
                    margin-bottom: 40px;
                }
                
                .otp-label {
                    color: #86868b;
                    margin: 0 0 24px 0;
                    font-size: 18px;
                    font-weight: 500;
                }
                
                .otp-container {
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    border: 2px solid #dee2e6;
                    border-radius: 16px;
                    padding: 40px 32px;
                    margin: 24px 0;
                    position: relative;
                    transition: all 0.3s ease;
                }
                
                .otp-container:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
                }
                
                .otp-code {
                    color: #1d1d1f;
                    font-size: 42px;
                    font-weight: 700;
                    letter-spacing: 12px;
                    font-family: 'SF Mono', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', monospace;
                    margin: 0;
                    word-spacing: 8px;
                    user-select: all;
                    -webkit-user-select: all;
                    -moz-user-select: all;
                    -ms-user-select: all;
                }
                
                .otp-copy-hint {
                    color: #86868b;
                    font-size: 12px;
                    margin-top: 12px;
                    font-style: italic;
                }
                
                .expiry-info {
                    color: #86868b;
                    font-size: 15px;
                    margin: 20px 0 0 0;
                    text-align: center;
                }
                
                /* Security Notice */
                .security-notice {
                    background-color: #fff3cd;
                    border-left: 4px solid #ffc107;
                    border-radius: 8px;
                    padding: 24px;
                    margin: 40px 0;
                }
                
                .security-notice h3 {
                    color: #856404;
                    margin: 0 0 12px 0;
                    font-size: 18px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .security-notice p {
                    color: #856404;
                    font-size: 15px;
                    margin: 0;
                    line-height: 1.6;
                }
                
                /* Action Section */
                .action-section {
                    text-align: center;
                    margin: 40px 0;
                    padding: 24px;
                    background-color: #f8f9fa;
                    border-radius: 12px;
                }
                
                .action-section p {
                    color: #86868b;
                    font-size: 15px;
                    margin: 0 0 16px 0;
                }
                
                .help-text {
                    color: #86868b;
                    font-size: 15px;
                    margin: 0;
                    line-height: 1.6;
                }
                
                /* Session Details */
                .session-details {
                    border-top: 1px solid #e5e5e7;
                    padding-top: 24px;
                    margin-top: 40px;
                    text-align: center;
                }
                
                .session-details p {
                    color: #86868b;
                    font-size: 13px;
                    margin: 0;
                    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
                }
                
                /* Footer */
                .email-footer {
                    background-color: #f1f3f4;
                    padding: 24px 32px;
                    text-align: center;
                    border-top: 1px solid #e5e5e7;
                }
                
                .email-footer p {
                    color: #86868b;
                    font-size: 13px;
                    margin: 0;
                }
                
                /* Mobile Responsive */
                @media only screen and (max-width: 600px) {
                    .email-container {
                        margin: 0 !important;
                        border-radius: 0 !important;
                    }
                    
                    .email-header {
                        padding: 32px 24px !important;
                    }
                    
                    .email-header h1 {
                        font-size: 24px !important;
                    }
                    
                    .email-content {
                        padding: 32px 24px !important;
                    }
                    
                    .otp-container {
                        padding: 32px 24px !important;
                    }
                    
                    .otp-code {
                        font-size: 32px !important;
                        letter-spacing: 8px !important;
                        word-spacing: 4px !important;
                    }
                    
                    .email-footer {
                        padding: 20px 24px !important;
                    }
                    
                    .security-notice {
                        padding: 20px !important;
                    }
                    
                    .action-section {
                        padding: 20px !important;
                    }
                }
                
                /* Dark Mode Support */
                @media (prefers-color-scheme: dark) {
                    .email-container {
                        background-color: #1c1c1e !important;
                        color: #ffffff !important;
                    }
                    
                    .otp-container {
                        background: linear-gradient(135deg, #2c2c2e 0%, #3a3a3c 100%) !important;
                        border-color: #48484a !important;
                    }
                    
                    .otp-code {
                        color: #ffffff !important;
                    }
                    
                    .email-footer {
                        background-color: #f1f3f4 !important;
                        border-color: #48484a !important;
                    }
                    
                    .action-section {
                        background-color: #2c2c2e !important;
                    }
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <!-- Header -->
                <div class="email-header">
                    <h1>Verification Code</h1>
                    <p>Deimos Cipher Security</p>
                </div>

                <!-- Main Content -->
                <div class="email-content">
                    <!-- OTP Section -->
                    <div class="otp-section">
                        <p class="otp-label">Your email verification code:</p>
                        
                        <div class="otp-container">
                            <div class="otp-code">${otp}</div>
                        </div>
                        
                        <div class="expiry-info">
                            <span>Valid for 5 minutes • Expires at ${new Date(
                              Date.now() + 5 * 60 * 1000
                            ).toLocaleTimeString()}</span>
                        </div>
                    </div>

                    <!-- Security Notice -->
                    <div class="security-notice">
                        <h3>
                            Security Notice
                        </h3>
                        <p>
                            Never share this code with anyone. Use this code only to verify your email address for the contact form submission.
                        </p>
                    </div>

                    <!-- Action Section -->
                    <div class="action-section">
                        <p>Didn't request this code?</p>
                        <p class="help-text">Someone may have entered your email address in our contact form. If you didn't initiate this verification, you can safely ignore this email.</p>
                    </div>

                    <!-- Session Details -->
                    <div class="session-details">
                        <p>
                            ${new Date().toLocaleString()} • Session ${Date.now()
        .toString(36)
        .toUpperCase()}
                        </p>
                    </div>
                </div>

                <!-- Footer -->
                <div class="email-footer">
                    <p>This is an automated security message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
    `,
      text: `DEIMOS CIPHER - EMAIL VERIFICATION CODE

Your email verification code: ${otp}

Valid for 5 minutes
Expires at: ${new Date(Date.now() + 5 * 60 * 1000).toLocaleTimeString()}

SECURITY NOTICE:
Never share this code with anyone. Use this code only to verify your email address for the contact form submission.

Didn't request this code? 
Someone may have entered your email address in our contact form. If you didn't initiate this verification, you can safely ignore this email.

Session Details:
${new Date().toLocaleString()} • Session ${Date.now()
        .toString(36)
        .toUpperCase()}

© ${new Date().getFullYear()} Deimos Cipher. All rights reserved.

---
This is an automated security message. Please do not reply to this email.`,
    };

    try {
      const info = await transporter.sendMail(mailOptions);

      res.status(200).json({
        success: true,
        message: "OTP sent successfully",
      });
    } catch (emailError) {
      console.error("❌ Failed to send OTP email:", emailError);

      // Remove the stored OTP since email failed
      otpStore.delete(sanitizedEmail);

      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email",
        details: emailError.message,
      });
    }
  } catch (error) {
    console.error("❌ Unexpected error in send-otp:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      details: error.message,
    });
  }
});
// OTP verification endpoint
app.post("/api/verify-otp", (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    // Clean up email input
    const sanitizedEmail = sanitizeInput(email);

    // Check if OTP exists and is still valid
    const stored = otpStore.get(sanitizedEmail);

    if (!stored || Date.now() > stored.expiresAt) {
      otpStore.delete(sanitizedEmail);
      return res.status(400).json({
        success: false,
        message: "OTP expired or not found.",
      });
    }

    if (stored.otp !== otp) {
      return res.status(401).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    // Valid OTP - remove from store
    otpStore.delete(sanitizedEmail);
    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
    });
  }
});

// Contact form handler
app.post("/api/contact", async (req, res) => {
  try {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      "unknown";

    // Check rate limits
    if (!rateLimitIP(ip)) {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Try again later.",
      });
    }

    const { name, email, message } = req.body;
    const validation = validateInput({ name, email, message });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors,
      });
    }

    // Clean up form data
    const sanitizedData = {
      name: sanitizeInput(name),
      email: sanitizeInput(email),
      message: sanitizeInput(message),
      timestamp: new Date().toISOString(),
    };

    const transporter = createTransporter();

    // Admin Notification Email
    const adminMailOptions = {
      from: `"Deimos Cipher System" <${process.env.EMAIL_FROM}>`,
      to: process.env.EMAIL_TO,
      subject: `New Contact: ${
        sanitizedData.name
      } - ${new Date().toLocaleDateString()}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 700px; margin: 0 auto; background-color: #ffffff; color: #1a1a1a; line-height: 1.6;">
            <!-- Header -->
            <div style="background-color: #f8f9fa; padding: 32px 24px; text-align: center; border-bottom: 1px solid #e9ecef;">
                <h1 style="color: #212529; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.025em;">New Contact Submission</h1>
                <p style="color: #6c757d; margin: 8px 0 0 0; font-size: 14px; font-weight: 400;">Admin Notification</p>
            </div>

            <!-- Main Content -->
            <div style="padding: 32px 24px;">
                <!-- Quick Actions -->
                <div style="text-align: center; margin-bottom: 32px;">
                    <a href="mailto:${
                      sanitizedData.email
                    }" style="display: inline-block; background-color: #212529; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 0 8px 8px 0; font-size: 14px;">
                        Reply to Client
                    </a>
                    <a href="mailto:${
                      sanitizedData.email
                    }?subject=Re: Your inquiry - Deimos Cipher&body=Hello ${
        sanitizedData.name
      },%0D%0A%0D%0AThank you for reaching out through my website.%0D%0A%0D%0A" style="display: inline-block; background-color: #6c757d; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 0 8px 8px 0; font-size: 14px;">
                        Quick Reply
                    </a>
                </div>

                <!-- Contact Information -->
                <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                    <h2 style="color: #212529; margin: 0 0 20px 0; font-size: 18px; font-weight: 600; border-bottom: 1px solid #e9ecef; padding-bottom: 8px;">Contact Details</h2>
                    
                    <div style="display: block;">
                        <div style="margin-bottom: 16px;">
                            <div style="color: #6c757d; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Client Name</div>
                            <div style="color: #212529; font-size: 16px; font-weight: 600;">${
                              sanitizedData.name
                            }</div>
                        </div>
                        
                        <div style="margin-bottom: 16px;">
                            <div style="color: #6c757d; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Email Address</div>
                            <div style="color: #212529; font-size: 16px; font-weight: 600; word-break: break-word;">
                                <a href="mailto:${
                                  sanitizedData.email
                                }" style="color: #495057; text-decoration: underline;">${
        sanitizedData.email
      }</a>
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 16px;">
                            <div style="color: #6c757d; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Submission Time</div>
                            <div style="color: #212529; font-size: 14px; font-weight: 600;">${new Date(
                              sanitizedData.timestamp
                            ).toLocaleString("en-US", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}</div>
                        </div>
                        
                        <div style="margin-bottom: 0;">
                            <div style="color: #6c757d; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">IP Address</div>
                            <div style="color: #212529; font-size: 14px; font-weight: 600; font-family: 'SF Mono', Monaco, monospace;">${ip}</div>
                        </div>
                    </div>
                </div>

                <!-- Message Content -->
                <div style="margin-bottom: 32px;">
                    <h3 style="color: #212529; margin: 0 0 16px 0; font-size: 18px; font-weight: 600; border-bottom: 1px solid #e9ecef; padding-bottom: 8px;">Message Content</h3>
                    
                    <div style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; min-height: 100px;">
                        <div style="color: #212529; font-size: 15px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word;">${
                          sanitizedData.message
                        }</div>
                    </div>
                    
                    <!-- Message Stats -->
                    <div style="display: flex; justify-content: space-between; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e9ecef; flex-wrap: wrap;">
                        <span style="color: #6c757d; font-size: 12px; margin-bottom: 4px;">
                            Words: ${sanitizedData.message.split(" ").length}
                        </span>
                        <span style="color: #6c757d; font-size: 12px; margin-bottom: 4px;">
                            Characters: ${sanitizedData.message.length}
                        </span>
                    </div>
                </div>

                <!-- Response Guidelines -->
                <div style="background-color: #f8f9fa; border-left: 3px solid #6c757d; padding: 20px; margin-bottom: 24px;">
                    <h4 style="color: #495057; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Response Guidelines</h4>
                    <div style="color: #6c757d; font-size: 14px; line-height: 1.6;">
                        <p style="margin: 0 0 8px 0;">Target response time: Within 4-6 hours during business days</p>
                        <p style="margin: 0 0 8px 0;">Maximum response time: 24-48 hours as promised to client</p>
                        <p style="margin: 0;">Check for project scope, budget, and timeline requirements</p>
                    </div>
                </div>

                <!-- Admin Actions -->
                <div style="background-color: #212529; color: #ffffff; padding: 20px; border-radius: 8px; text-align: center;">
                    <h4 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">Required Actions</h4>
                    <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
                        <span style="background-color: rgba(255,255,255,0.1); padding: 6px 12px; border-radius: 16px; font-size: 12px; font-weight: 500; margin: 2px;">Review Message</span>
                        <span style="background-color: rgba(255,255,255,0.1); padding: 6px 12px; border-radius: 16px; font-size: 12px; font-weight: 500; margin: 2px;">Craft Response</span>
                        <span style="background-color: rgba(255,255,255,0.1); padding: 6px 12px; border-radius: 16px; font-size: 12px; font-weight: 500; margin: 2px;">Send Reply</span>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8f9fa; padding: 16px 24px; text-align: center; border-top: 1px solid #e9ecef;">
                <p style="color: #6c757d; font-size: 12px; margin: 0; line-height: 1.4;">
                    Automated notification from Deimos Cipher contact system<br>
                    Submission ID: <code style="background-color: #e9ecef; padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 10px;">${Date.now()
                      .toString(36)
                      .toUpperCase()}</code><br>
                    Generated: ${new Date().toLocaleString()}
                </p>
            </div>
        </div>

        <!-- Mobile Responsive Styles -->
        <style>
            @media only screen and (max-width: 600px) {
                .email-container {
                    width: 100% !important;
                    margin: 0 !important;
                }
                .email-content {
                    padding: 24px 16px !important;
                }
                .email-header {
                    padding: 24px 16px !important;
                }
                .quick-actions {
                    display: block !important;
                }
                .quick-actions a {
                    display: block !important;
                    margin: 8px 0 !important;
                }
                .contact-grid {
                    display: block !important;
                }
                .message-stats {
                    flex-direction: column !important;
                }
                .admin-actions {
                    flex-direction: column !important;
                }
                .email-footer {
                    padding: 12px 16px !important;
                }
            }
        </style>
    `,
      text: `NEW CONTACT FORM SUBMISSION - DEIMOS CIPHER

CONTACT DETAILS
=============================================
Name: ${sanitizedData.name}
Email: ${sanitizedData.email}
Submission Time: ${new Date(sanitizedData.timestamp).toLocaleString()}
IP Address: ${ip}

MESSAGE CONTENT
=============================================
${sanitizedData.message}

MESSAGE STATISTICS
=============================================
Word Count: ${sanitizedData.message.split(" ").length} words
Character Count: ${sanitizedData.message.length} characters

RESPONSE GUIDELINES
=============================================
Target Response: Within 4-6 hours (business days)
Maximum Response: 24-48 hours (as promised)
Review for: Project scope, budget, timeline

QUICK ACTIONS
=============================================
Reply to client: mailto:${sanitizedData.email}

Submission ID: ${Date.now().toString(36).toUpperCase()}
Generated: ${new Date().toLocaleString()}

This is an automated notification from Deimos Cipher contact system.`,
    };

    // Auto-reply Email
    const autoReplyOptions = {
      from: `"Deimos Cipher Support" <${process.env.EMAIL_FROM}>`,
      to: sanitizedData.email,
      subject: "Message received - We will respond shortly",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Message Received - Deimos Cipher</title>
            <!--[if mso]>
            <noscript>
                <xml>
                    <o:OfficeDocumentSettings>
                        <o:AllowPNG/>
                        <o:PixelsPerInch>96</o:PixelsPerInch>
                    </o:OfficeDocumentSettings>
                </xml>
            </noscript>
            <![endif]-->
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
            <div class="email-container" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; color: #1a1a1a; line-height: 1.6; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                
                <!-- Header Section -->
                <div class="email-header" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 40px 32px; text-align: center; border-bottom: 1px solid #dee2e6;">
                    <h1 style="color: #212529; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Message Received</h1>
                    <p style="color: #6c757d; margin: 8px 0 0 0; font-size: 15px; font-weight: 500;">Deimos Cipher Support</p>
                </div>

                <!-- Main Content Section -->
                <div class="email-content" style="padding: 48px 32px;">
                    
                    <!-- Personal Greeting -->
                    <div style="margin-bottom: 40px;">
                        <h2 style="color: #212529; margin: 0 0 20px 0; font-size: 22px; font-weight: 600; letter-spacing: -0.25px;">Hello ${
                          sanitizedData.name
                        },</h2>
                        <p style="color: #495057; font-size: 17px; margin: 0; line-height: 1.7;">Thank you for reaching out. I have received your message and will respond personally within 24-48 hours during business days.</p>
                    </div>

                    <!-- Status Indicator -->
                    <div class="status-indicator" style="margin-bottom: 32px; padding: 16px 20px; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; text-align: center;">
                        <span style="color: #155724; font-size: 15px; font-weight: 600;">Your message has been received and queued for response</span>
                    </div>

                    <!-- Response Timeline Card -->
                    <div class="response-card" style="background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 12px; padding: 32px; margin: 32px 0;">
                        <h3 style="color: #212529; margin: 0 0 24px 0; font-size: 18px; font-weight: 600;">
                            Response Timeline
                        </h3>
                        
                        <div class="timeline-grid" style="display: block;">
                            <!-- Business Hours -->
                            <div class="timeline-item" style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e9ecef;">
                                <div style="display: flex; align-items: center; margin-bottom: 6px;">
                                    <span style="color: #212529; font-weight: 600; font-size: 15px;">Business Hours</span>
                                </div>
                                <p style="color: #6c757d; font-size: 14px; margin: 0; line-height: 1.5;">Monday - Friday, 9:00 AM - 6:00 PM (UTC +5:30)</p>
                            </div>
                            
                            <!-- Expected Response -->
                            <div class="timeline-item" style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e9ecef;">
                                <div style="display: flex; align-items: center; margin-bottom: 6px;">
                                    <span style="color: #212529; font-weight: 600; font-size: 15px;">Expected Response</span>
                                </div>
                                <p style="color: #6c757d; font-size: 14px; margin: 0; line-height: 1.5;">Within 24-48 hours during business days</p>
                            </div>
                            
                            <!-- Message Reference -->
                            <div class="timeline-item" style="margin-bottom: 0;">
                                <div style="display: flex; align-items: center; margin-bottom: 6px;">
                                    <span style="color: #212529; font-weight: 600; font-size: 15px;">Reference ID</span>
                                </div>
                                <div>
                                    <code style="background-color: #e9ecef; padding: 8px 12px; border-radius: 6px; font-size: 13px; font-family: 'SF Mono', Consolas, monospace; color: #495057; font-weight: 600; display: inline-block;">${Date.now()
                                      .toString(36)
                                      .toUpperCase()}</code>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Important Notice -->
                    <div class="notice-section" style="position: relative; padding: 24px; margin: 32px 0; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px;">
                        <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background-color: #ffc107; border-radius: 2px 0 0 2px;"></div>
                        <div class="notice-content" style="display: flex; align-items: flex-start;">
                            <div>
                                <p style="color: #856404; font-size: 15px; margin: 0; line-height: 1.6; font-weight: 600;">Important Notice</p>
                                <p style="color: #856404; font-size: 14px; margin: 8px 0 0 0; line-height: 1.5;">This is an automated confirmation. Please do not reply to this email. For additional inquiries, submit a new message through the website.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Next Steps -->
                    <div class="next-steps" style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin: 32px 0;">
                        <h4 style="color: #212529; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">What happens next?</h4>
                        <div style="color: #6c757d; font-size: 14px; line-height: 1.6;">
                            <div style="display: flex; align-items: flex-start; margin-bottom: 10px;">
                                <span style="color: #007bff; font-weight: bold; margin-right: 10px; margin-top: 2px;">•</span>
                                <span>I'll review your message and requirements carefully</span>
                            </div>
                            <div style="display: flex; align-items: flex-start; margin-bottom: 10px;">
                                <span style="color: #007bff; font-weight: bold; margin-right: 10px; margin-top: 2px;">•</span>
                                <span>You'll receive a detailed personal response within 24-48 hours</span>
                            </div>
                            <div style="display: flex; align-items: flex-start;">
                                <span style="color: #007bff; font-weight: bold; margin-right: 10px; margin-top: 2px;">•</span>
                                <span>We can then discuss your inquiry and next steps in detail</span>
                            </div>
                        </div>
                    </div>

                    <!-- Closing Section -->
                    <div style="border-top: 1px solid #e9ecef; padding-top: 40px; margin-top: 48px;">
                        <p style="color: #495057; font-size: 17px; margin: 0 0 32px 0; line-height: 1.6;">I look forward to discussing your inquiry and exploring how I can help you.</p>
                        
                        <div style="color: #212529; font-size: 16px;">
                            <p style="margin: 0; font-weight: 600; color: #495057;">Best regards,</p>
                            <p style="margin: 8px 0 0 0; color: #212529; font-weight: 700; font-size: 18px;">Deimos Cipher</p>
                            <p style="margin: 4px 0 0 0; color: #6c757d; font-size: 14px; font-weight: 500;">Developer</p>
                        </div>
                    </div>
                </div>

                <!-- Footer Section -->
                <div class="email-footer" style="background-color: #f8f9fa; padding: 24px 32px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="color: #adb5bd; font-size: 12px; margin: 0;">
                        This email was sent from an automated system. Please do not reply directly.
                    </p>
                </div>
            </div>

            <!-- CSS Styles -->
            <style>
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
                
                /* Tablet and smaller desktop screens */
                @media only screen and (max-width: 768px) {
                    .email-container {
                        margin: 0 10px !important;
                    }
                    .email-content {
                        padding: 40px 24px !important;
                    }
                    .email-header {
                        padding: 36px 24px !important;
                    }
                    .email-footer {
                        padding: 20px 24px !important;
                    }
                }
                
                /* Mobile landscape and portrait */
                @media only screen and (max-width: 600px) {
                    .email-container {
                        width: 100% !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                    }
                    .email-content {
                        padding: 32px 20px !important;
                    }
                    .email-header {
                        padding: 32px 20px !important;
                    }
                    .email-footer {
                        padding: 20px 20px !important;
                    }
                    h1 {
                        font-size: 24px !important;
                    }
                    h2 {
                        font-size: 20px !important;
                    }
                    h3 {
                        font-size: 16px !important;
                    }
                    h4 {
                        font-size: 15px !important;
                    }
                    
                    /* Timeline responsive adjustments */
                    .response-card {
                        padding: 24px 20px !important;
                    }
                    .timeline-item {
                        margin-bottom: 16px !important;
                        padding-bottom: 16px !important;
                    }
                    .timeline-item:last-child {
                        margin-bottom: 0 !important;
                    }
                    
                    /* Status indicator responsive */
                    .status-indicator {
                        text-align: center !important;
                    }
                    
                    /* Notice section responsive */
                    .notice-content {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                    }
                    .notice-section {
                        padding: 20px 20px !important;
                    }
                }
                
                /* Small mobile screens */
                @media only screen and (max-width: 480px) {
                    .email-content {
                        padding: 24px 16px !important;
                    }
                    .email-header {
                        padding: 24px 16px !important;
                    }
                    .email-footer {
                        padding: 16px 16px !important;
                    }
                    
                    /* Further reduce font sizes for very small screens */
                    h1 {
                        font-size: 22px !important;
                    }
                    h2 {
                        font-size: 18px !important;
                    }
                    
                    /* Adjust card padding for small screens */
                    .response-card {
                        padding: 20px 16px !important;
                    }
                    .notice-section {
                        padding: 16px 16px !important;
                    }
                    .next-steps {
                        padding: 16px 16px !important;
                    }
                    
                    /* Timeline adjustments for small screens */
                    .timeline-item {
                        margin-bottom: 14px !important;
                        padding-bottom: 14px !important;
                    }
                    
                    /* Adjust numbered list spacing */
                    .next-steps div[style*="display: flex"] {
                        margin-bottom: 8px !important;
                    }
                }
                
                /* Very small screens (iPhone SE, etc.) */
                @media only screen and (max-width: 375px) {
                    .email-content {
                        padding: 20px 12px !important;
                    }
                    .email-header {
                        padding: 20px 12px !important;
                    }
                    .email-footer {
                        padding: 12px 12px !important;
                    }
                    h1 {
                        font-size: 20px !important;
                    }
                    h2 {
                        font-size: 16px !important;
                    }
                    
                    /* Further reduce response card padding */
                    .response-card {
                        padding: 16px 12px !important;
                    }
                    .notice-section {
                        padding: 12px 12px !important;
                    }
                    .next-steps {
                        padding: 12px 12px !important;
                    }
                    
                    .timeline-item {
                        margin-bottom: 12px !important;
                        padding-bottom: 12px !important;
                    }
                }
                
                /* Dark mode support */
                @media (prefers-color-scheme: dark) {
                    .email-container {
                        background-color: #1a1a1a !important;
                        color: #ffffff !important;
                    }
                    .email-header {
                        background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%) !important;
                    }
                    .email-footer {
                        background-color: #2d2d2d !important;
                    }
                    .response-card {
                        background-color: #2d2d2d !important;
                        border-color: #404040 !important;
                    }
                    .next-steps {
                        background-color: #2d2d2d !important;
                    }
                }
            </style>
        </body>
        </html>
    `,
      text: `Hello ${sanitizedData.name},

Thank you for reaching out. I have received your message and will respond personally within 24-48 hours during business days.

Status: Your message has been received and queued for response

Response Timeline:
Business Hours: Monday - Friday, 9:00 AM - 6:00 PM (UTC +5:30)
Expected Response: Within 24-48 hours during business days
Reference ID: ${Date.now().toString(36).toUpperCase()}

Important Notice:
This is an automated confirmation. Please do not reply to this email. For additional inquiries, submit a new message through the website.

What happens next:
• I'll review your message and requirements carefully
• You'll receive a detailed personal response within 24-48 hours
• We can then discuss your inquiry and next steps in detail

I look forward to discussing your inquiry and exploring how I can help you.

Best regards,
Deimos Cipher
Developer

This email was sent from an automated system. Please do not reply directly.`,
    };

    // Send both emails
    await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(autoReplyOptions),
    ]);

    res.status(200).json({
      success: true,
      message: "Message sent successfully!",
    });
  } catch (error) {
    console.error("❌ Error sending contact email:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message.",
    });
  }
});

// Text encryption endpoint
app.post("/encrypt-text", (req, res) => {
  try {
    const { text, password } = req.body;

    if (!text || !password) {
      throw new Error("Text and password are required");
    }

    const encryptedText = encryptText(text, password);
    res.json({
      success: true,
      encryptedText,
    });
  } catch (error) {
    console.error("Text encryption error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Text decryption endpoint
app.post("/decrypt-text", (req, res) => {
  try {
    const { ciphertext, password } = req.body;

    if (!ciphertext || !password) {
      throw new Error("Ciphertext and password are required");
    }

    const decryptedText = decryptText(ciphertext, password);
    res.json({
      success: true,
      decryptedText,
    });
  } catch (error) {
    console.error("Text decryption error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Image encryption
app.post("/encrypt-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file || !req.body.password) {
      throw new Error("Image file and password are required");
    }

    const encryptedBuffer = await encryptImage(
      req.file.buffer,
      req.body.password
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=encrypted-image.txt`
    );
    res.setHeader("Content-Type", "text/plain");
    res.send(encryptedBuffer);
  } catch (error) {
    console.error("Image encryption error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Image decryption
app.post("/decrypt-image", upload.single("textfile"), async (req, res) => {
  try {
    if (!req.file || !req.body.password) {
      throw new Error("Encrypted file and password are required");
    }

    const encryptedBuffer = Buffer.from(req.file.buffer.toString(), "hex");
    const decryptedBuffer = await decryptImage(
      encryptedBuffer,
      req.body.password
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=restored-image.png`
    );
    res.setHeader("Content-Type", "image/png");
    res.send(decryptedBuffer);
  } catch (error) {
    console.error("Image decryption error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Video encryption
app.post("/encrypt-video", upload.single("video"), async (req, res) => {
  try {
    if (!req.file || !req.body.password) {
      throw new Error("Video file and password are required");
    }

    const encryptedBuffer = await encryptVideo(
      req.file.buffer,
      req.body.password
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=encrypted-video.txt`
    );
    res.setHeader("Content-Type", "text/plain");
    res.send(encryptedBuffer);
  } catch (error) {
    console.error("Video encryption error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Video decryption
app.post("/decrypt-video", upload.single("textfile"), async (req, res) => {
  try {
    if (!req.file || !req.body.password) {
      throw new Error("Encrypted file and password are required");
    }

    const encryptedBuffer = Buffer.from(req.file.buffer.toString(), "hex");
    const decryptedBuffer = await decryptVideo(
      encryptedBuffer,
      req.body.password
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=restored-video.mp4`
    );
    res.setHeader("Content-Type", "video/mp4");
    res.send(decryptedBuffer);
  } catch (error) {
    console.error("Video decryption error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Basic health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Handle 404s
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// Clean up expired OTPs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of otpStore.entries()) {
    if (now > data.expiresAt) {
      otpStore.delete(email);
    }
  }
}, 5 * 60 * 1000);

// Clean up expired rate limit entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}, 60 * 60 * 1000);

// Check for required environment variables
function validateEnvironment() {
  const required = ["GMAIL_USER", "GMAIL_APP_PASSWORD"];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error("\nPlease check your .env.local file");
    return false;
  }

  return true;
}

const PORT = process.env.PORT || 5000;

// Make sure we have all required env vars before starting
if (!validateEnvironment()) {
  console.error(
    "❌ Server startup failed due to missing environment variables"
  );
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown handlers
process.on("SIGINT", () => {
  console.log("\nShutting down...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\nShutting down...");
  process.exit(0);
});
