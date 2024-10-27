import pandas as pd
import yake

file_path = 'smol.xlsx'
data = pd.read_excel(file_path)

if 'User Input' in data.columns:
    yake_kw_extractor = yake.KeywordExtractor()

    data['Keywords'] = data['User Input'].apply(lambda x: yake_kw_extractor.extract_keywords(str(x)))

    for index, row in data.iterrows():
        user_input = row['User Input']
        extracted_keywords = row['Keywords']
        print(f"User Input: {user_input}\nKeywords: {extracted_keywords}\n")
else:
    print("The 'User Input' column is not found in the provided Excel file.")
