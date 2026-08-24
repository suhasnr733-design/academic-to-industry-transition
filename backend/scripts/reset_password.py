import os
import sys

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
root_dir = os.path.dirname(backend_dir)
sys.path.insert(0, backend_dir)
sys.path.insert(0, root_dir)

from app import create_app, db
from app.models import User

def reset_password(identifier, new_password):
    app = create_app('app.config.DevelopmentConfig')
    with app.app_context():
        user = User.query.filter(
            (User.username == identifier) | (User.email == identifier)
        ).first()
        if not user:
            print(f"User '{identifier}' not found.")
            return False
        user.set_password(new_password)
        db.session.commit()
        print(f"Successfully updated password for user '{user.username}' ({user.email}).")
        return True

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python reset_password.py <email_or_username> <new_password>")
        sys.exit(1)
    ident = sys.argv[1]
    pwd = sys.argv[2]
    reset_password(ident, pwd)
