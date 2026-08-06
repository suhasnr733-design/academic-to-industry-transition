# backend/app/graphql/federation.py

import graphene
from graphene_federation import build_federated_schema, key, external, provides, requires
from app.models import User, Resume, Job
from app.extensions import db

# ============ User Service ============
@key(fields="id")
class UserType(graphene.ObjectType):
    class Meta:
        interfaces = (graphene.relay.Node,)
    
    id = graphene.ID(required=True)
    username = graphene.String()
    email = graphene.String()
    full_name = graphene.String()
    role = graphene.String()
    department = graphene.String()
    
    # Federated fields
    resumes = graphene.List(lambda: ResumeType)
    
    def resolve_resumes(self, info):
        # Fetch from Resume Service
        # In production, this would be a federated query
        return Resume.query.filter_by(user_id=self.id).all()

# ============ Resume Service ============
@key(fields="id")
class ResumeType(graphene.ObjectType):
    class Meta:
        interfaces = (graphene.relay.Node,)
    
    id = graphene.ID(required=True)
    user_id = graphene.Int()
    filename = graphene.String()
    skills = graphene.List(graphene.String)
    employability_score = graphene.Float()
    status = graphene.String()
    
    # Federated field
    user = graphene.Field(UserType)
    
    def resolve_user(self, info):
        # Fetch from User Service
        return User.query.get(self.user_id)

# ============ Job Service ============
@key(fields="id")
class JobType(graphene.ObjectType):
    class Meta:
        interfaces = (graphene.relay.Node,)
    
    id = graphene.ID(required=True)
    title = graphene.String()
    company = graphene.String()
    required_skills = graphene.List(graphene.String)
    location = graphene.String()
    domain = graphene.String()
    match_score = graphene.Float()

# ============ Federated Query ============
class Query(graphene.ObjectType):
    # User queries
    user = graphene.Field(UserType, id=graphene.ID(required=True))
    all_users = graphene.List(UserType)
    
    # Resume queries
    resume = graphene.Field(ResumeType, id=graphene.ID(required=True))
    resumes_by_user = graphene.List(ResumeType, user_id=graphene.Int(required=True))
    
    # Job queries
    job = graphene.Field(JobType, id=graphene.ID(required=True))
    all_jobs = graphene.List(JobType)
    jobs_by_domain = graphene.List(JobType, domain=graphene.String(required=True))
    
    # Combined queries
    user_with_resumes = graphene.Field(UserType, id=graphene.ID(required=True))
    job_with_matches = graphene.Field(JobType, id=graphene.ID(required=True), user_id=graphene.Int(required=True))
    
    def resolve_user(self, info, id):
        return User.query.get(id)
    
    def resolve_all_users(self, info):
        return User.query.all()
    
    def resolve_resume(self, info, id):
        return Resume.query.get(id)
    
    def resolve_resumes_by_user(self, info, user_id):
        return Resume.query.filter_by(user_id=user_id).all()
    
    def resolve_job(self, info, id):
        return Job.query.get(id)
    
    def resolve_all_jobs(self, info):
        return Job.query.filter_by(is_active=True).all()
    
    def resolve_jobs_by_domain(self, info, domain):
        return Job.query.filter_by(domain=domain, is_active=True).all()
    
    def resolve_user_with_resumes(self, info, id):
        user = User.query.get(id)
        if user:
            user.resumes = Resume.query.filter_by(user_id=id).all()
        return user
    
    def resolve_job_with_matches(self, info, id, user_id):
        job = Job.query.get(id)
        if job and user_id:
            # Calculate match score with user's resume
            resume = Resume.query.filter_by(user_id=user_id).first()
            if resume:
                match_score = len(set(job.required_skills or []) & set(resume.skills or [])) / len(job.required_skills or []) * 100
                job.match_score = match_score
        return job

# ============ Federated Mutations ============
class CreateUser(graphene.Mutation):
    class Arguments:
        username = graphene.String(required=True)
        email = graphene.String(required=True)
        password = graphene.String(required=True)
        full_name = graphene.String(required=True)
    
    user = graphene.Field(UserType)
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, username, email, password, full_name):
        user = User(
            username=username,
            email=email,
            full_name=full_name
        )
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return CreateUser(user=user, success=True, message="User created")

class UpdateResumeSkills(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
        skills = graphene.List(graphene.String)
    
    resume = graphene.Field(ResumeType)
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, id, skills):
        resume = Resume.query.get(id)
        if not resume:
            return UpdateResumeSkills(success=False, message="Resume not found")
        resume.skills = skills
        db.session.commit()
        return UpdateResumeSkills(resume=resume, success=True, message="Skills updated")

class Mutation(graphene.ObjectType):
    create_user = CreateUser.Field()
    update_resume_skills = UpdateResumeSkills.Field()

# Build federated schema
schema = build_federated_schema(
    query=Query,
    mutation=Mutation,
    types=[UserType, ResumeType, JobType]
)