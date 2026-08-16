import os
import json
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types


BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")


class AIService:

    client = genai.Client(
        api_key=os.getenv("GEMINI_API_KEY")
    )

    MODEL = "gemini-3.6-flash"

    @classmethod
    async def generate_treatment(
        cls,
        crop: str,
        disease: str,
    ):

        prompt = f"""
You are the agricultural advisory AI for SmartCrop.

A machine-learning model has identified the following:

Crop: {crop}
Disease: {disease}

Generate accurate, practical agricultural information for this
specific crop disease.

Return ONLY valid JSON using exactly this structure:

{{
    "common_name": "string",
    "crop": "string",
    "causal_agent": "string",
    "symptoms": "string",
    "severity": "Low | Moderate | High | Very High",
    "chemical_treatment": "string",
    "cultural_practices": "string",
    "prevention": "string"
}}

FIELD REQUIREMENTS:

common_name:
The commonly recognized name of the disease.

crop:
The affected crop.

causal_agent:
The pathogen, pest, virus, fungus, bacterium, or other
known cause of the disease.

symptoms:
The main visible symptoms a farmer can identify.

severity:
Give an appropriate general severity level:
Low, Moderate, High, or Very High.

chemical_treatment:
Explain appropriate chemical control options where applicable.
Do NOT invent pesticide names, dosages, or application rates.
Tell farmers to use locally approved products according to
their product labels and local agricultural guidance.

cultural_practices:
Explain farming and field-management practices that can help
manage an existing infection.

prevention:
This MUST be a separate section focused specifically on
preventing the disease from occurring or spreading.

Prevention may include relevant practices such as:
- using healthy planting material
- using resistant or tolerant varieties
- crop rotation
- field sanitation
- removing infected plant material
- controlling disease vectors
- proper spacing
- moisture management
- regular crop monitoring
- avoiding practices that increase disease spread

Do not simply repeat the cultural_practices field.
Make prevention specifically about reducing future disease
risk.

Keep the information concise, practical, and understandable
to farmers.

Do not include Markdown.
Do not include any text outside the JSON.
"""

        response = await cls.client.aio.models.generate_content(
            model=cls.MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema={
                    "type": "OBJECT",
                    "properties": {
                        "common_name": {
                            "type": "STRING"
                        },
                        "crop": {
                            "type": "STRING"
                        },
                        "causal_agent": {
                            "type": "STRING"
                        },
                        "symptoms": {
                            "type": "STRING"
                        },
                        "severity": {
                            "type": "STRING"
                        },
                        "chemical_treatment": {
                            "type": "STRING"
                        },
                        "cultural_practices": {
                            "type": "STRING"
                        },
                        "prevention": {
                            "type": "STRING"
                        },
                    },
                    "required": [
                        "common_name",
                        "crop",
                        "causal_agent",
                        "symptoms",
                        "severity",
                        "chemical_treatment",
                        "cultural_practices",
                        "prevention",
                    ],
                },
            ),
        )

        if not response.text:
            raise ValueError(
                "Gemini returned an empty response."
            )

        return json.loads(response.text)