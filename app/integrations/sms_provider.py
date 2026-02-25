from abc import ABC, abstractmethod
from threading import Thread
from typing import Optional
from flask import Flask
import urllib.request
import urllib.parse
import json

class SmsProvider(ABC):
    @abstractmethod
    def send_code(self, phone: str, code: str) -> bool:
        pass

class GenericHttpSmsProvider(SmsProvider):
    def __init__(self, app: Optional[Flask] = None):
        self.app = app

    def send_code(self, phone: str, code: str) -> bool:
        if self.app:
            Thread(target=self._send_async, args=(self.app, phone, code)).start()
        return True

    @staticmethod
    def _send_async(app: Flask, phone: str, code: str) -> None:
        with app.app_context():
            try:
                api_url = app.config.get('SMS_API_URL')
                api_key = app.config.get('SMS_API_KEY')
                if not api_url or not api_key:
                    app.logger.warning('SMS API not configured, skipping send')
                    return

                payload = {
                    'to': phone,
                    'message': f'Код подтверждения: {code}'
                }
                data = urllib.parse.urlencode(payload).encode()
                req = urllib.request.Request(api_url, data=data, method='POST')
                req.add_header('Authorization', f'Bearer {api_key}')
                req.add_header('Content-Type', 'application/x-www-form-urlencoded')
                with urllib.request.urlopen(req, timeout=10) as resp:
                    status = resp.getcode()
                    app.logger.info(f'SMS send status {status} for {phone}')
            except Exception as e:
                app.logger.exception(f'Failed to send SMS to {phone}: {e}')
