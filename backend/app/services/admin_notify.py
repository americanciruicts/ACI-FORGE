"""
Admin notification service.
Sends email notifications to Preet and Kanav (super admins only) for:
- New user creation (includes username + password)
- User logins
"""

import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional
from app.services.email import email_service
from app.core.config import settings

logger = logging.getLogger(__name__)

# Admin notification recipients loaded from environment variable
# Falls back to default values if ADMIN_NOTIFY_EMAILS env var is not set
ADMIN_NOTIFY_EMAILS = settings.admin_notify_emails_list


class AdminNotifyService:
    """Sends admin-only notifications to Preet & Kanav."""

    @staticmethod
    def notify_new_user_created(
        new_user_name: str,
        username: str,
        password: str,
        email: str,
        assigned_tools: list,
        synced_apps: Dict[str, str],
        created_by: str,
    ):
        """
        Notify Preet & Kanav when a new user is created.
        Includes username and password so they have the credentials.
        """
        try:
            now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

            # Build tools list
            tools_text = ", ".join(assigned_tools) if assigned_tools else "None"
            tools_html = ""
            for tool in assigned_tools:
                tools_html += f'<span style="background:#dbeafe;padding:2px 8px;border-radius:4px;margin:2px;display:inline-block;font-size:13px;">{tool}</span> '

            # Build sync results
            sync_lines = []
            sync_html = ""
            for app_name, result in synced_apps.items():
                icon = "&#10004;" if result == "created" else "&#8212;" if result == "exists" else "&#10008;"
                color = "#16a34a" if result == "created" else "#ca8a04" if result == "exists" else "#dc2626"
                sync_lines.append(f"  {app_name.upper()}: {result}")
                sync_html += f'<p style="margin:2px 0;"><span style="color:{color};font-weight:bold;">{icon}</span> <strong>{app_name.upper()}</strong>: {result}</p>'

            subject = f"ACI FORGE - New User Created: {username}"

            html_body = f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <h1 style="color: #2563eb; margin-bottom: 5px;">ACI FORGE</h1>
                            <p style="color: #6b7280; margin-top: 0;">Admin Notification</p>
                        </div>

                        <div style="background: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
                            <h2 style="color: #1e40af; margin-top: 0;">New User Created</h2>
                            <p>A new user account has been created on ACI FORGE.</p>

                            <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
                                <p style="margin: 5px 0;"><strong>Full Name:</strong> {new_user_name}</p>
                                <p style="margin: 5px 0;"><strong>Username:</strong> <code style="background:#f1f5f9;padding:2px 6px;border-radius:3px;">{username}</code></p>
                                <p style="margin: 5px 0;"><strong>Password:</strong> <code style="background:#fef3c7;padding:2px 6px;border-radius:3px;">{password}</code></p>
                                <p style="margin: 5px 0;"><strong>Email:</strong> {email}</p>
                                <p style="margin: 5px 0;"><strong>Created By:</strong> {created_by}</p>
                                <p style="margin: 5px 0;"><strong>Created At:</strong> {now}</p>
                            </div>

                            <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
                                <p style="margin: 5px 0;"><strong>Assigned Tools:</strong></p>
                                <p>{tools_html if tools_html else 'None'}</p>
                            </div>

                            {f'''<div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
                                <p style="margin: 5px 0;"><strong>Cross-App Sync Results:</strong></p>
                                {sync_html}
                            </div>''' if sync_html else ''}
                        </div>

                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                        <div style="text-align: center; color: #9ca3af; font-size: 11px;">
                            <p>This notification is sent only to designated super admins.</p>
                        </div>
                    </div>
                </body>
            </html>
            """

            text_body = f"""
ACI FORGE - New User Created

Full Name: {new_user_name}
Username: {username}
Password: {password}
Email: {email}
Created By: {created_by}
Created At: {now}
Assigned Tools: {tools_text}

Cross-App Sync:
{chr(10).join(sync_lines) if sync_lines else '  No cross-app sync'}

