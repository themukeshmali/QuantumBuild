// ============================================================
// QUANTUM BUILD — Email Utility (Nodemailer)
// Reads EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM
// ============================================================

import nodemailer from 'nodemailer';

const sendEmail = async ({ to, subject, html, text }) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_PORT === '465',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: `"Quantum Build" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]+>/g, ''),
    };

    // In development, skip real SMTP if credentials look like a plain password
    if (process.env.NODE_ENV === 'development') {
        const pass = process.env.EMAIL_PASS || '';
        // A Gmail App Password is always 16 chars (no spaces version) or has spaces "xxxx xxxx xxxx xxxx"
        // If it looks like a plain password (too short or no spaces), mock immediately
        const looksLikePlain = pass.replace(/\s/g, '').length < 16;
        if (looksLikePlain) {
            console.log('\n=== DEVELOPMENT MODE: EMAIL MOCKED (no valid App Password set) ===');
            console.log(`To: ${to}\nSubject: ${subject}\nText:\n${mailOptions.text}`);
            console.log('===================================================================\n');
            return { messageId: 'mock-id-dev' };
        }
    }

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`Email sending failed: ${error.message}`);
        if (process.env.NODE_ENV === 'development') {
            console.log('\n=== DEVELOPMENT MODE: EMAIL MOCKED ===');
            console.log(`To: ${to}\nSubject: ${subject}\nText:\n${mailOptions.text}`);
            console.log('======================================\n');
            return { messageId: 'mock-id-dev' };
        }
        throw error;
    }
};

// ── Email Templates ─────────────────────────────────────────

export const sendPasswordResetEmail = async (email, name, resetUrl) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#06060b;font-family:Inter,sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#0f0f1a;border:1px solid #1e1e2e;border-radius:16px;overflow:hidden;">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#d4003a,#e02020);padding:32px 40px;text-align:center;">
          <div style="font-size:2rem;font-weight:900;letter-spacing:3px;color:#fff;font-family:Georgia,serif;">Q</div>
          <div style="color:#fff;font-size:1.1rem;font-weight:700;letter-spacing:2px;margin-top:8px;text-transform:uppercase;">Quantum Build</div>
        </div>
        <!-- Body -->
        <div style="padding:40px;">
          <h2 style="color:#fff;font-size:1.3rem;margin:0 0 12px;">Hi ${name},</h2>
          <p style="color:#8a8a9a;font-size:0.95rem;line-height:1.6;margin:0 0 24px;">
            We received a request to reset your Quantum Build password. Click the button below to create a new password. This link expires in <strong style="color:#fff">15 minutes</strong>.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#d4003a,#e02020);color:#fff;font-size:0.9rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:16px 40px;border-radius:8px;text-decoration:none;">
              Reset Password
            </a>
          </div>
          <p style="color:#55556a;font-size:0.8rem;line-height:1.6;margin:0;">
            If you didn't request this, you can safely ignore this email — your password will not change.<br><br>
            Or copy this link: <a href="${resetUrl}" style="color:#d4003a;word-break:break-all;">${resetUrl}</a>
          </p>
        </div>
        <!-- Footer -->
        <div style="padding:20px 40px;border-top:1px solid #1e1e2e;text-align:center;">
          <p style="color:#55556a;font-size:0.72rem;margin:0;">© 2026 Quantum Build · Power Beyond Limits</p>
        </div>
      </div>
    </body>
    </html>
    `;

    return sendEmail({ to: email, subject: 'Reset Your Quantum Build Password', html });
};

