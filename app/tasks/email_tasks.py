from threading import Thread
from flask import current_app
from flask_mail import Message
from app.extensions import mail

class EmailTask:
    def send_confirmation(self, to_email, username, token):
        app = current_app._get_current_object()
        Thread(target=self._send_async, args=(app, to_email, username, token)).start()

    def _send_async(self, app, to_email, username, token):
        with app.app_context():
            try:
                confirm_url = app.config.get('BASE_URL', 'http://localhost:1488') + f'/auth/confirm/{token}'
                html = f'''
                <h2>Подтверждение регистрации</h2>
                <p>Здравствуйте, {username}!</p>
                <p>Для завершения регистрации перейдите по ссылке:</p>
                <p><a href="{confirm_url}">{confirm_url}</a></p>
                <p>Ссылка действительна 24 часа.</p>
                '''
                msg = Message('Подтверждение email', recipients=[to_email], html=html)
                mail.send(msg)
            except Exception as e:
                app.logger.error(f"Failed to send email: {e}")
