# backend/app/api/v1/mentorship/routes.py

from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.extensions import db
from app.models import User, MentorshipRequest, Notification
from app.api.v1.mentorship import mentorship_bp

# ==========================================================
# 1. STUDENT: BROWSE FACULTY LIST WITH LIVE REQUEST STATUS
# ==========================================================
@mentorship_bp.route('/faculty-list', methods=['GET'])
@jwt_required()
def get_faculty_list():
    """Get list of faculty advisors with current student request status"""
    try:
        current_user_id = int(get_jwt_identity())
        student = User.query.get(current_user_id)
        if not student:
            return jsonify({'error': 'User not found'}), 404

        faculty_members = User.query.filter(
            User.role == 'faculty',
            User.is_active == True
        ).all()

        # Get existing requests from this student
        existing_requests = {
            req.faculty_id: req 
            for req in MentorshipRequest.query.filter_by(student_id=student.id).all()
        }

        results = []
        for f in faculty_members:
            # Count accepted mentees for this faculty
            mentee_count = MentorshipRequest.query.filter_by(
                faculty_id=f.id, 
                status='accepted'
            ).count()

            req = existing_requests.get(f.id)
            results.append({
                'id': f.id,
                'full_name': f.full_name,
                'username': f.username,
                'email': f.email,
                'department': f.department or 'Academic Faculty',
                'college': f.college,
                'bio': f.bio,
                'mentee_count': mentee_count,
                'request_status': req.status if req else 'none',
                'request_id': req.id if req else None,
                'request_message': req.message if req else None,
                'request_created_at': req.created_at.isoformat() if req and req.created_at else None
            })

        return jsonify({'faculty': results}), 200

    except Exception as e:
        return jsonify({'error': 'Failed to fetch faculty list', 'message': str(e)}), 500


