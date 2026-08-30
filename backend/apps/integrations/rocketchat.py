"""Client REST minimal pour l'API d'administration Rocket.Chat.

Configuré via ``settings.WAGADU["ROCKETCHAT"]`` :
``{"URL": ..., "ADMIN_USER": ..., "ADMIN_PASSWORD": ...}``.
Si l'URL est absente, :func:`is_configured` renvoie ``False`` et l'appelant doit
dégrader proprement (endpoints 503, UI « non configuré »).
"""
from __future__ import annotations

import secrets

import requests
from django.conf import settings
from django.core.cache import cache

TIMEOUT = 10


class RocketChatError(RuntimeError):
    pass


def _conf() -> dict:
    return settings.WAGADU.get("ROCKETCHAT", {})


def is_configured() -> bool:
    c = _conf()
    return bool(c.get("URL") and c.get("ADMIN_USER") and c.get("ADMIN_PASSWORD"))


class RocketChatClient:
    def __init__(self):
        if not is_configured():
            raise RocketChatError("Rocket.Chat n'est pas configuré.")
        self.base = _conf()["URL"].rstrip("/")
        self._auth = None

    # --- Authentification admin (jeton mis en cache) ---
    def _login(self) -> dict:
        cached = cache.get("rc_admin_auth")
        if cached:
            return cached
        resp = requests.post(
            f"{self.base}/api/v1/login",
            json={"user": _conf()["ADMIN_USER"], "password": _conf()["ADMIN_PASSWORD"]},
            timeout=TIMEOUT,
        )
        data = self._json(resp)
        auth = {
            "X-Auth-Token": data["data"]["authToken"],
            "X-User-Id": data["data"]["userId"],
        }
        cache.set("rc_admin_auth", auth, 60 * 30)
        return auth

    def _headers(self) -> dict:
        if self._auth is None:
            self._auth = self._login()
        return self._auth

    @staticmethod
    def _json(resp) -> dict:
        try:
            body = resp.json()
        except ValueError as exc:
            raise RocketChatError(f"Réponse non-JSON ({resp.status_code}).") from exc
        if not resp.ok or body.get("success") is False:
            raise RocketChatError(body.get("error") or f"Erreur HTTP {resp.status_code}")
        return body

    def _post(self, path: str, payload: dict) -> dict:
        return self._json(requests.post(
            f"{self.base}/api/v1/{path}", json=payload,
            headers=self._headers(), timeout=TIMEOUT,
        ))

    def _get(self, path: str, params: dict | None = None) -> dict:
        return self._json(requests.get(
            f"{self.base}/api/v1/{path}", params=params or {},
            headers=self._headers(), timeout=TIMEOUT,
        ))

    # --- Utilisateurs ---
    def upsert_user(self, *, email: str, name: str, username: str) -> dict:
        existing = requests.get(
            f"{self.base}/api/v1/users.info", params={"username": username},
            headers=self._headers(), timeout=TIMEOUT,
        )
        if existing.ok and existing.json().get("success"):
            return existing.json()["user"]
        body = self._post("users.create", {
            "email": email, "name": name, "username": username,
            "password": secrets.token_urlsafe(24),
            "requirePasswordChange": False, "verified": True,
            "joinDefaultChannels": True,
        })
        return body["user"]

    def create_personal_token(self, *, user_id: str) -> str:
        """Jeton d'accès personnel (SSO iframe : loginWithToken côté client)."""
        body = self._post("users.createToken", {"userId": user_id})
        return body["data"]["authToken"]

    def set_status(self, *, user_id: str, status: str, message: str = "") -> None:
        self._post("users.setStatus", {"userId": user_id, "status": status, "message": message})

    # --- Canaux ---
    def create_channel(self, *, name: str, members: list[str] | None = None) -> dict:
        body = self._post("channels.create", {"name": name, "members": members or []})
        return body["channel"]
