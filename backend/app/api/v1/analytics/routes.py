# backend/app/api/v1/analytics/routes.py

from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.api.v1.analytics import analytics_bp
from app.services.analytics_service import AnalyticsService
from app.decorators import faculty_or_admin_required

analytics_service = AnalyticsService()

@analytics_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@faculty_or_admin_required
def get_dashboard_stats():
    """Get dashboard statistics"""
    stats = analytics_service.get_dashboard_stats()
    return jsonify(stats), 200

@analytics_bp.route('/faculty/stats', methods=['GET'])
@jwt_required()
@faculty_or_admin_required
def get_faculty_stats():
    """Get real-time placement statistics for faculty dashboard"""
    current_user_id = int(get_jwt_identity())
    department = request.args.get('department')
    filter_type = request.args.get('filter_type', 'mentees')
    stats = analytics_service.get_faculty_placement_stats(
        faculty_id=current_user_id,
        filter_type=filter_type,
        department=department
    )
    return jsonify(stats), 200

@analytics_bp.route('/faculty/students', methods=['GET'])
@jwt_required()
@faculty_or_admin_required
def get_faculty_students():
    """Get student directory for faculty portal (mentees vs all)"""
    current_user_id = int(get_jwt_identity())
    department = request.args.get('department')
    filter_type = request.args.get('filter_type', 'mentees')
    students = analytics_service.get_faculty_students(
        faculty_id=current_user_id,
        filter_type=filter_type,
        department=department
    )
    return jsonify({'students': students}), 200

@analytics_bp.route('/cohort-skills', methods=['GET'])
@jwt_required()
@faculty_or_admin_required
def get_cohort_skills():
    """Get live cohort skill readiness and gap percentages"""
    department = request.args.get('department')
    skills = analytics_service.get_cohort_skill_readiness(department=department)
    return jsonify({'skills': skills}), 200

@analytics_bp.route('/advisor-recommendations', methods=['GET'])
@jwt_required()
@faculty_or_admin_required
def get_advisor_recommendations():
    """Get live dynamic advisor recommendation based on highest cohort deficit"""
    department = request.args.get('department')
    recommendation = analytics_service.get_advisor_recommendations(department=department)
    return jsonify(recommendation), 200

@analytics_bp.route('/student/<int:student_id>/placement', methods=['PUT'])
@jwt_required()
@faculty_or_admin_required
def update_student_placement(student_id):
    """Update student placement status and company info"""
    data = request.get_json() or {}
    updated = analytics_service.update_student_placement(student_id, data)
    if not updated:
        return jsonify({'error': 'Student not found'}), 404
    return jsonify({'message': 'Placement status updated successfully', 'student': updated}), 200

@analytics_bp.route('/placement-trends', methods=['GET'])
@jwt_required()
@faculty_or_admin_required
def get_placement_trends():
    """Get placement trends"""
    months = request.args.get('months', 6, type=int)
    trends = analytics_service.get_placement_trends(months)
    return jsonify({'trends': trends}), 200

@analytics_bp.route('/skill-distribution', methods=['GET'])
@jwt_required()
@faculty_or_admin_required
def get_skill_distribution():
    """Get skill distribution"""
    distribution = analytics_service.get_skill_distribution()
    return jsonify({'skills': distribution}), 200

@analytics_bp.route('/employability-distribution', methods=['GET'])
@jwt_required()
@faculty_or_admin_required
def get_employability_distribution():
    """Get employability distribution"""
    distribution = analytics_service.get_employability_distribution()
    return jsonify({'distribution': distribution}), 200

@analytics_bp.route('/student-report/<int:student_id>', methods=['GET'])
@jwt_required()
@faculty_or_admin_required
def get_student_report(student_id):
    """Generate individual student report"""
    from app.models import User, Resume
    from app.services.report_generator import ReportGenerator
    
    student = User.query.get(student_id)
    if not student:
        return jsonify({'error': 'Student not found'}), 404
    
    generator = ReportGenerator()
    report = generator.generate_student_report(student_id)
    
    return jsonify(report), 200