This notification is sent only to designated super admins.
            """

            for admin_email in ADMIN_NOTIFY_EMAILS:
                try:
                    email_service._send_email(admin_email, subject, html_body, text_body)
                except Exception as e:
                    logger.warning(f"Failed to notify {admin_email} about new user: {e}")

        except Exception as e:
            logger.error(f"Error sending new user notification: {e}", exc_info=True)

    @staticmethod
    def notify_user_login(
        username: str,
        full_name: str,
        login_time: str,
        ip_address: str = "unknown",
    ):
        """Notify Preet & Kanav when someone logs into FORGE."""
        try:
            subject = f"ACI FORGE - User Login: {username}"

            html_body = f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <h1 style="color: #2563eb; margin-bottom: 5px;">ACI FORGE</h1>
                            <p style="color: #6b7280; margin-top: 0;">Login Notification</p>
                        </div>

                        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e;">
                            <h2 style="color: #15803d; margin-top: 0;">User Login Detected</h2>

                            <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
                                <p style="margin: 5px 0;"><strong>User:</strong> {full_name} (<code>{username}</code>)</p>
                                <p style="margin: 5px 0;"><strong>Time:</strong> {login_time}</p>
                                <p style="margin: 5px 0;"><strong>IP Address:</strong> {ip_address}</p>
                            </div>
                        </div>

                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                        <div style="text-align: center; color: #9ca3af; font-size: 11px;">
                            <p>This notification is sent only to designated super admins.</p>
                        </div>
                    </div>
                </body>
            </html>
            """

            text_body = f"""
ACI FORGE - User Login

User: {full_name} ({username})
Time: {login_time}
IP Address: {ip_address}

This notification is sent only to designated super admins.
            """

            for admin_email in ADMIN_NOTIFY_EMAILS:
                try:
                    email_service._send_email(admin_email, subject, html_body, text_body)
                except Exception as e:
                    logger.warning(f"Failed to notify {admin_email} about login: {e}")

        except Exception as e:
            logger.error(f"Error sending login notification: {e}", exc_info=True)

    @staticmethod
    def notify_sso_login(
        username: str,
        full_name: str,
        target_app: str,
        login_time: str,
    ):
        """Notify Preet & Kanav when someone logs into another app via SSO from FORGE."""
        try:
            subject = f"ACI FORGE - SSO Login: {username} → {target_app.upper()}"

            html_body = f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <h1 style="color: #2563eb; margin-bottom: 5px;">ACI FORGE</h1>
                            <p style="color: #6b7280; margin-top: 0;">SSO Login Notification</p>
                        </div>

                        <div style="background: #fefce8; padding: 20px; border-radius: 8px; border-left: 4px solid #eab308;">
                            <h2 style="color: #a16207; margin-top: 0;">SSO Login via ACI FORGE</h2>

                            <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
                                <p style="margin: 5px 0;"><strong>User:</strong> {full_name} (<code>{username}</code>)</p>
                                <p style="margin: 5px 0;"><strong>Target App:</strong> <span style="background:#dbeafe;padding:2px 8px;border-radius:4px;font-weight:bold;">{target_app.upper()}</span></p>
                                <p style="margin: 5px 0;"><strong>Time:</strong> {login_time}</p>
                            </div>
                        </div>

                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                        <div style="text-align: center; color: #9ca3af; font-size: 11px;">
                            <p>This notification is sent only to designated super admins.</p>
                        </div>
                    </div>
                </body>
            </html>
            """

            text_body = f"""
ACI FORGE - SSO Login

User: {full_name} ({username})
Target App: {target_app.upper()}
Time: {login_time}

This notification is sent only to designated super admins.
            """

            for admin_email in ADMIN_NOTIFY_EMAILS:
                try:
                    email_service._send_email(admin_email, subject, html_body, text_body)
                except Exception as e:
                    logger.warning(f"Failed to notify {admin_email} about SSO login: {e}")

        except Exception as e:
            logger.error(f"Error sending SSO login notification: {e}", exc_info=True)
