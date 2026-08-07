# backend/app/ml_models/fine_tune_skill_extractor.py

import torch
from transformers import (
    AutoTokenizer,
    AutoModelForTokenClassification,
    TrainingArguments,
    Trainer,
    DataCollatorForTokenClassification
)
from datasets import Dataset, load_dataset
import json
import numpy as np
from seqeval.metrics import classification_report

class SkillExtractorTrainer:
    """Fine-tune BERT for skill extraction"""
    
    def __init__(self, model_name="bert-base-uncased"):
        self.model_name = model_name
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForTokenClassification.from_pretrained(
            model_name,
            num_labels=3  # O, B-SKILL, I-SKILL
        )
        self.label_map = {
            0: "O",
            1: "B-SKILL",
            2: "I-SKILL"
        }
    
    def prepare_dataset(self, data_path):
        """Prepare dataset for training"""
        with open(data_path, 'r') as f:
            data = json.load(f)
        
        # Convert to token classification format
        sentences = []
        labels = []
        
        for item in data:
            tokens = item['tokens']
            tags = item['tags']
            sentences.append(tokens)
            labels.append(tags)
        
        # Create dataset
        dataset = Dataset.from_dict({
            'tokens': sentences,
            'tags': labels
        })
        
        # Tokenize
        def tokenize_and_align_labels(examples):
            tokenized_inputs = self.tokenizer(
                examples['tokens'],
                truncation=True,
                padding=True,
                is_split_into_words=True
            )
            
            labels = []
            for i, label in enumerate(examples['tags']):
                word_ids = tokenized_inputs.word_ids(batch_index=i)
                previous_word_idx = None
                label_ids = []
                for word_idx in word_ids:
                    if word_idx is None:
                        label_ids.append(-100)
                    elif word_idx != previous_word_idx:
                        label_ids.append(label[word_idx])
                    else:
                        label_ids.append(-100)
                    previous_word_idx = word_idx
                labels.append(label_ids)
            
            tokenized_inputs['labels'] = labels
            return tokenized_inputs
        
        tokenized_dataset = dataset.map(tokenize_and_align_labels, batched=True)
        
        return tokenized_dataset
    
    def train(self, train_dataset, val_dataset, output_dir='./models/skill_extractor'):
        """Train the model"""
        training_args = TrainingArguments(
            output_dir=output_dir,
            evaluation_strategy="epoch",
            save_strategy="epoch",
            learning_rate=2e-5,
            per_device_train_batch_size=16,
            per_device_eval_batch_size=16,
            num_train_epochs=3,
            weight_decay=0.01,
            load_best_model_at_end=True,
            metric_for_best_model="f1",
            save_total_limit=2
        )
        
        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=val_dataset,
            tokenizer=self.tokenizer,
            data_collator=DataCollatorForTokenClassification(self.tokenizer),
        )
        
        trainer.train()
        trainer.save_model(output_dir)
        self.tokenizer.save_pretrained(output_dir)
        
        print(f"✅ Model saved to {output_dir}")
        return trainer
    
    def evaluate(self, test_dataset):
        """Evaluate model performance"""
        # Implementation...
        pass

# Usage script
if __name__ == "__main__":
    trainer = SkillExtractorTrainer()
    
    # Load data
    train_data = trainer.prepare_dataset('data/training/skill_extraction_train.json')
    val_data = trainer.prepare_dataset('data/training/skill_extraction_val.json')
    
    # Train
    trainer.train(train_data, val_data)
    print("✅ Training complete!")