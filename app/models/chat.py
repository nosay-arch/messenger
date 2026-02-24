from datetime import datetime
from app.extensions import db

class Chat(db.Model):
    __tablename__ = 'chat'
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100))
    type = db.Column(db.String(20), default='private')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    description = db.Column(db.String(200), nullable=True)
