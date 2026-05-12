"""
Potato Leaf Disease Detection - Flask Application
Author: AI Agriculture Platform
Description: AI-powered potato leaf disease detection using TensorFlow/Keras
"""

import os
import json
import uuid
import numpy as np
from flask import Flask, request, jsonify, render_template, url_for
from PIL import Image
import io
import base64
import datetime

# Initialize Flask app
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = os.path.join('static', 'uploads')

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# ─────────────────────────────────────────────
# Model Configuration
# ─────────────────────────────────────────────
MODEL_PATH = os.path.join('model', 'potato_model.h5')
CLASS_NAMES = ['Potato Early Blight', 'Potato Late Blight', 'Healthy Potato']
IMG_SIZE = (256, 256)

# Disease information dictionary
DISEASE_INFO = {
    'Potato Early Blight': {
        'description': 'Early blight is caused by the fungus Alternaria solani. It appears as dark brown lesions with concentric rings on older leaves, forming a target-board pattern.',
        'severity': 'Moderate',
        'color': '#f59e0b',
        'icon': '⚠️',
        'symptoms': [
            'Dark brown to black lesions with concentric rings',
            'Yellow halo surrounding the lesions',
            'Lesions primarily on older, lower leaves',
            'Premature defoliation in severe cases'
        ],
        'treatment': [
            'Apply fungicides containing chlorothalonil or mancozeb',
            'Remove and destroy infected plant debris',
            'Ensure proper crop rotation (2-3 year cycle)',
            'Improve air circulation by proper plant spacing',
            'Apply copper-based fungicides as preventive measure'
        ],
        'prevention': [
            'Use certified disease-free seed tubers',
            'Maintain optimal plant nutrition (avoid nitrogen excess)',
            'Irrigate early in the day to allow foliage to dry',
            'Apply preventive fungicide sprays at 7-10 day intervals',
            'Monitor fields regularly for early detection'
        ]
    },
    'Potato Late Blight': {
        'description': 'Late blight is caused by the water mold Phytophthora infestans. It is one of the most destructive potato diseases, responsible for the Irish Potato Famine of the 1840s.',
        'severity': 'High',
        'color': '#ef4444',
        'icon': '🚨',
        'symptoms': [
            'Water-soaked lesions that quickly turn brown-black',
            'White fuzzy growth (sporangia) on leaf undersides',
            'Rapid spread under cool, moist conditions',
            'Dark brown discoloration extends to stems and tubers'
        ],
        'treatment': [
            'Apply systemic fungicides (metalaxyl, cymoxanil) immediately',
            'Remove and destroy all infected plant material',
            'Avoid overhead irrigation to reduce moisture',
            'Apply contact fungicides like chlorothalonil or mancozeb',
            'Harvest tubers quickly if foliage is severely affected'
        ],
        'prevention': [
            'Use resistant potato varieties when available',
            'Apply preventive fungicide programs before disease onset',
            'Monitor weather conditions (cool, moist weather favors spread)',
            'Eliminate volunteer potato plants and nightshade weeds',
            'Ensure proper field drainage to reduce soil moisture'
        ]
    },
    'Healthy Potato': {
        'description': 'Your potato plant appears healthy! The leaves show no signs of disease. Continue with your current care routine to maintain plant health throughout the growing season.',
        'severity': 'None',
        'color': '#10b981',
        'icon': '✅',
        'symptoms': [
            'Vibrant green leaf coloration',
            'No visible lesions or discoloration',
            'Normal leaf structure and texture',
            'Healthy stem and foliage growth'
        ],
        'treatment': [
            'No treatment required - plant is healthy',
            'Continue regular monitoring for early disease detection',
            'Maintain balanced fertilization program',
            'Ensure consistent irrigation practices',
            'Keep records of plant health for future reference'
        ],
        'prevention': [
            'Continue using certified disease-free seed tubers',
            'Maintain proper crop rotation schedule',
            'Apply preventive fungicide program during wet seasons',
            'Monitor neighboring fields for disease spread',
            'Keep detailed growing records for optimization'
        ]
    }
}

# Global model variable
model = None

def load_model():
    """Load the TensorFlow/Keras model lazily on first prediction."""
    global model
    if model is None:
        try:
            import tensorflow as tf
            if os.path.exists(MODEL_PATH):
                model = tf.keras.models.load_model(MODEL_PATH)
                print(f"✅ Model loaded successfully from {MODEL_PATH}")
            else:
                print(f"⚠️  Model file not found at {MODEL_PATH}. Using demo mode.")
                model = None
        except ImportError:
            print("⚠️  TensorFlow not available. Running in demo mode.")
            model = None
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            model = None
    return model


