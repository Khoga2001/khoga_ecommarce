"""
Decoupled email notifications — logs by default, sends when SMTP is configured.

Set these env vars to enable real emails:
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM (default: info@khogaeg.com)
"""
import logging
import os
import smtplib
from email.message import EmailMessage
from typing import Any, Dict

logger = logging.getLogger("khoga.notifications")


def _smtp_configured() -> bool:
    return all(os.environ.get(k) for k in ("SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD"))


def send_email(to: str, subject: str, body: str) -> bool:
    """Send an email or log a preview when SMTP is not configured."""
    if not _smtp_configured():
        logger.info("[email:disabled] To=%s | Subject=%s\n%s", to, subject, body)
        return False

    msg = EmailMessage()
    msg["From"] = os.environ.get("SMTP_FROM", "info@khogaeg.com")
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)

    port = int(os.environ.get("SMTP_PORT", "587"))
    with smtplib.SMTP(os.environ["SMTP_HOST"], port) as server:
        if os.environ.get("SMTP_TLS", "true").lower() != "false":
            server.starttls()
        server.login(os.environ["SMTP_USER"], os.environ["SMTP_PASSWORD"])
        server.send_message(msg)

    logger.info("[email:sent] To=%s | Subject=%s", to, subject)
    return True


def send_order_confirmation(order: Dict[str, Any]) -> bool:
    """Notify customer that their order was placed."""
    items_lines = "\n".join(
        f"  - {item.get('product_title')} x{item.get('quantity')} = {item.get('subtotal', 0):.2f} EGP"
        for item in order.get("items", [])
    )
    body = (
        f"Hello {order.get('user_name', 'Customer')},\n\n"
        f"Thank you for your order at Khoga Coffee!\n\n"
        f"Order #: {order.get('order_number')}\n"
        f"Payment: {order.get('payment_method', 'cod').upper()}\n"
        f"Total: {order.get('total', 0):.2f} EGP\n\n"
        f"Items:\n{items_lines or '  (none)'}\n\n"
        f"We will contact you to confirm delivery.\n\n"
        f"— Khoga Coffee\ninfo@khogaeg.com"
    )
    return send_email(
        to=order.get("user_email", ""),
        subject=f"Order Confirmation — {order.get('order_number')}",
        body=body,
    )
