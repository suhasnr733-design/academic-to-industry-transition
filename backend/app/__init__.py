import os
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from datetime import datetime, timedelta

os.environ['JWT_SECRET_KEY'] = "MySuperSecretKeyForJWT2024ThatIsVeryLong"
JWT_SECRET = "MySuperSecretKeyForJWT2024ThatIsVeryLong"

print(f"🔑 JWT_SECRET = {JWT_SECRET}")

db = SQLAlchemy()
migrate = Migrate()
cors = CORS()
bcrypt = Bcrypt()
limiter = Limiter(key_func=get_remote_address, default_limits=["100 per hour"])

# ========== JWT MANAGER ==========
jwt = JWTManager()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    email = db.Column(db.String(100), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(200), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), default='student', nullable=False)
    department = db.Column(db.String(50))
    year_of_study = db.Column(db.Integer)
    college = db.Column(db.String(100))
    phone = db.Column(db.String(15))
    bio = db.Column(db.Text)
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
            'id': self.id, 'username': self.username, 'email': self.email,
            'full_name': self.full_name, 'role': self.role,
            'department': self.department, 'year_of_study': self.year_of_study,
            'college': self.college, 'phone': self.phone, 'bio': self.bio,
            'is_active': self.is_active, 'is_email_verified': self.is_email_verified,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Resume(db.Model):
    __tablename__ = 'resumes'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    filename = db.Column(db.String(200), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer)
    file_type = db.Column(db.String(10))
    skills = db.Column(db.JSON, default=list)
    education = db.Column(db.JSON, default=list)
    experience = db.Column(db.JSON, default=dict)
    projects = db.Column(db.JSON, default=list)
    employability_score = db.Column(db.Float)
    recommended_roles = db.Column(db.JSON, default=list)
    skill_gaps = db.Column(db.JSON, default=list)
    status = db.Column(db.String(20), default='pending')
    error_message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id, 'user_id': self.user_id, 'filename': self.filename,
            'file_size': self.file_size, 'file_type': self.file_type,
            'skills': self.skills or [], 'education': self.education or [],
            'experience': self.experience or {}, 'projects': self.projects or [],
            'employability_score': self.employability_score,
            'recommended_roles': self.recommended_roles or [],
            'skill_gaps': self.skill_gaps or [], 'status': self.status,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Job(db.Model):
    __tablename__ = 'jobs'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    company = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    required_skills = db.Column(db.JSON, default=list)
    experience_required = db.Column(db.Integer)
    location = db.Column(db.String(100))
    salary_range = db.Column(db.String(50))
    job_type = db.Column(db.String(50))
    domain = db.Column(db.String(50))
    is_active = db.Column(db.Boolean, default=True)
    posted_date = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id, 'title': self.title, 'company': self.company,
            'description': self.description, 'required_skills': self.required_skills or [],
            'experience_required': self.experience_required, 'location': self.location,
            'salary_range': self.salary_range, 'job_type': self.job_type,
            'domain': self.domain, 'is_active': self.is_active,
            'posted_date': self.posted_date.isoformat() if self.posted_date else None
        }

