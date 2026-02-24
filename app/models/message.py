from datetime import datetime
from app.extensions import db

class Message(db.Model):
    __tablename__ = 'message'
    id = db.Column(db.Integer, primary_key=True)
    chat_id = db.Column(db.String(50), db.ForeignKey('chat.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    text = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    is_deleted = db.Column(db.Boolean, default=False)
    edited = db.Column(db.Boolean, default=False)

    user = db.relationship('User')

    __table_args__ = (
        db.Index('ix_message_chat_id', 'chat_id'),
        db.Index('ix_message_timestamp', 'timestamp'),
    )
