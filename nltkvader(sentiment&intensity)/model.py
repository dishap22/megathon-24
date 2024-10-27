import pandas as pd
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

analyzer = SentimentIntensityAnalyzer()

file_path = 'smol.xlsx'  
data = pd.read_excel(file_path)

if 'User Input' in data.columns:
    data['VADER Scores'] = data['User Input'].apply(lambda x: analyzer.polarity_scores(str(x)))
    
    for index, row in data.iterrows():
        user_input = row['User Input']
        vader_scores = row['VADER Scores']
        print(f"{user_input:<65} {vader_scores}")
else:
    print("The 'User Input' column is not found in the provided Excel file.")
