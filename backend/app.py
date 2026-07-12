from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from datetime import datetime, timedelta
import jwt

app = Flask(__name__)

app.config['SECRET_KEY'] = 'dev-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///instance/site.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = "MySuperSecretKeyForJWT2024ThatIsVeryLong"

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
cors = CORS(app)
jwt = JWTManager(app)

JWT_SECRET = "MySuperSecretKeyForJWT2024ThatIsVeryLong"

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), default='student')
    is_active = db.Column(db.Boolean, default=True)
    is_email_verified = db.Column(db.Boolean, default=False)
    last_login = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'role': self.role,
            'is_active': self.is_active,
            'is_email_verified': self.is_email_verified,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Job(db.Model):
    __tablename__ = 'jobs'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    company = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    required_skills = db.Column(db.JSON, default=list)
    location = db.Column(db.String(100))
    job_type = db.Column(db.String(50))
    domain = db.Column(db.String(50))
    is_active = db.Column(db.Boolean, default=True)
    posted_date = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'company': self.company,
            'description': self.description,
            'required_skills': self.required_skills or [],
            'location': self.location,
            'job_type': self.job_type,
            'domain': self.domain,
            'is_active': self.is_active,
            'posted_date': self.posted_date.isoformat() if self.posted_date else None
        }

@app.route('/api/v1/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password required'}), 400
    
    user = User.query.filter_by(username=data['username']).first()
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    user.last_login = datetime.utcnow()
    db.session.commit()
    
    access_token = create_access_token(identity=user.id)
    return jsonify({
        'access_token': access_token,
        'user': user.to_dict()
    }), 200

@app.route('/api/v1/auth/profile', methods=['GET'])
def get_profile():
    token = request.headers.get('Authorization')
    if not token or not token.startswith('Bearer '):
        return jsonify({'error': 'Missing or invalid token'}), 401
    
    token = token.split(' ')[1]
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        user = User.query.get(decoded.get('sub'))
        if not user:
            return jsonify({'error': 'User not found'}), 404
        return jsonify(user.to_dict()), 200
    except Exception as e:
        return jsonify({'error': 'Invalid token'}), 401

@app.route('/api/v1/jobs', methods=['GET'])
def get_jobs():
    jobs = Job.query.filter_by(is_active=True).all()
    return jsonify({'jobs': [j.to_dict() for j in jobs]}), 200

with app.app_context():
    db.create_all()
    if not User.query.filter_by(username='admin').first():
        admin = User(username='admin', email='admin@example.com', full_name='System Administrator', role='admin')
        admin.set_password('Admin@123')
        db.session.add(admin)
        db.session.commit()
        print("✅ Admin user created")
    
    if Job.query.count() == 0:
        jobs = [
            Job(title='Software Engineer', company='Google', description='Build amazing products', required_skills=['Python', 'Java', 'SQL'], location='Bangalore', job_type='Full-time', domain='Software Engineering'),
            Job(title='Data Scientist', company='Microsoft', description='Work with big data', required_skills=['Python', 'Machine Learning', 'SQL'], location='Hyderabad', job_type='Full-time', domain='Data Science')
        ]
        for job in jobs:
            db.session.add(job)
        db.session.commit()
        print("✅ Sample jobs created")

if __name__ == '__main__':
    app.run(debug=True, port=5000)
