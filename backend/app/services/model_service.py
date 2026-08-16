from io import BytesIO
from pathlib import Path

import torch
import torch.nn as nn

from PIL import Image, UnidentifiedImageError
from torchvision import transforms
from torchvision.models import efficientnet_b0


class ModelService:

    # ==========================================
    # Configuration
    # ==========================================

    BASE_DIR = Path(__file__).resolve().parents[2]

    MODEL_PATH = BASE_DIR / "models" / "smartcrop_model.pth"

    CLASSES = [
        "Cassava_Bacterial_Blight",
        "Cassava_Brown_Spot",
        "Cassava_Green_Mite",
        "Cassava_Healthy",
        "Cassava_Mosaic",

        "Maize_Fall_Armyworm",
        "Maize_Grasshopper",
        "Maize_Healthy",
        "Maize_Leaf_Beetle",
        "Maize_Leaf_Blight",
        "Maize_Leaf_Spot",
        "Maize_Streak_Virus",

        "Tomato_Healthy",
        "Tomato_Leaf_Blight",
        "Tomato_Leaf_Curl",
        "Tomato_Septoria_Leaf_Spot",
        "Tomato_Verticillium_Wilt",
    ]

    DEVICE = torch.device(
        "cuda" if torch.cuda.is_available() else "cpu"
    )

    MODEL = None

    # ==========================================
    # Image preprocessing
    # ==========================================

    TRANSFORM = transforms.Compose([
        transforms.Resize((224, 224)),

        transforms.ToTensor(),

        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        ),
    ])

    # ==========================================
    # Load model
    # ==========================================

    @classmethod
    async def load(cls):

        print("🌱 Loading SmartCrop model...")
        print(f"📁 Model path: {cls.MODEL_PATH}")
        print(f"💻 Device: {cls.DEVICE}")

        if not cls.MODEL_PATH.exists():
            raise FileNotFoundError(
                f"SmartCrop model not found at: {cls.MODEL_PATH}"
            )

        # Create EfficientNet-B0 architecture
        model = efficientnet_b0(
            weights=None
        )

        # Replace final classifier with our 17 classes
        model.classifier[1] = nn.Linear(
            model.classifier[1].in_features,
            len(cls.CLASSES)
        )

        # Load trained weights
        checkpoint = torch.load(
            cls.MODEL_PATH,
            map_location=cls.DEVICE
        )

        model.load_state_dict(
            checkpoint["model_state_dict"]
        )

        # Move model to CPU/GPU
        model.to(cls.DEVICE)

        # Evaluation mode
        model.eval()

        cls.MODEL = model

        print(
            f"✅ SmartCrop model loaded successfully "
            f"({len(cls.CLASSES)} classes)"
        )

    # ==========================================
    # Prediction
    # ==========================================

    @classmethod
    def predict(cls, image_bytes: bytes):

        # Make sure model was loaded
        if cls.MODEL is None:
            raise RuntimeError(
                "SmartCrop model has not been loaded."
            )

        # ======================================
        # Open image
        # ======================================

        try:

            image = Image.open(
                BytesIO(image_bytes)
            ).convert("RGB")

        except UnidentifiedImageError:

            raise ValueError(
                "The uploaded file is not a valid image."
            )

        # ======================================
        # Preprocess
        # ======================================

        tensor = cls.TRANSFORM(image)

        # Add batch dimension
        tensor = tensor.unsqueeze(0)

        # Move tensor to same device as model
        tensor = tensor.to(cls.DEVICE)

        # ======================================
        # AI prediction
        # ======================================

        with torch.no_grad():

            outputs = cls.MODEL(tensor)

            probabilities = torch.softmax(
                outputs,
                dim=1
            )

            confidence, predicted = torch.max(
                probabilities,
                dim=1
            )

        # ======================================
        # Extract prediction
        # ======================================

        class_index = predicted.item()

        disease = cls.CLASSES[class_index]

        confidence = confidence.item()

        # ======================================
        # Extract crop
        # ======================================

        crop = disease.split("_")[0]

        # ======================================
        # Return result
        # ======================================

        return {
            "crop": crop,
            "disease": disease,
            "confidence": round(
                confidence,
                4
            ),
        }