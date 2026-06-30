"""
NEXUS Email Service
-------------------
Sends notification emails via Gmail SMTP using App Passwords.
This is completely free — no third-party email service needed.

ENV vars required (add to .env):
  GMAIL_ADDRESS      = your-email@gmail.com
  GMAIL_APP_PASSWORD = your-16-char-app-password

To generate an App Password:
  1. Enable 2FA on your Google Account
  2. Go to https://myaccount.google.com/apppasswords
  3. Generate one for "Mail" → "Other (NEXUS)"
"""

import os
import ssl
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

logger = logging.getLogger(__name__)

GMAIL_ADDRESS = os.getenv("GMAIL_ADDRESS", "")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")

# Check if credentials are placeholder values
_is_placeholder = (
    not GMAIL_ADDRESS
    or not GMAIL_APP_PASSWORD
    or GMAIL_APP_PASSWORD in ("your-gmail-app-password", "your_app_password")
)

MOCK_EMAIL = os.getenv("MOCK_EMAIL", "true" if _is_placeholder else "false").lower() in ("true", "1", "yes")

if MOCK_EMAIL:
    logger.info("EmailService: Running in MOCK mode (no real emails will be sent).")


def send_email(
    to_address: str,
    subject: str,
    html_body: str,
    plain_body: Optional[str] = None,
) -> dict:
    """
    Send an email via Gmail SMTP.
    Returns {"sent": True/False, "reason": "..."}.
    """
    if MOCK_EMAIL:
        logger.info(
            f"\n===================================================="
            f"\n📧 MOCK EMAIL SENT (Zero Cost)"
            f"\nTo: {to_address}"
            f"\nSubject: {subject}"
            f"\nBody (plain): {plain_body or '(HTML only)'}"
            f"\n====================================================\n"
        )
        return {"sent": True, "reason": "mock_send_success"}

    if not GMAIL_ADDRESS or not GMAIL_APP_PASSWORD:
        return {"sent": False, "reason": "Gmail credentials not configured in .env"}

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"NEXUS <{GMAIL_ADDRESS}>"
        msg["To"] = to_address
        msg["Subject"] = subject

        if plain_body:
            msg.attach(MIMEText(plain_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        context = ssl.create_default_context()
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_ADDRESS, to_address, msg.as_string())

        logger.info(f"EmailService: Email sent to {to_address} — subject: {subject}")
        return {"sent": True, "reason": "ok"}

    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"EmailService: SMTP auth failed — {e}")
        return {"sent": False, "reason": "Gmail authentication failed. Check App Password."}
    except Exception as e:
        logger.error(f"EmailService: Send failed — {e}")
        return {"sent": False, "reason": str(e)}


def send_test_alert_email(to_address: str) -> dict:
    """Send a test alert email with NEXUS branding."""
    subject = "🔔 NEXUS Test Alert — Your Channels Are Active"
    html_body = """
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; background: #0a0a0a; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06);">
      <div style="height: 3px; background: linear-gradient(to right, #4F9EFF, #8B5CF6, #10B981);"></div>
      <div style="padding: 32px;">
        <div style="font-size: 24px; margin-bottom: 8px;">🔔</div>
        <h1 style="color: #ffffff; font-size: 18px; margin: 0 0 8px 0;">NEXUS Alert System — Active</h1>
        <p style="color: rgba(255,255,255,0.5); font-size: 13px; margin: 0 0 24px 0; line-height: 1.5;">
          This is a test notification from your NEXUS email channel. Your autonomous agents are monitoring your goals and will alert you here when interventions are needed.
        </p>
        <div style="background: rgba(79,158,255,0.08); border: 1px solid rgba(79,158,255,0.15); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <p style="color: #4F9EFF; font-size: 12px; font-weight: 600; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 1px;">Status</p>
          <p style="color: #ffffff; font-size: 14px; margin: 0;">✅ Email channel is configured and working</p>
        </div>
        <p style="color: rgba(255,255,255,0.3); font-size: 11px; margin: 0; text-align: center;">
          Sent by NEXUS Autonomous Goal Engine
        </p>
      </div>
    </div>
    """
    plain_body = "NEXUS Test Alert — Your email notification channel is active and working."
    return send_email(to_address, subject, html_body, plain_body)
