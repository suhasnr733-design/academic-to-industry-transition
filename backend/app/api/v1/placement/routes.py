# backend/app/api/v1/placement/routes.py

from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.extensions import db
from app.models import User, PlacementNomination, Notification, Resume
from app.api.v1.placement import placement_bp
from app.decorators import faculty_or_admin_required
from app.services.notification_service import NotificationService
try:
    from app.services.websocket import send_notification
except ImportError:
    send_notification = None


# ==========================================================
# 1. FACULTY: NOMINATE / SELECT CANDIDATES FOR COMPANY
# ==========================================================
@placement_bp.route('/nominate', methods=['POST'])
@jwt_required()
@faculty_or_admin_required
def nominate_students():
    """Faculty or Admin selects candidate(s) for a company placement drive"""
    try:
        current_user_id = int(get_jwt_identity())
        faculty = User.query.get(current_user_id)
        if not faculty:
            return jsonify({'error': 'Faculty user not found'}), 404

        data = request.get_json() or {}
        company_name = (data.get('company_name') or '').strip()
        if not company_name:
            return jsonify({'error': 'Company name is required for nomination'}), 400

        # Extract student IDs (support both array and single id)
        student_ids = data.get('student_ids')
        if student_ids is None and 'student_id' in data:
            student_ids = [data['student_id']]
        if not student_ids or not isinstance(student_ids, list):
            return jsonify({'error': 'At least one student must be selected'}), 400

        job_role = (data.get('job_role') or 'Software Engineer').strip()
        package_lpa = data.get('package_lpa')
        try:
            package_lpa = float(package_lpa) if package_lpa is not None and str(package_lpa) != '' else None
        except (ValueError, TypeError):
            package_lpa = None

        faculty_notes = (data.get('faculty_notes') or '').strip()

        created_nominations = []

        for s_id in student_ids:
            try:
                sid_int = int(s_id)
            except (ValueError, TypeError):
                continue

            student = User.query.get(sid_int)
            if not student or student.role != 'student':
                continue

            # Check if there is already an active nomination for this student & company
            existing = PlacementNomination.query.filter_by(
                student_id=student.id,
                company_name=company_name
            ).first()

            if existing:
                # Update existing nomination if it was rejected or re-issued
                existing.status = 'pending'
                existing.faculty_id = faculty.id
                existing.job_role = job_role
                existing.package_lpa = package_lpa
                existing.faculty_notes = faculty_notes
                existing.updated_at = datetime.utcnow()
                nomination = existing
            else:
                nomination = PlacementNomination(
                    student_id=student.id,
                    faculty_id=faculty.id,
                    company_name=company_name,
                    job_role=job_role,
                    package_lpa=package_lpa,
                    status='pending',
                    faculty_notes=faculty_notes
                )
                db.session.add(nomination)

            # Create In-App Notification for Student
            pkg_str = f" offering ₹{package_lpa} LPA" if package_lpa else ""
            notif_title = f"🎉 Selected for {company_name} Drive!"
            notif_msg = f"You have been selected by {faculty.full_name} for the {company_name} ({job_role}){pkg_str}. Please review and accept or decline on your dashboard."
            
            notification = Notification(
                user_id=student.id,
                title=notif_title,
                message=notif_msg,
                notification_type='placement_offer',
                link='/dashboard'
            )
            db.session.add(notification)

            # Emit real-time WebSocket event
            if send_notification:
                try:
                    send_notification(student.id, {
                        'title': notif_title,
                        'message': notif_msg,
                        'type': 'placement_offer',
                        'link': '/dashboard'
                    })
                except Exception:
                    pass

            created_nominations.append(nomination)

        db.session.commit()

        return jsonify({
            'success': True,
            'message': f"Successfully nominated {len(created_nominations)} candidate(s) for {company_name}",
            'count': len(created_nominations),
            'nominations': [n.to_dict() for n in created_nominations]
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create placement nominations', 'message': str(e)}), 500


# ==========================================================
# 2. STUDENT: GET ALL MY COMPANY NOMINATIONS / OFFERS
# ==========================================================
@placement_bp.route('/my-nominations', methods=['GET'])
@jwt_required()
def get_my_nominations():
    """Get active and past company drive nominations for current student"""
    try:
        current_user_id = int(get_jwt_identity())
        student = User.query.get(current_user_id)
        if not student:
            return jsonify({'error': 'User not found'}), 404

        nominations = PlacementNomination.query.filter_by(
            student_id=student.id
        ).order_by(PlacementNomination.id.desc()).all()

        return jsonify({
            'success': True,
            'nominations': [n.to_dict() for n in nominations]
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to fetch nominations', 'message': str(e)}), 500


# ==========================================================
# 3. STUDENT: ACCEPT OR REJECT COMPANY NOMINATION
# ==========================================================
@placement_bp.route('/nominations/<int:nomination_id>/respond', methods=['PUT'])
@jwt_required()
def respond_to_nomination(nomination_id):
    """Student accepts or rejects a company placement nomination"""
    try:
        current_user_id = int(get_jwt_identity())
        student = User.query.get(current_user_id)
        if not student:
            return jsonify({'error': 'User not found'}), 404

        nomination = PlacementNomination.query.get(nomination_id)
        if not nomination:
            return jsonify({'error': 'Nomination not found'}), 404

        if nomination.student_id != student.id:
            return jsonify({'error': 'Unauthorized to respond to this nomination'}), 403

        data = request.get_json() or {}
        action = data.get('action')  # 'accept' or 'reject'
        response_note = data.get('response_note', '').strip()

        if action not in ['accept', 'reject']:
            return jsonify({'error': 'Invalid action. Must be "accept" or "reject"'}), 400

        faculty = User.query.get(nomination.faculty_id)

        if action == 'accept':
            nomination.status = 'confirmed_attending'
            nomination.student_response_note = response_note or 'Confirmed attendance for placement drive'
            nomination.updated_at = datetime.utcnow()

            # Note: We do NOT mark student.placement_status as 'placed' here.
            # Student is confirmed to ATTEND the drive, but is still seeking placement until company results.

            # Notify Faculty
            if faculty:
                notif = Notification(
                    user_id=faculty.id,
                    title="✅ Candidate Confirmed Drive Attendance!",
                    message=f"{student.full_name} confirmed attendance for the {nomination.company_name} ({nomination.job_role}) placement drive.",
                    notification_type='placement_confirmed',
                    link='/faculty?tab=shortlist'
                )
                db.session.add(notif)
                if send_notification:
                    try:
                        send_notification(faculty.id, {
                            'title': notif.title,
                            'message': notif.message,
                            'type': 'placement_confirmed',
                            'link': '/faculty?tab=shortlist'
                        })
                    except Exception:
                        pass

        elif action == 'reject':
            nomination.status = 'rejected'
            nomination.student_response_note = response_note or 'Declined attendance for placement drive'
            nomination.updated_at = datetime.utcnow()

            # Notify Faculty
            if faculty:
                reason_str = f" Reason: {response_note}" if response_note else ""
                notif = Notification(
                    user_id=faculty.id,
                    title="Candidate Declined Drive Attendance",
                    message=f"{student.full_name} declined attendance for the {nomination.company_name} drive.{reason_str}",
                    notification_type='placement_rejected',
                    link='/faculty?tab=shortlist'
                )
                db.session.add(notif)
                if send_notification:
                    try:
                        send_notification(faculty.id, {
                            'title': notif.title,
                            'message': notif.message,
                            'type': 'placement_rejected',
                            'link': '/faculty?tab=shortlist'
                        })
                    except Exception:
                        pass

        db.session.commit()

        return jsonify({
            'success': True,
            'message': f"Drive attendance marked as {nomination.status}",
            'nomination': nomination.to_dict(),
            'user': {
                'id': student.id,
                'placement_status': student.placement_status,
                'placed_company': student.placed_company,
                'package_lpa': student.package_lpa
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to respond to nomination', 'message': str(e)}), 500


# ==========================================================
# 4. FACULTY: MARK CONFIRMED STUDENT AS FINAL PLACED / HIRED
# ==========================================================
@placement_bp.route('/nominations/<int:nomination_id>/mark-hired', methods=['POST'])
@jwt_required()
@faculty_or_admin_required
def mark_nomination_hired(nomination_id):
    """Faculty marks student as officially placed/hired by the company after interviews"""
    try:
        nomination = PlacementNomination.query.get(nomination_id)
        if not nomination:
            return jsonify({'error': 'Nomination not found'}), 404

        student = User.query.get(nomination.student_id)
        if not student:
            return jsonify({'error': 'Student not found'}), 404

        data = request.get_json() or {}
        package_lpa = data.get('package_lpa', nomination.package_lpa)
        try:
            package_lpa = float(package_lpa) if package_lpa is not None and str(package_lpa) != '' else nomination.package_lpa
        except (ValueError, TypeError):
            package_lpa = nomination.package_lpa

        nomination.status = 'placed'
        if package_lpa is not None:
            nomination.package_lpa = package_lpa
        nomination.updated_at = datetime.utcnow()

        # Update student profile placement details
        student.placement_status = 'placed'
        student.placed_company = nomination.company_name
        if package_lpa is not None:
            student.package_lpa = package_lpa

        # Send celebration notification to student
        pkg_str = f" with ₹{package_lpa} LPA CTC" if package_lpa else ""
        notif = Notification(
            user_id=student.id,
            title=f"🎉 Officially Hired at {nomination.company_name}!",
            message=f"Congratulations! You have been officially marked as Placed at {nomination.company_name} ({nomination.job_role}){pkg_str}!",
            notification_type='placement_placed',
            link='/dashboard'
        )
        db.session.add(notif)
        if send_notification:
            try:
                send_notification(student.id, {
                    'title': notif.title,
                    'message': notif.message,
                    'type': 'placement_placed',
                    'link': '/dashboard'
                })
            except Exception:
                pass

        db.session.commit()

        return jsonify({
            'success': True,
            'message': f"Student {student.full_name} marked as officially Placed at {nomination.company_name}!",
            'nomination': nomination.to_dict(),
            'user': {
                'id': student.id,
                'placement_status': student.placement_status,
                'placed_company': student.placed_company,
                'package_lpa': student.package_lpa
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to mark candidate as placed', 'message': str(e)}), 500


# ==========================================================
# 5. FACULTY: GET NOMINATIONS FOR A COMPANY OR DRIVE
# ==========================================================
@placement_bp.route('/company-nominations', methods=['GET'])
@jwt_required()
@faculty_or_admin_required
def get_company_nominations():
    """Faculty retrieves all nominations filtered by company name with attendance stats"""
    try:
        company_name = request.args.get('company_name')
        query = PlacementNomination.query

        if company_name and company_name.strip() and company_name.lower() != 'all':
            query = query.filter(PlacementNomination.company_name.ilike(f"%{company_name.strip()}%"))

        nominations = query.order_by(PlacementNomination.id.desc()).all()

        total_invited = len(nominations)
        confirmed_attending = sum(1 for n in nominations if n.status == 'confirmed_attending')
        pending_rsvp = sum(1 for n in nominations if n.status == 'pending')
        declined = sum(1 for n in nominations if n.status == 'rejected')
        placed = sum(1 for n in nominations if n.status == 'placed')

        return jsonify({
            'success': True,
            'stats': {
                'total_invited': total_invited,
                'confirmed_attending': confirmed_attending,
                'pending_rsvp': pending_rsvp,
                'declined': declined,
                'placed': placed
            },
            'nominations': [n.to_dict() for n in nominations]
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to fetch company nominations', 'message': str(e)}), 500


# ==========================================================
# 6. FACULTY: GET AGGREGATED CAMPUS DRIVES SUMMARY
# ==========================================================
@placement_bp.route('/drives-summary', methods=['GET'])
@jwt_required()
@faculty_or_admin_required
def get_campus_drives_summary():
    """Faculty retrieves all company drives with aggregated RSVP & attendance counts"""
    try:
        all_noms = PlacementNomination.query.order_by(PlacementNomination.id.desc()).all()

        # Group by company_name (case-insensitive key, keep original display name)
        drives_map = {}
        for nom in all_noms:
            comp_key = (nom.company_name or 'Unspecified').strip()
            if not comp_key:
                continue

            if comp_key not in drives_map:
                faculty_user = User.query.get(nom.faculty_id) if nom.faculty_id else None
                drives_map[comp_key] = {
                    'company_name': comp_key,
                    'job_role': nom.job_role or 'Software Engineer',
                    'package_lpa': nom.package_lpa,
                    'total_invited': 0,
                    'confirmed_attending': 0,
                    'pending_rsvp': 0,
                    'declined': 0,
                    'placed': 0,
                    'faculty_name': faculty_user.full_name if faculty_user else 'Faculty Coordinator',
                    'last_activity': nom.created_at.isoformat() if nom.created_at else None
                }

            drive = drives_map[comp_key]
            drive['total_invited'] += 1
            if nom.status in ['confirmed_attending', 'accepted']:
                drive['confirmed_attending'] += 1
            elif nom.status == 'pending':
                drive['pending_rsvp'] += 1
            elif nom.status == 'rejected':
                drive['declined'] += 1
            elif nom.status == 'placed':
                drive['placed'] += 1

            if nom.package_lpa and not drive.get('package_lpa'):
                drive['package_lpa'] = nom.package_lpa
            if nom.job_role and not drive.get('job_role'):
                drive['job_role'] = nom.job_role

        drives_list = list(drives_map.values())
        # Sort by most recent activity
        drives_list.sort(key=lambda d: d.get('last_activity') or '', reverse=True)

        return jsonify({
            'success': True,
            'drives': drives_list,
            'total_drives': len(drives_list)
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to fetch campus drives summary', 'message': str(e)}), 500


# ==========================================================
# 7. FACULTY: GET DETAILED ATTENDEES FOR A SPECIFIC COMPANY DRIVE
# ==========================================================
@placement_bp.route('/drives/<path:company_name>/attendees', methods=['GET'])
@jwt_required()
@faculty_or_admin_required
def get_drive_attendees(company_name):
    """Faculty retrieves all candidates shortlisted for a company drive with student profiles & RSVP status"""
    try:
        clean_company = (company_name or '').strip()
        status_filter = request.args.get('status', 'all').strip()

        query = PlacementNomination.query.filter(PlacementNomination.company_name.ilike(clean_company))

        if status_filter and status_filter != 'all':
            if status_filter == 'confirmed':
                query = query.filter(PlacementNomination.status.in_(['confirmed_attending', 'accepted']))
            elif status_filter == 'pending':
                query = query.filter(PlacementNomination.status == 'pending')
            elif status_filter == 'declined':
                query = query.filter(PlacementNomination.status == 'rejected')
            elif status_filter == 'placed':
                query = query.filter(PlacementNomination.status == 'placed')

        nominations = query.order_by(PlacementNomination.id.desc()).all()

        attendees = []
        for nom in nominations:
            student = User.query.get(nom.student_id)
            if not student:
                continue

            latest_resume = Resume.query.filter_by(user_id=student.id).order_by(Resume.id.desc()).first()

            attendees.append({
                'nomination_id': nom.id,
                'status': nom.status,
                'company_name': nom.company_name,
                'job_role': nom.job_role,
                'package_lpa': nom.package_lpa,
                'faculty_notes': nom.faculty_notes,
                'student_response_note': nom.student_response_note,
                'created_at': nom.created_at.isoformat() if nom.created_at else None,
                'updated_at': nom.updated_at.isoformat() if nom.updated_at else None,
                'student': {
                    'id': student.id,
                    'full_name': student.full_name or student.username,
                    'username': student.username,
                    'email': student.email,
                    'phone': student.phone,
                    'department': student.department,
                    'year_of_study': student.year_of_study,
                    'placement_status': student.placement_status,
                    'placed_company': student.placed_company,
                    'package_lpa': student.package_lpa
                },
                'resume': {
                    'has_resume': latest_resume is not None,
                    'id': latest_resume.id if latest_resume else None,
                    'filename': latest_resume.filename if latest_resume else None,
                    'employability_score': latest_resume.employability_score if latest_resume else 0,
                    'skills': latest_resume.skills if latest_resume else []
                }
            })

        # Calculate live stats
        all_for_company = PlacementNomination.query.filter(PlacementNomination.company_name.ilike(clean_company)).all()
        stats = {
            'total_invited': len(all_for_company),
            'confirmed_attending': sum(1 for n in all_for_company if n.status in ['confirmed_attending', 'accepted']),
            'pending_rsvp': sum(1 for n in all_for_company if n.status == 'pending'),
            'declined': sum(1 for n in all_for_company if n.status == 'rejected'),
            'placed': sum(1 for n in all_for_company if n.status == 'placed')
        }

        return jsonify({
            'success': True,
            'company_name': clean_company,
            'stats': stats,
            'attendees': attendees,
            'count': len(attendees)
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to fetch drive attendees', 'message': str(e)}), 500
