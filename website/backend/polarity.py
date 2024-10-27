# import pandas as pd
# from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# # Initialize VADER SentimentIntensityAnalyzer
# analyzer = SentimentIntensityAnalyzer()

# # Load the Excel file
# file_path = 'smol.csv'  # Adjust the path if necessary
# data = pd.read_csv(file_path)

# # Check if 'User Input' column exists in the data
# if 'User Input' in data.columns:
#     # Create a new column in the DataFrame to store VADER sentiment analysis results
#     data['VADER Scores'] = data['User Input'].apply(lambda x: analyzer.polarity_scores(str(x)))

#     # Print each row's 'User Input' with its VADER sentiment scores
#     for index, row in data.iterrows():
#         user_input = row['User Input']
#         vader_scores = row['VADER Scores']
#         print(f"{user_input:<65} {vader_scores}")
# else:
#     print("The 'User Input' column is not found in the provided Excel file.")

import pandas as pd
import sys
import json
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

def analyze_sentiments(sentences):
    # Initialize VADER SentimentIntensityAnalyzer
    analyzer = SentimentIntensityAnalyzer()

    # Prepare results
    results = []

    for sentence in sentences:
        score = analyzer.polarity_scores(sentence)
        results.append(score)

    return results

if __name__ == "__main__":
    # Take input sentences from command line arguments
    if len(sys.argv) < 2:
        print("No sentences provided.")
        sys.exit(1)

    # Join the arguments into a single string and split by new line
    input_sentences = sys.argv[1].split('|')
    
    # Analyze the sentiments
    polarity_results = analyze_sentiments(input_sentences)

    # Print the results as JSON
    print(json.dumps(polarity_results))
