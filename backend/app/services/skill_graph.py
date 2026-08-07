# backend/app/services/skill_graph.py

import networkx as nx
import json
from typing import List, Dict

class SkillKnowledgeGraph:
    """Skill relationship knowledge graph"""
    
    def __init__(self):
        self.graph = nx.DiGraph()
        self.load_skills()
    
    def load_skills(self):
        """Load skill relationships"""
        # Add skill nodes
        skills = {
            'Python': {'category': 'Programming', 'level': 'Advanced'},
            'Java': {'category': 'Programming', 'level': 'Advanced'},
            'SQL': {'category': 'Database', 'level': 'Intermediate'},
            'Machine Learning': {'category': 'AI/ML', 'level': 'Advanced'},
            'Deep Learning': {'category': 'AI/ML', 'level': 'Advanced'},
            'React': {'category': 'Web', 'level': 'Intermediate'},
            'Docker': {'category': 'DevOps', 'level': 'Intermediate'},
            'AWS': {'category': 'Cloud', 'level': 'Intermediate'},
            'Git': {'category': 'Tools', 'level': 'Basic'},
            'Data Structures': {'category': 'Core CS', 'level': 'Advanced'},
            'Algorithms': {'category': 'Core CS', 'level': 'Advanced'},
        }
        
        for skill, attrs in skills.items():
            self.graph.add_node(skill, **attrs)
        
        # Add relationships (prerequisites)
        prerequisites = [
            ('Python', 'Data Structures'),
            ('Java', 'Data Structures'),
            ('Machine Learning', 'Python'),
            ('Deep Learning', 'Machine Learning'),
            ('React', 'JavaScript'),
            ('Docker', 'Linux'),
            ('AWS', 'Linux'),
        ]
        
        for prereq, skill in prerequisites:
            self.graph.add_edge(prereq, skill, relation='prerequisite')
    
    def get_prerequisites(self, skill: str) -> List[str]:
        """Get prerequisites for a skill"""
        if skill not in self.graph:
            return []
        
        prereqs = []
        for pred in self.graph.predecessors(skill):
            if self.graph.edges[pred, skill].get('relation') == 'prerequisite':
                prereqs.append(pred)
        
        return prereqs
    
    def get_related_skills(self, skill: str) -> List[str]:
        """Get related skills"""
        if skill not in self.graph:
            return []
        
        related = []
        # Get all neighbors
        neighbors = list(self.graph.neighbors(skill))
        for n in neighbors:
            related.append(n)
        
        # Get predecessors
        for pred in self.graph.predecessors(skill):
            if pred not in related:
                related.append(pred)
        
        return related
    
    def get_learning_path(self, target_skill: str, current_skills: List[str]) -> List[str]:
        """Get learning path to target skill"""
        # BFS from current skills to target
        visited = set()
        queue = [(skill, [skill]) for skill in current_skills if skill in self.graph]
        
        while queue:
            skill, path = queue.pop(0)
            
            if skill == target_skill:
                return path
            
            if skill not in visited:
                visited.add(skill)
                for neighbor in self.graph.neighbors(skill):
                    if neighbor not in visited:
                        queue.append((neighbor, path + [neighbor]))
        
        return []
    
    def skill_gap_analysis(self, current_skills: List[str], target_skills: List[str]) -> Dict:
        """Analyze skill gaps with prerequisites"""
        analysis = {
            'missing_skills': [],
            'prerequisites_needed': [],
            'learning_path': []
        }
        
        for target in target_skills:
            if target not in current_skills:
                analysis['missing_skills'].append(target)
                
                # Get prerequisites
                prereqs = self.get_prerequisites(target)
                for prereq in prereqs:
                    if prereq not in current_skills and prereq not in analysis['prerequisites_needed']:
                        analysis['prerequisites_needed'].append(prereq)
        
        # Generate learning path
        all_needed = analysis['missing_skills'] + analysis['prerequisites_needed']
        for skill in all_needed:
            path = self.get_learning_path(skill, current_skills)
            if path:
                analysis['learning_path'].extend(path)
        
        analysis['learning_path'] = list(dict.fromkeys(analysis['learning_path']))
        
        return analysis