# Import libraries
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, mean_squared_error
from transformers import pipeline
import spacy
import numpy as np

# Load data
data = pd.read_csv('mental_health_dataset.csv')

# Map categories to numeric labels for the classification task
data['Category_Label'] = data['Category'].astype('category').cat.codes

# Split data into train and test sets for each task
train_data, test_data = train_test_split(data, test_size=0.2, random_state=42)

# 1. Polarity Detection
print("Setting up Polarity Detection...")
sentiment_analyzer = pipeline("sentiment-analysis")
test_data['Predicted_Polarity'] = test_data['User Input'].apply(lambda x: sentiment_analyzer(x)[0]['label'])
polarity_accuracy = accuracy_score(test_data['Polarity'], test_data['Predicted_Polarity'])
print(f"Polarity Detection Accuracy: {polarity_accuracy}")

# 2. Concern Extraction (NER) using spaCy
print("Training NER for Concern Extraction...")
nlp = spacy.blank("en")
ner = nlp.add_pipe("ner", last=True)
for label in train_data['Extracted Concern'].unique():
    ner.add_label(label)

def train_ner(data, nlp):
    for _, row in data.iterrows():
        doc = nlp.make_doc(row['User Input'])
        example = spacy.training.Example.from_dict(doc, {"entities": [(row['User Input'].index(row['Extracted Concern']),
                                                                      row['User Input'].index(row['Extracted Concern']) + len(row['Extracted Concern']), 
                                                                      "CONCERN")]})
        nlp.update([example])
    return nlp

nlp = train_ner(train_data, nlp)

def extract_concern(text, model):
    doc = model(text)
    return [(ent.text, ent.label_) for ent in doc.ents]

test_data['Predicted_Concern'] = test_data['User Input'].apply(lambda x: extract_concern(x, nlp))

# 3. Concern Classification using Logistic Regression
print("Training Concern Classifier...")
vectorizer = TfidfVectorizer()
X_train_class = vectorizer.fit_transform(train_data['Extracted Concern'])
y_train_class = train_data['Category_Label']
X_test_class = vectorizer.transform(test_data['Extracted Concern'])

classifier = LogisticRegression()
classifier.fit(X_train_class, y_train_class)
test_data['Predicted_Category_Label'] = classifier.predict(X_test_class)
test_data['Predicted_Category'] = test_data['Predicted_Category_Label'].apply(
    lambda x: data['Category'].astype('category').cat.categories[x])

classification_accuracy = accuracy_score(test_data['Category'], test_data['Predicted_Category'])
print(f"Concern Classification Accuracy: {classification_accuracy}")

# 4. Intensity Scoring with RandomForest Regressor
print("Training Intensity Scoring Model...")
X_train_intensity = vectorizer.fit_transform(train_data['User Input'])
y_train_intensity = train_data['Intensity']
X_test_intensity = vectorizer.transform(test_data['User Input'])

regressor = RandomForestRegressor()
regressor.fit(X_train_intensity, y_train_intensity)
test_data['Predicted_Intensity'] = regressor.predict(X_test_intensity)

intensity_rmse = np.sqrt(mean_squared_error(test_data['Intensity'], test_data['Predicted_Intensity']))
print(f"Intensity Scoring RMSE: {intensity_rmse}")

# Save the predictions to a new CSV file
output_file = "mental_health_predictions.csv"
test_data[['User Input', 'Polarity', 'Predicted_Polarity', 'Extracted Concern', 'Predicted_Concern',
           'Category', 'Predicted_Category', 'Intensity', 'Predicted_Intensity']].to_csv(output_file, index=False)
print(f"Predictions saved to {output_file}")

# Summary of results
print("\nSummary of Results:")
print(f"Polarity Detection Accuracy: {polarity_accuracy}")
print(f"Concern Classification Accuracy: {classification_accuracy}")
print(f"Intensity Scoring RMSE: {intensity_rmse}")
