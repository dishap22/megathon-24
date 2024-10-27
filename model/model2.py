import os
import pandas as pd
import numpy as np
import tensorflow as tf
from transformers import BertTokenizer, TFBertModel
from sklearn.model_selection import train_test_split
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping

# Enable mixed precision
tf.keras.mixed_precision.set_global_policy('mixed_float16')

def load_and_preprocess_data(file_path, max_len=64):
    # Read the Excel file
    df = pd.read_excel(file_path)
    
    # Extract columns
    user_input = df['User Input']
    polarity = df['Polarity']
    category = df['Category']
    intensity = df['Intensity']
    
    # Initialize the tokenizer
    tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
    
    # Tokenize all texts
    encodings = tokenizer(
        user_input.tolist(),
        padding='max_length',
        truncation=True,
        max_length=max_len,
        return_tensors='tf'
    )
    
    # Convert to numpy arrays
    input_ids = encodings['input_ids'].numpy()
    attention_masks = encodings['attention_mask'].numpy()
    
    # Create label mappings
    polarity_mapping = {'Negative': 0, 'Neutral': 1, 'Positive': 2}
    category_mapping = {cat: idx for idx, cat in enumerate(category.unique())}
    
    # Convert labels
    polarity_int = polarity.map(polarity_mapping)
    polarity_encoded = to_categorical(polarity_int, num_classes=len(polarity_mapping))
    category_int = category.map(category_mapping)
    category_encoded = to_categorical(category_int, num_classes=len(category_mapping))
    intensity_values = intensity.values.reshape(-1, 1)
    
    return (input_ids, attention_masks, polarity_encoded, category_encoded, 
            intensity_values, polarity_mapping, category_mapping)

def create_model(max_len, num_polarity_classes, num_category_classes):
    # Initialize BERT with output_hidden_states=False to save memory
    bert_model = TFBertModel.from_pretrained("bert-base-uncased", output_hidden_states=False)
    
    # Make BERT layers non-trainable to prevent OOM
    bert_model.trainable = False
    
    # Input layers
    input_ids = tf.keras.layers.Input(shape=(max_len,), dtype=tf.int32, name="input_ids")
    attention_mask = tf.keras.layers.Input(shape=(max_len,), dtype=tf.int32, name="attention_mask")
    
    # Get BERT embeddings
    bert_output = bert_model(input_ids, attention_mask=attention_mask)[0]  # Use only last hidden state
    
    # Pooling strategy: Use [CLS] token output (first token)
    cls_token = bert_output[:, 0, :]
    
    # Shared layers with dropout for regularization
    x = tf.keras.layers.Dense(512, activation='relu')(cls_token)
    x = tf.keras.layers.Dropout(0.2)(x)
    x = tf.keras.layers.Dense(256, activation='relu')(x)
    x = tf.keras.layers.Dropout(0.1)(x)
    
    # Task-specific layers
    polarity_output = tf.keras.layers.Dense(
        num_polarity_classes, 
        activation='softmax', 
        name="polarity"
    )(x)
    
    category_output = tf.keras.layers.Dense(
        num_category_classes, 
        activation='softmax', 
        name="category"
    )(x)
    
    intensity_output = tf.keras.layers.Dense(
        1, 
        activation='sigmoid',  # Assuming intensity is normalized between 0 and 1
        name="intensity"
    )(x)
    
    # Create model
    model = tf.keras.Model(
        inputs=[input_ids, attention_mask],
        outputs=[polarity_output, category_output, intensity_output]
    )
    
    # Compile model with custom loss weights
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
        loss={
            'polarity': 'categorical_crossentropy',
            'category': 'categorical_crossentropy',
            'intensity': 'mse'
        },
        loss_weights={
            'polarity': 1.0,
            'category': 1.0,
            'intensity': 0.5
        },
        metrics={
            'polarity': 'accuracy',
            'category': 'accuracy',
            'intensity': 'mae'
        }
    )
    
    return model

def train_model(model, train_data, val_data, batch_size=16, epochs=5):
    # Unpack training and validation data
    (train_input_ids, train_attention_masks, train_polarity, 
     train_category, train_intensity) = train_data
    (val_input_ids, val_attention_masks, val_polarity, 
     val_category, val_intensity) = val_data
    
    # Callbacks
    callbacks = [
        ModelCheckpoint(
            filepath="best_model.h5",
            save_best_only=True,
            monitor='val_loss',
            mode='min',
            verbose=1
        ),
        EarlyStopping(
            monitor='val_loss',
            patience=2,
            mode='min',
            verbose=1,
            restore_best_weights=True
        )
    ]
    
    # Train model
    history = model.fit(
        [train_input_ids, train_attention_masks],
        {
            'polarity': train_polarity,
            'category': train_category,
            'intensity': train_intensity
        },
        validation_data=(
            [val_input_ids, val_attention_masks],
            {
                'polarity': val_polarity,
                'category': val_category,
                'intensity': val_intensity
            }
        ),
        epochs=epochs,
        batch_size=batch_size,
        callbacks=callbacks
    )
    
    return history

# Main execution
if __name__ == "__main__":
    # Configuration
    MAX_LEN = 64
    BATCH_SIZE = 16
    EPOCHS = 5
    
    # Load and preprocess data
    file_path = os.path.join(os.getcwd(), "mental_health_dataset.csv")
    (input_ids, attention_masks, polarity_encoded, category_encoded, 
     intensity_values, polarity_mapping, category_mapping) = load_and_preprocess_data(file_path, MAX_LEN)
    
    # Split data
    (train_input_ids, val_input_ids, 
     train_attention_masks, val_attention_masks,
     train_polarity, val_polarity,
     train_category, val_category,
     train_intensity, val_intensity) = train_test_split(
        input_ids, attention_masks, polarity_encoded,
        category_encoded, intensity_values,
        test_size=0.2, random_state=42
    )
    
    # Create and train model
    model = create_model(
        MAX_LEN, 
        len(polarity_mapping), 
        len(category_mapping)
    )
    
    train_data = (train_input_ids, train_attention_masks, train_polarity, 
                  train_category, train_intensity)
    val_data = (val_input_ids, val_attention_masks, val_polarity, 
                val_category, val_intensity)
    
    history = train_model(
        model, 
        train_data, 
        val_data, 
        BATCH_SIZE, 
        EPOCHS
    )