# ==========================================================
# 2. STUDENT: SEND MENTORSHIP / ADVISOR REQUEST
# ==========================================================
@mentorship_bp.route('/request', methods=['POST'])
@jwt_required()
def send_mentorship_request():
    """Student sends a mentorship request to a faculty member"""
    try:
        current_user_id = int(get_jwt_identity())
        student = User.query.get(current_user_id)
        if not student:
            return jsonify({'error': 'Student not found'}), 404

        data = request.get_json() or {}
        faculty_id = data.get('faculty_id')
        message = data.get('message', '').strip()

        if not faculty_id:
            return jsonify({'error': 'faculty_id is required'}), 400

        faculty = User.query.get(faculty_id)
        if not faculty or faculty.role != 'faculty':
            return jsonify({'error': 'Invalid faculty member selected'}), 404

        # Check existing request
        existing = MentorshipRequest.query.filter_by(
            student_id=student.id,
            faculty_id=faculty.id
        ).first()

        if existing:
            if existing.status == 'accepted':
                return jsonify({'message': 'You are already mentored by this professor', 'request': existing.to_dict()}), 200
            existing.status = 'pending'
            existing.message = message
            existing.updated_at = datetime.utcnow()
            req_obj = existing
        else:
            req_obj = MentorshipRequest(
                student_id=student.id,
                faculty_id=faculty.id,
                status='pending',
                message=message
            )
            db.session.add(req_obj)

        # Create in-app notification for the faculty member
        notification = Notification(
            user_id=faculty.id,
            title='New Mentorship Request',
            message=f'Student {student.full_name or student.username} ({student.department or "General"}) requested you as an academic/career advisor.',
            notification_type='mentorship'
        )
        db.session.add(notification)
        db.session.commit()

        return jsonify({
            'message': f'Mentorship request sent to {faculty.full_name}!',
            'request': req_obj.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to send mentorship request', 'message': str(e)}), 500


# ==========================================================
# 3. STUDENT: GET CURRENT ADVISOR & SENT REQUESTS
# ==========================================================
@mentorship_bp.route('/my-advisor', methods=['GET'])
@jwt_required()
def get_my_advisor():
    """Get student's active advisor and sent requests"""
    try:
        current_user_id = int(get_jwt_identity())
        student = User.query.get(current_user_id)
        if not student:
            return jsonify({'error': 'User not found'}), 404

        # Get accepted advisor
        accepted = MentorshipRequest.query.filter_by(
            student_id=student.id,
            status='accepted'
        ).first()

        # Get all sent requests
        all_requests = MentorshipRequest.query.filter_by(
            student_id=student.id
        ).order_by(MentorshipRequest.created_at.desc()).all()

        return jsonify({
            'has_advisor': accepted is not None,
            'advisor': accepted.to_dict() if accepted else None,
            'requests': [r.to_dict() for r in all_requests]
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to fetch advisor details', 'message': str(e)}), 500


# ==========================================================
# 4. FACULTY: GET INCOMING MENTORSHIP REQUESTS
# ==========================================================
@mentorship_bp.route('/incoming-requests', methods=['GET'])
@jwt_required()
def get_incoming_requests():
    """Get all incoming requests for the logged-in faculty member"""
    try:
        current_user_id = int(get_jwt_identity())
        faculty = User.query.get(current_user_id)
        if not faculty or faculty.role not in ['faculty', 'admin']:
            return jsonify({'error': 'Faculty access required'}), 403

        status_filter = request.args.get('status')
        query = MentorshipRequest.query.filter_by(faculty_id=faculty.id)
        if status_filter:
            query = query.filter_by(status=status_filter)

        requests = query.order_by(MentorshipRequest.created_at.desc()).all()

        return jsonify({
            'requests': [r.to_dict() for r in requests],
            'pending_count': sum(1 for r in requests if r.status == 'pending'),
            'accepted_count': sum(1 for r in requests if r.status == 'accepted')
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to fetch incoming requests', 'message': str(e)}), 500


# ==========================================================
# 5. FACULTY: ACCEPT OR DECLINE REQUEST
# ==========================================================
@mentorship_bp.route('/requests/<int:request_id>/action', methods=['PUT'])
@jwt_required()
def handle_mentorship_action(request_id):
    """Faculty accepts or declines a mentorship request"""
    try:
        current_user_id = int(get_jwt_identity())
        faculty = User.query.get(current_user_id)
        if not faculty or faculty.role not in ['faculty', 'admin']:
            return jsonify({'error': 'Faculty access required'}), 403

        req_obj = MentorshipRequest.query.get(request_id)
        if not req_obj or req_obj.faculty_id != faculty.id:
            return jsonify({'error': 'Mentorship request not found'}), 404

        data = request.get_json() or {}
        action = data.get('action')  # 'accept' or 'reject'
        response_note = data.get('response_note', '')

        if action not in ['accept', 'reject']:
            return jsonify({'error': 'Action must be "accept" or "reject"'}), 400

        req_obj.status = 'accepted' if action == 'accept' else 'rejected'
        req_obj.response_note = response_note
        req_obj.updated_at = datetime.utcnow()

        # Send notification to student
        student_notification = Notification(
            user_id=req_obj.student_id,
            title='Mentorship Request Update',
            message=(
                f'Professor {faculty.full_name} has ACCEPTED your mentorship request!'
                if action == 'accept'
                else f'Professor {faculty.full_name} was unable to accept your mentorship request.'
            ),
            notification_type='mentorship'
        )
        db.session.add(student_notification)
        db.session.commit()

        return jsonify({
            'message': f'Request successfully {"accepted" if action == "accept" else "declined"}',
            'request': req_obj.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to process request', 'message': str(e)}), 500


# ==========================================================
# 6. CANCEL OR REMOVE MENTORSHIP
# ==========================================================
@mentorship_bp.route('/requests/<int:request_id>', methods=['DELETE'])
@jwt_required()
def delete_mentorship_request(request_id):
    """Cancel a pending request or remove a mentorship link"""
    try:
        current_user_id = int(get_jwt_identity())
        req_obj = MentorshipRequest.query.get(request_id)
        if not req_obj:
            return jsonify({'error': 'Request not found'}), 404

        if req_obj.student_id != current_user_id and req_obj.faculty_id != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403

        db.session.delete(req_obj)
        db.session.commit()

        return jsonify({'message': 'Mentorship request removed successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete request', 'message': str(e)}), 500
