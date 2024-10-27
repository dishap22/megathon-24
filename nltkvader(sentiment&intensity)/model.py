import pandas as pd
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

analyzer = SentimentIntensityAnalyzer()

file_path = 'smol.csv'  
data = pd.read_csv(file_path)

if 'User Input' in data.columns:
    data['VADER Scores'] = data['User Input'].apply(lambda x: analyzer.polarity_scores(str(x)))
    
    for index, row in data.iterrows():
        user_input = row['User Input']
        vader_scores = row['VADER Scores']
        print(f"{user_input:<65} {vader_scores}")
        filtered_scores = {key: value for key, value in vader_scores.items() if key != 'compound'}
        highest_sentiment = max(filtered_scores, key=filtered_scores.get)
        compound_score = abs(vader_scores['compound'])
        intensity_on_scale = round(compound_score * 10)
        if (intensity_on_scale > 10): intensity_on_scale = 10
        if (intensity_on_scale < 0): intensity_on_scale = 0
        print(f"{user_input:<65} Polarity: {highest_sentiment.capitalize()}, Intensity: {intensity_on_scale}")
else:
    print("The 'User Input' column is not found in the provided Excel file.")