def create_app():
    app = Flask(__name__)
    
    app.config['SECRET_KEY'] = 'dev-secret-key-12345'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///D:/G17/academic-to-industry-transition/backend/instance/site.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ECHO'] = False
    app.config['JWT_SECRET_KEY'] = JWT_SECRET
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
    app.config['CORS_ORIGINS'] = ['http://localhost:3000', 'http://localhost:5173']
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
    app.config['ALLOWED_EXTENSIONS'] = {'pdf', 'docx', 'doc', 'txt'}
    
    print(f"🔑 APP JWT_SECRET = {app.config['JWT_SECRET_KEY']}")
    
    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app, origins=app.config['CORS_ORIGINS'])
    
    # CRITICAL: Use the SAME jwt instance
    jwt.init_app(app)
    
    bcrypt.init_app(app)
    limiter.init_app(app)
    
    @jwt.unauthorized_loader
    def unauthorized_response(callback):
        return {'error': 'Missing or invalid token'}, 401
    
    @jwt.invalid_token_loader
    def invalid_token_response(callback):
        return {'error': 'Invalid token'}, 401
    
    @jwt.expired_token_loader
    def expired_token_response(callback):
        return {'error': 'Token has expired'}, 401
    
    @app.route('/api/v1/auth/register', methods=['POST'])
    @limiter.limit('5 per minute')
    def register():
        data = request.get_json()
        if not data.get('username') or not data.get('email') or not data.get('password') or not data.get('full_name'):
            return jsonify({'error': 'All fields are required'}), 400
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 409
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 409
        user = User(
            username=data['username'], email=data['email'],
            full_name=data['full_name'], department=data.get('department'),
            year_of_study=data.get('year_of_study'), college=data.get('college')
        )
        user.set_password(data['password'])
        db.session.add(user)
        db.session.commit()
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token, 'refresh_token': refresh_token,
            'user': user.to_dict()
        }), 201
    
    @app.route('/api/v1/auth/login', methods=['POST'])
    @limiter.limit('10 per minute')
    def login():
        data = request.get_json()
        if not data.get('password'):
            return jsonify({'error': 'Password required'}), 400
        user = None
        if data.get('username'):
            user = User.query.filter_by(username=data['username']).first()
        elif data.get('email'):
            user = User.query.filter_by(email=data['email']).first()
        else:
            return jsonify({'error': 'Username or email required'}), 400
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 403
        user.last_login = datetime.utcnow()
        db.session.commit()
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token, 'refresh_token': refresh_token,
            'user': user.to_dict()
        }), 200
    
    @app.route('/api/v1/auth/profile', methods=['GET'])
    def get_profile():
        # Manual JWT validation instead of decorator
        token = request.headers.get('Authorization')
        if not token or not token.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid token'}), 401
        token = token.split(' ')[1]
        
        try:
            import jwt as pyjwt
            decoded = pyjwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            user_id = decoded.get('sub')
            user = User.query.get(user_id)
            if not user:
                return jsonify({'error': 'User not found'}), 404
            return jsonify(user.to_dict()), 200
        except Exception as e:
            return jsonify({'error': 'Invalid token'}), 401
    
    @app.route('/api/v1/admin/stats', methods=['GET'])
    def get_stats():
        # Manual JWT validation
        token = request.headers.get('Authorization')
        if not token or not token.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid token'}), 401
        token = token.split(' ')[1]
        
        try:
            import jwt as pyjwt
            decoded = pyjwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            user_id = decoded.get('sub')
            user = User.query.get(user_id)
            if not user or user.role != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
            return jsonify({
                'total_users': User.query.count(),
                'total_jobs': Job.query.count(),
                'total_resumes': Resume.query.count(),
                'active_users': User.query.filter_by(is_active=True).count()
            }), 200
        except Exception as e:
            return jsonify({'error': 'Invalid token'}), 401
    
    @app.route('/api/v1/jobs', methods=['GET'])
    def get_jobs():
        jobs = Job.query.filter_by(is_active=True).order_by(Job.posted_date.desc()).all()
        return jsonify({'jobs': [j.to_dict() for j in jobs], 'total': len(jobs)}), 200
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not Found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal Server Error'}), 500
    
    with app.app_context():
        db.create_all()
        
        if not User.query.filter_by(username='admin').first():
            admin = User(
                username='admin',
                email='admin@example.com',
                full_name='System Administrator',
                role='admin',
                is_active=True,
                is_email_verified=True
            )
            admin.set_password('Admin@123')
            db.session.add(admin)
            db.session.commit()
            print("✅ Admin user created")
        
        if Job.query.count() == 0:
            jobs = [
                Job(
                    title='Software Engineer', company='Google',
                    description='Build amazing products',
                    required_skills=['Python', 'Java', 'SQL'],
                    location='Bangalore', job_type='Full-time',
                    domain='Software Engineering', is_active=True
                ),
                Job(
                    title='Data Scientist', company='Microsoft',
                    description='Work with big data',
                    required_skills=['Python', 'Machine Learning', 'SQL'],
                    location='Hyderabad', job_type='Full-time',
                    domain='Data Science', is_active=True
                )
            ]
            for job in jobs:
                db.session.add(job)
            db.session.commit()
            print("✅ Sample jobs created")
    
    return app
