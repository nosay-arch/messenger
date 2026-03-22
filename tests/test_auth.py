import pytest
from project.app import create_app
from project.app.core.extensions import db

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def test_register_success(client):
    response = client.post('/auth/register', json={
        'username': 'testuser',
        'password': 'password123'
    })
    assert response.status_code == 201
    data = response.get_json()
    assert data['username'] == 'testuser'

def test_register_duplicate(client):
    client.post('/auth/register', json={'username': 'testuser', 'password': 'pass'})
    response = client.post('/auth/register', json={'username': 'testuser', 'password': 'pass'})
    assert response.status_code == 400
    assert 'already taken' in response.get_json()['error']

def test_login_success(client):
    client.post('/auth/register', json={'username': 'testuser', 'password': 'password123'})
    response = client.post('/auth/login', json={'username': 'testuser', 'password': 'password123'})
    assert response.status_code == 200
    data = response.get_json()
    assert data['username'] == 'testuser'

def test_login_failure(client):
    response = client.post('/auth/login', json={'username': 'testuser', 'password': 'wrong'})
    assert response.status_code == 401
    assert 'Invalid' in response.get_json()['error']
