"""
Cross-app user sync service.
When a user is created in FORGE with access to KOSH or NEXUS tools,
automatically create matching accounts in those apps' databases.
"""

import logging
import psycopg2
from typing import Dict, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

# Tool name → target app mapping (matches sso.py TOOL_TO_APP_MAP)
TOOL_TO_APP_MAP = {
    "nexus": "nexus",
    "aci_inventory": "kosh",
}


class UserSyncService:
    """Syncs FORGE users to NEXUS and KOSH databases."""

    @staticmethod
    def _get_nexus_conn():
        return psycopg2.connect(settings.NEXUS_DATABASE_URL)

    @staticmethod
    def _get_kosh_conn():
        return psycopg2.connect(settings.KOSH_DATABASE_URL)

    @staticmethod
    def sync_user_to_nexus(
        username: str,
        email: str,
        full_name: str,
        password_hash: str,
    ) -> str:
        """
        Create user in NEXUS database with role=OPERATOR.
        Returns: 'created', 'exists', or 'error:<message>'
        """
        conn = None
        try:
            conn = UserSyncService._get_nexus_conn()
            cur = conn.cursor()

            # Check if user already exists
            cur.execute("SELECT id FROM users WHERE username = %s", (username,))
            if cur.fetchone():
                logger.info(f"NEXUS sync: user '{username}' already exists, skipping")
                return "exists"

            # Split full_name into first/last for NEXUS schema
            parts = full_name.strip().split(None, 1)
            first_name = parts[0] if parts else username
            last_name = parts[1] if len(parts) > 1 else ""

            cur.execute(
                """
                INSERT INTO users (username, email, first_name, last_name, hashed_password, role, is_active)
                VALUES (%s, %s, %s, %s, %s, 'OPERATOR', true)
                """,
                (username, email, first_name, last_name, password_hash),
            )
            conn.commit()
            logger.info(f"NEXUS sync: created user '{username}' with role OPERATOR")
            return "created"

        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"NEXUS sync error for '{username}': {e}", exc_info=True)
            return f"error:{e}"
        finally:
            if conn:
                conn.close()

    @staticmethod
    def sync_user_to_kosh(
        username: str,
        full_name: str,
        password_plaintext: str,
    ) -> str:
        """
        Create user in KOSH database with usersecurity='user'.
        KOSH main app uses plain text password comparison.
        Returns: 'created', 'exists', or 'error:<message>'
        """
        conn = None
        try:
            conn = UserSyncService._get_kosh_conn()
            cur = conn.cursor()

            # Check if user already exists
            cur.execute(
                'SELECT id FROM pcb_inventory."tblUser" WHERE userlogin = %s',
                (username,),
            )
            if cur.fetchone():
                logger.info(f"KOSH sync: user '{username}' already exists, skipping")
                return "exists"

            cur.execute(
                """
                INSERT INTO pcb_inventory."tblUser" (username, userlogin, password, usersecurity)
                VALUES (%s, %s, %s, %s)
                """,
                (full_name, username, password_plaintext, "user"),
            )
            conn.commit()
            logger.info(f"KOSH sync: created user '{username}' with role user")
            return "created"

        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"KOSH sync error for '{username}': {e}", exc_info=True)
            return f"error:{e}"
        finally:
            if conn:
                conn.close()

    @staticmethod
    def sync_user_to_apps(
        username: str,
        email: str,
        full_name: str,
        password_plaintext: str,
        password_hash: str,
        tool_names: list,
    ) -> Dict[str, str]:
        """
        Sync user to all target apps based on assigned tool names.
        Returns dict like {"nexus": "created", "kosh": "exists"}
        """
        results = {}

        # Determine which apps need syncing
        target_apps = set()
        for tool_name in tool_names:
            app = TOOL_TO_APP_MAP.get(tool_name.lower())
            if app:
                target_apps.add(app)

        if "nexus" in target_apps:
            results["nexus"] = UserSyncService.sync_user_to_nexus(
                username, email, full_name, password_hash
            )

        if "kosh" in target_apps:
            results["kosh"] = UserSyncService.sync_user_to_kosh(
                username, full_name, password_plaintext
            )

        if results:
            logger.info(f"User sync results for '{username}': {results}")

        return results
