import os
from inference_sdk import InferenceHTTPClient

client = InferenceHTTPClient(
    api_url="https://detect.roboflow.com",
    api_key=os.environ["ROBOFLOW_API_KEY"]
)

result = client.infer(
    "test.jpg",
    model_id="plant-disease-detection/1"
)

print(result)
