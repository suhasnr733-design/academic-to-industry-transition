# scripts/train_and_export_model.py

import os
import sys
import json
import pathlib
import pandas as pd
import numpy as np
import joblib

# Ensure root is in sys.path
root_dir = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, StackingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, f1_score

def main():
    print("=" * 60)
    print("STARTING MODEL TRAINING & PIPELINE GENERATION")
    print("=" * 60)
    
    # 1. Create data directories
    dirs = ['data/raw', 'data/processed', 'data/curated', 'data/logs', 'data/models']
    for d in dirs:
        os.makedirs(os.path.join(root_dir, d), exist_ok=True)
    print("Directories created.")

    # 2. Generate Synthetic Student Data
    np.random.seed(42)
    departments = ['Computer Science', 'Information Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical']
    skills_pool = ['Python', 'Java', 'C++', 'SQL', 'HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Machine Learning', 'Deep Learning', 'NLP', 'AWS', 'Docker', 'Git', 'Linux', 'MySQL', 'MongoDB', 'Django']

    data = []
    for i in range(1000):
        skill_count = np.random.randint(3, 12)
        skills = np.random.choice(skills_pool, skill_count, replace=False).tolist()
        cgpa = round(np.random.uniform(5.0, 9.8), 2)
        internships = np.random.randint(0, 8)
        projects = np.random.randint(0, 6)
        certifications = np.random.randint(0, 5)
        workshops = np.random.randint(0, 10)
        placed = 1 if (cgpa > 7.0 and skill_count >= 5 and internships > 0) or (cgpa > 8.0 and projects >= 2) else np.random.choice([0, 1], p=[0.7, 0.3])
        
        student = {
            'student_id': f'STU{i+1:04d}',
            'department': np.random.choice(departments),
            'year_of_study': np.random.choice([3, 4], p=[0.3, 0.7]),
            'cgpa': cgpa,
            'skill_count': skill_count,
            'skills': skills,
            'internship_months': internships,
            'projects': projects,
            'certifications': certifications,
            'workshops': workshops,
            'placed': placed
        }
        data.append(student)

    df_students = pd.DataFrame(data)
    raw_path = os.path.join(root_dir, 'data/raw/student_data_synthetic.csv')
    cleaned_path = os.path.join(root_dir, 'data/processed/student_data_cleaned.csv')
    df_students.to_csv(raw_path, index=False)
    df_students.to_csv(cleaned_path, index=False)
    print(f"Saved raw & cleaned student data: {df_students.shape}")

    # Generate sample courses data & jobs data
    courses_data = [
        {'title': 'Python for Data Science', 'platform': 'Coursera', 'skills': ['Python', 'Data Science', 'Pandas'], 'rating': 4.8},
        {'title': 'Full Stack Web Development', 'platform': 'Udemy', 'skills': ['JavaScript', 'React', 'Node.js'], 'rating': 4.7},
        {'title': 'Machine Learning A-Z', 'platform': 'Coursera', 'skills': ['Python', 'Machine Learning', 'Scikit-Learn'], 'rating': 4.9},
        {'title': 'SQL & Database Design', 'platform': 'edX', 'skills': ['SQL', 'MySQL', 'Database'], 'rating': 4.6},
        {'title': 'AWS Certified Cloud Practitioner', 'platform': 'Udemy', 'skills': ['AWS', 'Cloud', 'DevOps'], 'rating': 4.8}
    ]
    df_courses = pd.DataFrame(courses_data)
    df_courses.to_csv(os.path.join(root_dir, 'data/processed/courses_cleaned.csv'), index=False)
    
    jobs_data = [
        {'title': 'Software Engineer', 'company': 'Google', 'skills': ['Python', 'Java', 'SQL'], 'domain': 'Software Engineering'},
        {'title': 'Data Scientist', 'company': 'Microsoft', 'skills': ['Python', 'Machine Learning', 'Pandas'], 'domain': 'Data Science'},
        {'title': 'Frontend Developer', 'company': 'Amazon', 'skills': ['JavaScript', 'React', 'CSS'], 'domain': 'Frontend'}
    ]
    df_jobs = pd.DataFrame(jobs_data)
    df_jobs.to_csv(os.path.join(root_dir, 'data/processed/jobs_cleaned.csv'), index=False)
    print("Saved courses_cleaned.csv and jobs_cleaned.csv")

    # 3. Feature Engineering
    df_feat = df_students.copy()
    df_feat['skill_diversity'] = df_feat['skills'].apply(lambda x: len(set(x)) if isinstance(x, list) else 0)
    df_feat['total_experience'] = df_feat['internship_months'] + df_feat['projects'] * 2
    df_feat['cgpa_normalized'] = df_feat['cgpa'] / 10.0
    df_feat['certification_score'] = df_feat['certifications'] * 2 + df_feat['workshops'] * 1
    df_feat['skill_cgpa_ratio'] = df_feat['skill_count'] / (df_feat['cgpa'] + 1.0)
    df_feat['exp_skill_ratio'] = df_feat['total_experience'] / (df_feat['skill_count'] + 1.0)

    le = LabelEncoder()
    df_feat['department_encoded'] = le.fit_transform(df_feat['department'])

    engineered_path = os.path.join(root_dir, 'data/processed/student_data_engineered.csv')
    df_feat.to_csv(engineered_path, index=False)
    print("Feature engineering completed.")

    # 4. Feature Selection and Model Training
    feature_columns = [
        'cgpa', 'skill_count', 'skill_diversity', 'internship_months', 
        'projects', 'certifications', 'workshops', 'total_experience',
        'cgpa_normalized', 'certification_score', 'skill_cgpa_ratio',
        'exp_skill_ratio', 'department_encoded'
    ]

    X = df_feat[feature_columns]
    y = df_feat['placed']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Base models
    rf = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    rf.fit(X_train_scaled, y_train)

    gb = GradientBoostingClassifier(n_estimators=100, max_depth=5, random_state=42)
    gb.fit(X_train_scaled, y_train)

    svc = SVC(kernel='rbf', probability=True, random_state=42)
    svc.fit(X_train_scaled, y_train)

    # Stacking Classifier
    estimators = [
        ('rf', rf),
        ('gb', gb),
        ('svm', svc)
    ]
    stacking_model = StackingClassifier(
        estimators=estimators,
        final_estimator=LogisticRegression(),
        cv=5
    )
    stacking_model.fit(X_train_scaled, y_train)

    y_pred = stacking_model.predict(X_test_scaled)
    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)

    print(f"Stacking Ensemble Accuracy: {acc:.4f}, F1 Score: {f1:.4f}")

    # 5. Export Model Artifacts
    models_dir = os.path.join(root_dir, 'data/models')
    joblib.dump(stacking_model, os.path.join(models_dir, 'ensemble_model.pkl'))
    joblib.dump(scaler, os.path.join(models_dir, 'scaler.pkl'))
    joblib.dump(feature_columns, os.path.join(models_dir, 'feature_columns.pkl'))
    joblib.dump(rf, os.path.join(models_dir, 'best_rf.pkl'))
    joblib.dump(gb, os.path.join(models_dir, 'best_xgb.pkl'))

    print("Model artifacts successfully saved to data/models/")
    print("SUCCESS: Model training and pipeline export complete!")

if __name__ == '__main__':
    main()