export const sendOtpEmail = async (email, name, otp) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#06060b;font-family:Inter,sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#0f0f1a;border:1px solid #1e1e2e;border-radius:16px;overflow:hidden;">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#d4003a,#e02020);padding:32px 40px;text-align:center;">
          <div style="font-size:2rem;font-weight:900;letter-spacing:3px;color:#fff;font-family:Georgia,serif;">Q</div>
          <div style="color:#fff;font-size:1.1rem;font-weight:700;letter-spacing:2px;margin-top:8px;text-transform:uppercase;">Quantum Build</div>
        </div>
        <!-- Body -->
        <div style="padding:40px;">
          <h2 style="color:#fff;font-size:1.3rem;margin:0 0 12px;">Hi ${name},</h2>
          <p style="color:#8a8a9a;font-size:0.95rem;line-height:1.6;margin:0 0 28px;">
            Use the OTP below to reset your Quantum Build password. This code expires in <strong style="color:#fff">10 minutes</strong>.
          </p>
          <!-- OTP Box -->
          <div style="text-align:center;margin:0 0 28px;">
            <div style="display:inline-block;background:#13131f;border:2px solid #d4003a;border-radius:12px;padding:20px 48px;">
              <div style="font-size:2.4rem;font-weight:900;letter-spacing:12px;color:#fff;font-family:monospace;">${otp}</div>
            </div>
          </div>
          <p style="color:#55556a;font-size:0.8rem;line-height:1.6;margin:0;">
            If you didn't request this, you can safely ignore this email — your password will not change.
          </p>
        </div>
        <!-- Footer -->
        <div style="padding:20px 40px;border-top:1px solid #1e1e2e;text-align:center;">
          <p style="color:#55556a;font-size:0.72rem;margin:0;">© 2026 Quantum Build · Power Beyond Limits</p>
        </div>
      </div>
    </body>
    </html>
    `;

    return sendEmail({ to: email, subject: 'Your Quantum Build OTP Code', html });
};

export const sendOrderConfirmationEmail = async (email, name, order) => {
    const itemsHtml = (order.orderItems || []).map(item => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #1e1e2e;color:#8a8a9a;font-size:0.85rem;">${item.name} × ${item.qty}</td>
          <td style="padding:10px 0;border-bottom:1px solid #1e1e2e;color:#fff;font-size:0.85rem;text-align:right;">₹${(item.price * item.qty).toLocaleString('en-IN')}</td>
        </tr>
    `).join('');

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#06060b;font-family:Inter,sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#0f0f1a;border:1px solid #1e1e2e;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#d4003a,#e02020);padding:32px 40px;text-align:center;">
          <div style="font-size:2rem;font-weight:900;color:#fff;">🎉</div>
          <div style="color:#fff;font-size:1.2rem;font-weight:700;letter-spacing:1px;margin-top:8px;">Order Confirmed!</div>
        </div>
        <div style="padding:40px;">
          <h2 style="color:#fff;font-size:1.1rem;margin:0 0 8px;">Hi ${name},</h2>
          <p style="color:#8a8a9a;font-size:0.9rem;margin:0 0 24px;">Thanks for your order! Here's a summary:</p>
          <div style="background:#13131f;border-radius:10px;padding:20px;margin-bottom:24px;">
            <div style="font-size:0.7rem;letter-spacing:2px;text-transform:uppercase;color:#55556a;margin-bottom:12px;">Order ID</div>
            <div style="font-family:monospace;color:#d4003a;font-size:0.95rem;">${order._id}</div>
          </div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            ${itemsHtml}
            <tr>
              <td style="padding:10px 0;color:#55556a;font-size:0.8rem;">Shipping</td>
              <td style="padding:10px 0;color:#8a8a9a;font-size:0.8rem;text-align:right;">${order.shippingPrice === 0 ? 'FREE' : '₹' + order.shippingPrice}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#55556a;font-size:0.8rem;">Tax (18% GST)</td>
              <td style="padding:10px 0;color:#8a8a9a;font-size:0.8rem;text-align:right;">₹${(order.taxPrice || 0).toLocaleString('en-IN')}</td>
            </tr>
            <tr style="border-top:1px solid #1e1e2e;">
              <td style="padding:14px 0 0;color:#fff;font-weight:700;font-size:1rem;">Total</td>
              <td style="padding:14px 0 0;color:#d4003a;font-weight:700;font-size:1rem;text-align:right;">₹${(order.totalPrice || 0).toLocaleString('en-IN')}</td>
            </tr>
          </table>
          <p style="color:#8a8a9a;font-size:0.85rem;margin:0 0 20px;">
            Payment: <strong style="color:#fff">${order.paymentMethod}</strong><br>
            Delivering to: <strong style="color:#fff">${order.shippingAddress?.address}, ${order.shippingAddress?.city}</strong>
          </p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/frontend/order-detail.html?id=${order._id}" 
             style="display:inline-block;background:linear-gradient(135deg,#d4003a,#e02020);color:#fff;font-size:0.82rem;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:14px 32px;border-radius:8px;text-decoration:none;">
            Track My Order →
          </a>
        </div>
        <div style="padding:20px 40px;border-top:1px solid #1e1e2e;text-align:center;">
          <p style="color:#55556a;font-size:0.72rem;margin:0;">© 2026 Quantum Build · Power Beyond Limits</p>
        </div>
      </div>
    </body>
    </html>
    `;

    return sendEmail({ to: email, subject: `Order Confirmed — #${String(order._id).slice(-8).toUpperCase()}`, html });
};

export default sendEmail;