def preprocess_image(image_bytes):
    """Preprocess image for model prediction."""
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        img = img.resize(IMG_SIZE)
        img_array = np.array(img) / 255.0           # Normalize to [0,1]
        img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension
        return img_array
    except Exception as e:
        raise ValueError(f"Image preprocessing failed: {str(e)}")


def predict_disease(image_bytes):
    """Run disease prediction on preprocessed image bytes."""
    ml_model = load_model()

    if ml_model is not None:
        # Real model prediction
        img_array = preprocess_image(image_bytes)
        predictions = ml_model.predict(img_array)
        predicted_class_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_class_idx]) * 100
        predicted_class = CLASS_NAMES[predicted_class_idx]
        all_confidences = {
            CLASS_NAMES[i]: round(float(predictions[0][i]) * 100, 2)
            for i in range(len(CLASS_NAMES))
        }
    else:
        # Demo mode: simulate a prediction
        import random
        predicted_class_idx = random.randint(0, len(CLASS_NAMES) - 1)
        predicted_class = CLASS_NAMES[predicted_class_idx]
        confidence = round(random.uniform(72, 97), 2)
        remaining = 100 - confidence
        split = round(remaining / 2, 2)
        all_confidences = {}
        for i, name in enumerate(CLASS_NAMES):
            if i == predicted_class_idx:
                all_confidences[name] = confidence
            elif len(all_confidences) < len(CLASS_NAMES) - 1:
                all_confidences[name] = round(split, 2)
            else:
                all_confidences[name] = round(remaining - split, 2)

    return predicted_class, confidence, all_confidences


def save_uploaded_image(file_bytes, filename):
    """Save uploaded image to disk and return its URL path."""
    ext = os.path.splitext(filename)[1].lower() or '.jpg'
    unique_name = f"{uuid.uuid4().hex}{ext}"
    save_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_name)
    with open(save_path, 'wb') as f:
        f.write(file_bytes)
    return unique_name, save_path


# ─────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────

@app.route('/')
def home():
    """Render the main application page."""
    return render_template('index.html')


@app.route('/predict', methods=['POST'])
def predict():
    """
    Handle image upload and return disease prediction.
    Accepts: multipart/form-data with 'file' field
    Returns: JSON with prediction, confidence, and disease info
    """
    try:
        # ── Validate file presence ──
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file uploaded'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400

        # ── Validate file type ──
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.bmp'}
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in allowed_extensions:
            return jsonify({
                'success': False,
                'error': f'Invalid file type "{ext}". Please upload JPG, PNG, or WebP images.'
            }), 400

        # ── Read and save the image ──
        file_bytes = file.read()
        if len(file_bytes) == 0:
            return jsonify({'success': False, 'error': 'Uploaded file is empty'}), 400

        unique_name, _ = save_uploaded_image(file_bytes, file.filename)
        image_url = url_for('static', filename=f'uploads/{unique_name}')

        # ── Run prediction ──
        predicted_class, confidence, all_confidences = predict_disease(file_bytes)

        # ── Build response ──
        disease_data = DISEASE_INFO.get(predicted_class, {})
        timestamp = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        response = {
            'success': True,
            'prediction': predicted_class,
            'confidence': round(confidence, 2),
            'all_confidences': all_confidences,
            'image_url': image_url,
            'disease_info': {
                'description': disease_data.get('description', ''),
                'severity': disease_data.get('severity', 'Unknown'),
                'color': disease_data.get('color', '#6b7280'),
                'icon': disease_data.get('icon', '🌿'),
                'symptoms': disease_data.get('symptoms', []),
                'treatment': disease_data.get('treatment', []),
                'prevention': disease_data.get('prevention', [])
            },
            'timestamp': timestamp,
            'model_mode': 'demo' if model is None else 'live'
        }

        return jsonify(response), 200

    except ValueError as ve:
        return jsonify({'success': False, 'error': str(ve)}), 422
    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({'success': False, 'error': 'Internal server error during prediction'}), 500


@app.route('/health')
def health():
    """Health check endpoint for deployment."""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'model_path': MODEL_PATH,
        'timestamp': datetime.datetime.utcnow().isoformat()
    })


# ─────────────────────────────────────────────
# Entry Point
# ─────────────────────────────────────────────

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV', 'production') == 'development'
    print("🌿 Potato Disease Detection App starting...")
    print(f"   Model path : {MODEL_PATH}")
    print(f"   Upload dir : {app.config['UPLOAD_FOLDER']}")
    app.run(host='0.0.0.0', port=port, debug=debug)
