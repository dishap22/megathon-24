# Required imports
import tensorflow as tf
import numpy as np
from transformers import BertTokenizer, TFBertModel, TFDistilBertModel, TFRobertaModel
from tensorflow.keras.saving import register_keras_serializable

# Define BertLayer with @register_keras_serializable decorator
@register_keras_serializable()
class BertLayer(tf.keras.layers.Layer):
    def __init__(self, model_name="bert", **kwargs):
        super().__init__(**kwargs)
        if model_name == "bert":
            self.bert = TFBertModel.from_pretrained("bert-base-uncased", output_hidden_states=False)
        elif model_name == "distilbert":
            self.bert = TFDistilBertModel.from_pretrained("distilbert-base-uncased", output_hidden_states=False)
        elif model_name == "roberta":
            self.bert = TFRobertaModel.from_pretrained("roberta-base", output_hidden_states=False)
        else:
            raise ValueError(f"Unsupported model name: {model_name}")
        self.bert.trainable = False

    def call(self, inputs):
        input_ids, attention_mask = inputs
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask, training=False)
        return outputs[0]

# Load the saved model
model = tf.keras.models.load_model('final_model.keras', custom_objects={"BertLayer": BertLayer})
print("Model loaded successfully.")

# Initialize tokenizer
tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")

# Sample sentence for testing
test_sentence = "i want to kill myself immediately"

# Preprocess input text
max_len = 64  # Ensure this matches the length used during training
encoding = tokenizer(
    test_sentence,
    padding='max_length',
    truncation=True,
    max_length=max_len,
    return_tensors='tf'
)

# Extract input IDs and attention mask
input_ids = encoding['input_ids']
attention_mask = encoding['attention_mask']

# Run prediction
predictions = model([input_ids, attention_mask])

# Extract predictions
polarity_pred = np.argmax(predictions[0], axis=-1)
category_pred = np.argmax(predictions[1], axis=-1)
intensity_pred = predictions[2]

# Assuming you have defined mappings for polarity and category
polarity_mapping = {0: 'Negative', 1: 'Neutral', 2: 'Positive'}  # Update based on your actual mapping
category_mapping = {0: 'Category1', 1: 'Category2', 2: 'Category3', 3: 'Category4'}  # Update based on your actual mapping

# Print results with better readability
print(f"Input Sentence: \"{test_sentence}\"")
print(f"Predicted Polarity: {polarity_mapping.get(polarity_pred[0], 'Unknown')}")
print(f"Predicted Category: {category_mapping.get(category_pred[0], 'Unknown')}")
print(f"Predicted Intensity: {intensity_pred[0][0]:.4f}")  # Format intensity to 4 decimal places
