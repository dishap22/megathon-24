import torch
import librosa
from transformers import Speech2TextProcessor, Speech2TextForConditionalGeneration, pipeline
from deepmultilingualpunctuation import PunctuationModel
import csv
import sys

print("heheheheheheheheheheh")

# def get_sentences():
# Load the pretrained model and processor
model = Speech2TextForConditionalGeneration.from_pretrained("facebook/s2t-small-librispeech-asr")
processor = Speech2TextProcessor.from_pretrained("facebook/s2t-small-librispeech-asr")

# Load your custom audio file
audio_file_path = sys[1]
speech_array, original_sampling_rate = librosa.load(audio_file_path, sr=None)

# Resample to 16,000 Hz if necessary
target_sampling_rate = 16000
if original_sampling_rate != target_sampling_rate:
    speech_array = librosa.resample(speech_array, orig_sr=original_sampling_rate, target_sr=target_sampling_rate)

# Process the audio data for the model
inputs = processor(speech_array, sampling_rate=target_sampling_rate, return_tensors="pt")

# Generate transcription
generated_ids = model.generate(inputs["input_features"], attention_mask=inputs["attention_mask"])

# Decode the transcription
transcription = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
print("Transcription:", transcription)

# Break the transcription into sentences
punctuation_model = PunctuationModel()
punctuated_text = punctuation_model.restore_punctuation(transcription)
sentences = punctuated_text.split(". ")

filename = "smol.csv"
with open(filename, "w", newline="") as file:
    writer = csv.writer(file)
    for sentence in sentences:
        writer.writerow([sentence])
