# backend/app/graphql/schema.py

import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType, SQLAlchemyConnectionField
from app.models import User, Resume, Job, AssessmentResult
from app.extensions import db

class UserType(SQLAlchemyObjectType):
    class Meta:
        model = User
        interfaces = (graphene.relay.Node,)
    
    full_name = graphene.String()
    email = graphene.String()
    
    def resolve_full_name(self, info):
        return self.full_name

class ResumeType(SQLAlchemyObjectType):
    class Meta:
        model = Resume
        interfaces = (graphene.relay.Node,)
    
    skills = graphene.List(graphene.String)
    
    def resolve_skills(self, info):
        return self.skills or []

class JobType(SQLAlchemyObjectType):
    class Meta:
        model = Job
        interfaces = (graphene.relay.Node,)
    
    required_skills = graphene.List(graphene.String)
    
    def resolve_required_skills(self, info):
        return self.required_skills or []

class Query(graphene.ObjectType):
    node = graphene.relay.Node.Field()
    
    # User queries
    all_users = SQLAlchemyConnectionField(UserType)
    user = graphene.Field(UserType, id=graphene.Int(required=True))
    
    # Resume queries
    all_resumes = SQLAlchemyConnectionField(ResumeType)
    resume = graphene.Field(ResumeType, id=graphene.Int(required=True))
    resumes_by_user = graphene.List(ResumeType, user_id=graphene.Int(required=True))
    
    # Job queries
    all_jobs = SQLAlchemyConnectionField(JobType)
    job = graphene.Field(JobType, id=graphene.Int(required=True))
    jobs_by_domain = graphene.List(JobType, domain=graphene.String(required=True))
    
    def resolve_user(self, info, id):
        return User.query.get(id)
    
    def resolve_resume(self, info, id):
        return Resume.query.get(id)
    
    def resolve_resumes_by_user(self, info, user_id):
        return Resume.query.filter_by(user_id=user_id).all()
    
    def resolve_job(self, info, id):
        return Job.query.get(id)
    
    def resolve_jobs_by_domain(self, info, domain):
        return Job.query.filter_by(domain=domain, is_active=True).all()

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
        
        return CreateUser(user=user, success=True, message="User created successfully")

class UpdateResume(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
        skills = graphene.List(graphene.String)
        employability_score = graphene.Float
    
    resume = graphene.Field(ResumeType)
    success = graphene.Boolean()
    message = graphene.String()
    
    def mutate(self, info, id, skills=None, employability_score=None):
        resume = Resume.query.get(id)
        if not resume:
            return UpdateResume(success=False, message="Resume not found")
        
        if skills is not None:
            resume.skills = skills
        if employability_score is not None:
            resume.employability_score = employability_score
        
        db.session.commit()
        return UpdateResume(resume=resume, success=True, message="Resume updated successfully")

class Mutation(graphene.ObjectType):
    create_user = CreateUser.Field()
    update_resume = UpdateResume.Field()

schema = graphene.Schema(query=Query, mutation=Mutation)