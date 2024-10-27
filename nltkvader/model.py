import pandas as pd
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# Initialize VADER SentimentIntensityAnalyzer
analyzer = SentimentIntensityAnalyzer()

# Load the Excel file
file_path = 'smol.xlsx'  # Adjust the path if necessary
data = pd.read_excel(file_path)

# Check if 'User Input' column exists in the data
if 'User Input' in data.columns:
    # Create a new column in the DataFrame to store VADER sentiment analysis results
    data['VADER Scores'] = data['User Input'].apply(lambda x: analyzer.polarity_scores(str(x)))

    # Print each row's 'User Input' with its VADER sentiment scores
    for index, row in data.iterrows():
        user_input = row['User Input']
        vader_scores = row['VADER Scores']
        print(f"{user_input:<65} {vader_scores}")
else:
    print("The 'User Input' column is not found in the provided Excel file.")
