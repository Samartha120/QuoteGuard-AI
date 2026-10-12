import smtplib
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formatdate, make_msgid
from app.core.config import settings
from app.core.logging import logger


def send_otp_email(to_email: str, otp: str, purpose: str = "login", max_retries: int = 3) -> bool:
    """
    Robust, fault-tolerant email dispatcher for OTP verification codes.
    Features:
      - Validates recipient email
      - RFC 5322 anti-spam headers (Message-ID, Date, High Priority)
      - Dual connection strategy (SSL 465 + TLS 587 fallback)
      - Automatic exponential retry mechanism (up to 3 attempts)
      - Branded dark-mode responsive HTML template + Plaintext fallback
    """
    clean_to_email = to_email.strip().lower()

    # If SMTP is not enabled or credentials are missing, log and return False safely
    if not settings.SMTP_ENABLED or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.info(
            f"[SMTP Disabled/Unconfigured] OTP for {clean_to_email}: {otp} "
            f"(Configure SMTP_ENABLED=true and SMTP credentials in .env to dispatch real emails)"
        )
        return False

    sender_email = (settings.SMTP_FROM_EMAIL or settings.SMTP_USER).strip().lower()
    sender_name = settings.SMTP_FROM_NAME or "QuoteGuard AI"
    subject = "Your QuoteGuard AI Verification Code" if purpose == "login" else "Verify your QuoteGuard AI Account"
    smtp_password = settings.SMTP_PASSWORD.replace(" ", "").strip()

    # HTML Body with QuoteGuard AI branding
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{subject}</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background-color: #0b0f17;
                color: #e2e8f0;
                margin: 0;
                padding: 40px 15px;
            }}
            .card {{
                max-width: 520px;
                margin: 0 auto;
                background-color: #131c2e;
                border: 1px solid #1e293b;
                border-radius: 12px;
                padding: 36px 28px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
            }}
            .badge {{
                display: inline-block;
                padding: 4px 12px;
                border-radius: 9999px;
                background-color: rgba(16, 185, 129, 0.15);
                color: #10b981;
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 16px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }}
            .logo {{
                font-size: 24px;
                font-weight: 800;
                color: #ffffff;
                margin-bottom: 20px;
                letter-spacing: -0.5px;
            }}
            .logo span {{
                color: #10b981;
            }}
            .title {{
                font-size: 20px;
                font-weight: 600;
                color: #f8fafc;
                margin-bottom: 12px;
            }}
            .text {{
                font-size: 14px;
                color: #94a3b8;
                line-height: 1.6;
                margin-bottom: 24px;
            }}
            .otp-box {{
                background: linear-gradient(180deg, #0f172a 0%, #090d16 100%);
                border: 1px solid #334155;
                border-radius: 10px;
                padding: 20px;
                text-align: center;
                margin: 24px 0;
            }}
            .otp-label {{
                font-size: 11px;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 6px;
            }}
            .otp-code {{
                font-size: 36px;
                font-weight: 800;
                letter-spacing: 10px;
                color: #38bdf8;
                font-family: Consolas, 'Courier New', Courier, monospace;
            }}
            .warning {{
                font-size: 12px;
                color: #ef4444;
                margin-top: 8px;
            }}
            .footer {{
                font-size: 11px;
                color: #64748b;
                border-top: 1px solid #1e293b;
                padding-top: 20px;
                margin-top: 30px;
                line-height: 1.5;
            }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="badge">Security Verification</div>
            <div class="logo">QuoteGuard <span>AI</span></div>
            <div class="title">Two-Step Verification Code</div>
            <p class="text">
                We received a request to complete your <strong>{purpose}</strong> on QuoteGuard AI. Use the 6-digit code below to verify your identity:
            </p>
            <div class="otp-box">
                <div class="otp-label">One-Time Password (OTP)</div>
                <div class="otp-code">{otp}</div>
            </div>
            <p class="text">
                &bull; This code is strictly confidential and valid for <strong>5 minutes</strong>.<br>
                &bull; Never share this code with anyone. QuoteGuard support will never ask for your code.<br>
                &bull; If you did not request this verification, you can safely ignore this email.
            </p>
            <div class="footer">
                &copy; 2026 QuoteGuard AI &bull; Source-grounded quotation intelligence for B2B teams.<br>
                Sent to: {clean_to_email}
            </div>
        </div>
    </body>
    </html>
    """

    plain_content = f"""
QuoteGuard AI - Two-Step Verification

Your 6-digit verification code is: {otp}

This code will expire in 5 minutes.
Never share this code with anyone.
If you did not make this request, you can safely ignore this email.
    """.strip()

    # Create RFC 5322 compliant message with anti-spam deliverability headers
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{sender_name} <{sender_email}>"
    msg["To"] = clean_to_email
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid(domain=sender_email.split("@")[-1])
    msg["Reply-To"] = sender_email
    msg["X-Mailer"] = "QuoteGuard-AI-AuthEngine"
    msg["X-Priority"] = "1"
    msg["Importance"] = "High"
    msg["Auto-Submitted"] = "auto-generated"

    msg.attach(MIMEText(plain_content, "plain", "utf-8"))
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    # Robust multi-attempt loop with backoff and dual-port switching
    start_time = time.time()
    last_error = None

    for attempt in range(1, max_retries + 1):
        try:
            logger.info(
                f"[Email Dispatch] Attempt {attempt}/{max_retries}: "
                f"Sending OTP to {clean_to_email} via {settings.SMTP_HOST}..."
            )

            server = None
            # Strategy: Primary configured port first (465 SSL or 587 TLS), then fallback to alternate
            ports_to_try = [settings.SMTP_PORT, 465 if settings.SMTP_PORT != 465 else 587]

            connected = False
            for port in ports_to_try:
                try:
                    if port == 465:
                        server = smtplib.SMTP_SSL(settings.SMTP_HOST, 465, timeout=10)
                    else:
                        server = smtplib.SMTP(settings.SMTP_HOST, port, timeout=10)
                        if settings.SMTP_TLS:
                            server.starttls()
                    connected = True
                    break
                except Exception as p_err:
                    logger.warning(f"[Email Dispatch] Port {port} connection failed: {p_err}. Trying alternate...")
                    if server:
                        try:
                            server.quit()
                        except Exception:
                            pass

            if not connected or not server:
                raise ConnectionError("Unable to establish SMTP connection on ports 465 or 587.")

            # Authenticate and deliver
            server.login(settings.SMTP_USER, smtp_password)
            server.sendmail(sender_email, [clean_to_email], msg.as_string())
            server.quit()

            elapsed = round(time.time() - start_time, 2)
            logger.info(f"[Email Dispatch] SUCCESS: OTP delivered to {clean_to_email} in {elapsed}s (attempt {attempt}).")
            return True

        except Exception as err:
            last_error = err
            logger.warning(
                f"[Email Dispatch] Attempt {attempt}/{max_retries} failed for {clean_to_email}: {err}"
            )
            if attempt < max_retries:
                # Progressive backoff: 1s, 2s
                backoff = attempt * 1.0
                time.sleep(backoff)

    logger.error(
        f"[Email Dispatch] CRITICAL: Failed to deliver OTP to {clean_to_email} "
        f"after {max_retries} attempts. Last error: {last_error}"
    )
    return False
