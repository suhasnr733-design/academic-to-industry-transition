# backend/app/services/skill_graph_enhanced.py

import networkx as nx
import json
import pandas as pd
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class EnhancedSkillGraph:
    """Enhanced skill knowledge graph with relationships"""
    
    def __init__(self):
        self.graph = nx.DiGraph()
        self.skill_data = {}
        self.load_skills()
        self.build_graph()
        logger.info("✅ Enhanced skill graph initialized")
    
    def load_skills(self):
        """Load skill data from multiple sources"""
        # Load from database or file
        self.skill_data = {
            'Python': {
                'category': 'Programming',
                'level': 'Advanced',
                'prerequisites': ['Programming Basics'],
                'related_skills': ['Java', 'JavaScript', 'SQL'],
                'industries': ['Software Development', 'Data Science', 'AI/ML'],
                'certifications': ['PCEP', 'PCAP']
            },
            'Machine Learning': {
                'category': 'AI/ML',
                'level': 'Advanced',
                'prerequisites': ['Python', 'Statistics', 'Linear Algebra'],
                'related_skills': ['Deep Learning', 'NLP', 'Data Science'],
                'industries': ['AI/ML', 'Data Science'],
                'certifications': ['Google ML Engineer', 'AWS ML Specialty']
            },
            'React': {
                'category': 'Web Development',
                'level': 'Intermediate',
                'prerequisites': ['JavaScript', 'HTML', 'CSS'],
                'related_skills': ['Angular', 'Vue.js', 'Node.js'],
                'industries': ['Web Development', 'Frontend Development'],
                'certifications': ['React Developer Certificate']
            },
            'AWS': {
                'category': 'Cloud Computing',
                'level': 'Intermediate',
                'prerequisites': ['Linux', 'Networking'],
                'related_skills': ['Azure', 'GCP', 'Docker'],
                'industries': ['Cloud/DevOps', 'Infrastructure'],
                'certifications': ['AWS Solutions Architect', 'AWS Developer']
            },
            'Docker': {
                'category': 'DevOps',
                'level': 'Intermediate',
                'prerequisites': ['Linux', 'Virtualization'],
                'related_skills': ['Kubernetes', 'Jenkins', 'Ansible'],
                'industries': ['DevOps', 'Cloud'],
                'certifications': ['Docker Certified']
            }
        }
    
    def build_graph(self):
        """Build knowledge graph"""
        # Add skill nodes
        for skill, attributes in self.skill_data.items():
            self.graph.add_node(
                skill,
                category=attributes.get('category', 'Unknown'),
                level=attributes.get('level', 'Beginner'),
                industries=attributes.get('industries', []),
                certifications=attributes.get('certifications', [])
            )
        
        # Add relationships
        for skill, attributes in self.skill_data.items():
            # Prerequisites
            for prereq in attributes.get('prerequisites', []):
                if prereq in self.skill_data:
                    self.graph.add_edge(prereq, skill, type='prerequisite')
            
            # Related skills (bidirectional)
            for related in attributes.get('related_skills', []):
                if related in self.skill_data:
                    self.graph.add_edge(skill, related, type='related')
                    self.graph.add_edge(related, skill, type='related')
    
    def get_skill_info(self, skill: str) -> Dict[str, Any]:
        """Get detailed information about a skill"""
        if skill not in self.graph:
            return None
        
        node_attrs = self.graph.nodes[skill]
        
        # Get prerequisites
        prerequisites = []
        for pred in self.graph.predecessors(skill):
            if self.graph.edges[pred, skill].get('type') == 'prerequisite':
                prerequisites.append(pred)
        
        # Get related skills
        related_skills = []
        for neighbor in self.graph.neighbors(skill):
            if self.graph.edges[skill, neighbor].get('type') == 'related':
                related_skills.append(neighbor)
        
        # Get dependent skills (skills that need this as prerequisite)
        dependent_skills = []
        for node in self.graph.nodes:
            for pred in self.graph.predecessors(node):
                if pred == skill and self.graph.edges[pred, node].get('type') == 'prerequisite':
                    dependent_skills.append(node)
        
        return {
            'name': skill,
            'category': node_attrs.get('category', 'Unknown'),
            'level': node_attrs.get('level', 'Beginner'),
            'prerequisites': prerequisites,
            'related_skills': related_skills,
            'dependent_skills': dependent_skills,
            'industries': node_attrs.get('industries', []),
            'certifications': node_attrs.get('certifications', [])
        }
    
    def get_learning_path(self, target_skill: str, current_skills: List[str]) -> Dict[str, Any]:
        """Get complete learning path"""
        if target_skill not in self.graph:
            return {'error': 'Skill not found'}
        
        # Get prerequisites recursively
        all_prerequisites = []
        def get_all_prerequisites(skill):
            info = self.get_skill_info(skill)
            if info and info['prerequisites']:
                for prereq in info['prerequisites']:
                    if prereq not in all_prerequisites and prereq not in current_skills:
                        all_prerequisites.append(prereq)
                        get_all_prerequisites(prereq)
        
        get_all_prerequisites(target_skill)
        
        # Also include related skills
        related_skills = []
        info = self.get_skill_info(target_skill)
        if info:
            related_skills = info['related_skills'][:3]
        
        # Determine gaps
        missing_prerequisites = [s for s in all_prerequisites if s not in current_skills]
        
        # Build learning path
        learning_path = {
            'target_skill': target_skill,
            'current_skills': current_skills,
            'missing_prerequisites': missing_prerequisites,
            'recommended_order': missing_prerequisites + [target_skill],
            'related_skills': related_skills,
            'estimated_time': f"{len(missing_prerequisites) + 1} weeks"
        }
        
        return learning_path
    
    def suggest_career_path(self, skills: List[str]) -> Dict[str, Any]:
        """Suggest career path based on skills"""
        # Get industries
        industries = set()
        for skill in skills:
            if skill in self.skill_data:
                for industry in self.skill_data[skill].get('industries', []):
                    industries.add(industry)
        
        # Get skills to develop
        recommended_skills = []
        for skill in skills:
            info = self.get_skill_info(skill)
            if info:
                recommended_skills.extend(info['related_skills'])
                recommended_skills.extend(info['dependent_skills'])
        
        # Remove duplicates and existing skills
        recommended_skills = list(set(recommended_skills) - set(skills))[:5]
        
        return {
            'possible_industries': list(industries),
            'recommended_skills': recommended_skills,
            'current_skills_count': len(skills),
            'recommended_actions': [
                f"Learn {s}" for s in recommended_skills[:3]
            ]
        }