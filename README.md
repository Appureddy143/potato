# 🌿 AgriSense AI — Potato Leaf Disease Detection

AI-powered web app to detect potato leaf diseases using TensorFlow/Keras and Flask.

## 🚀 Quick Start (Local)

```bash
cd potato-disease-app
pip install -r requirements.txt
# Place your model at model/potato_model.h5
python app.py
# Open http://localhost:5000
```

## 🐳 Docker

```bash
docker build -t agrisense-ai .
docker run -p 5000:5000 agrisense-ai
```

## ☁️ Deploy to Render

1. Push project to GitHub
2. Go to https://render.com → New Web Service
3. Connect your GitHub repo
4. Render auto-detects `render.yaml`
5. Click **Deploy**

## 📁 File Structure

```
potato-disease-app/
├── app.py              # Flask backend
├── requirements.txt    # Python dependencies
├── Dockerfile          # Docker config
├── render.yaml         # Render deployment
├── model/
│   └── potato_model.h5 # Your trained model (add this)
├── static/
│   ├── style.css
│   ├── script.js
│   └── uploads/        # Temporary image storage
└── templates/
    └── index.html
```

## 🤖 Model Classes

| Index | Class              | Severity |
|-------|--------------------|----------|
| 0     | Potato Early Blight | Moderate |
| 1     | Potato Late Blight  | High     |
| 2     | Healthy Potato      | None     |

## ⚙️ Environment Variables

| Variable    | Default       | Description          |
|-------------|---------------|----------------------|
| `PORT`      | 5000          | Server port          |
| `FLASK_ENV` | production    | Environment mode     |

## 📦 GitHub Upload

```bash
git init
git add .
git commit -m "Initial commit: AgriSense AI"
git remote add origin https://github.com/YOUR_USERNAME/agrisense-ai.git
git push -u origin main
```

> ⚠️ Add `model/potato_model.h5` using Git LFS or upload separately on Render disk.

## 🛠 Tech Stack

- **Backend**: Python Flask + Gunicorn
- **AI Model**: TensorFlow 2.x / Keras
- **Image Processing**: Pillow + NumPy
- **Frontend**: HTML5, CSS3 (Glassmorphism), Vanilla JS
- **Deployment**: Docker + Render
