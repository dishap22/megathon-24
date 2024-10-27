# keyword_mapping.py

import pandas as pd
import yake
import sys

def main(input_file, mapping_file, output_file):
    # Load the input data
    data = pd.read_csv(input_file)

    # Load the mapping file
    mapping_data = pd.read_excel(mapping_file)

    if 'Phrase' not in mapping_data.columns or 'Condition' not in mapping_data.columns:
        print("The mapping file must contain 'Phrase' and 'Condition' columns.")
        return

    # Initialize YAKE for keyword extraction
    yake_kw_extractor = yake.KeywordExtractor()

    # Function to map extracted keywords to conditions based on the mapping data
    def map_keywords_to_conditions(keywords):
        conditions = set()
        for kw, score in keywords:
            matched_condition = mapping_data[mapping_data['Phrase'].str.lower() == kw.lower()]['Condition']
            if not matched_condition.empty:
                conditions.add(matched_condition.values[0])
        return ', '.join(conditions) if conditions else 'None'

    # Apply keyword extraction and mapping to each row in the DataFrame
    data['Keywords'] = data['User Input'].apply(lambda x: yake_kw_extractor.extract_keywords(str(x)))
    data['Mapped Condition'] = data['Keywords'].apply(map_keywords_to_conditions)

    # Save results to the output CSV file
    data.to_csv(output_file, index=False)
    print(f"Results saved to {output_file}")

if __name__ == "__main__":
    input_file = sys.argv[1]
    mapping_file = sys.argv[2]
    output_file = sys.argv[3]
    main(input_file, mapping_file, output_file)
