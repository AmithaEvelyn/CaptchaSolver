from flask import Flask, request, jsonify
from flask_cors import CORS 
import cv2
import torch
from ultralytics import YOLO
from torchvision import transforms
from PIL import Image
import torch.nn as nn

app = Flask(__name__)

CORS(app)

yolo_model = YOLO(r"D:\Captcha\yolo\data\yolo_trained_model.pt")

class CNN(nn.Module):
    def __init__(self, num_classes):
        super(CNN, self).__init__()
        self.conv_layers = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, stride=1, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2),
            nn.Conv2d(32, 64, kernel_size=3, stride=1, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2),
            nn.Conv2d(64, 128, kernel_size=3, stride=1, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2)
        )
        self.fc_layers = nn.Sequential(
            nn.Flatten(),
            nn.Linear(128 * (64 // 8) * (64 // 8), 128),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(128, num_classes)
        )

    def forward(self, x):
        x = self.conv_layers(x)
        x = self.fc_layers(x)
        return x

num_classes = 33 
cnn_model = CNN(num_classes=num_classes)
cnn_weights_path = r"D:\Captcha\yolo+cnn\yolo+cnn\test_cnn.pth"  
cnn_model.load_state_dict(torch.load(cnn_weights_path))
cnn_model.eval()


cnn_preprocess = transforms.Compose([
    transforms.Resize((64, 64)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
])

def process_yolo_output(yolo_results):
    boxes = yolo_results[0].boxes.xyxy.cpu().numpy()  
    scores = yolo_results[0].boxes.conf.cpu().numpy()  
    labels = yolo_results[0].boxes.cls.cpu().numpy()  
    box_data = [(box, score, label) for box, score, label in zip(boxes, scores, labels)]

    sorted_boxes = sorted(box_data, key=lambda b: b[0][0])  
    return sorted_boxes

def predict_captcha(image_path):
    img_cv = cv2.imread(image_path)  
    if img_cv is None:
        raise ValueError(f"Image not found: {image_path}")

    yolo_results = yolo_model(image_path)  
    sorted_boxes = process_yolo_output(yolo_results)

    captcha_text = ""
    for i, (box, score, label) in enumerate(sorted_boxes):
        if score < 0.5:  
            continue

        x1, y1, x2, y2 = map(int, box)  
        cropped_image = img_cv[y1:y2, x1:x2]  

        cropped_image_pil = Image.fromarray(cropped_image)
        input_tensor = cnn_preprocess(cropped_image_pil)
        input_batch = input_tensor.unsqueeze(0)  

        with torch.no_grad():
            output = cnn_model(input_batch)
            _, predicted = torch.max(output, 1)

        
        character_map = "23456789abcdefghijkmnopqrstuvwxyz"
        if predicted.item() < len(character_map):
            character = character_map[predicted.item()]
        else:
            character = "?"  

        captcha_text += character

    return captcha_text

@app.route('/predict_captcha', methods=['POST'])
def predict():
    image_path = request.json.get('image_path')
    if not image_path:
        return jsonify({"error": "Image path is required"}), 400

    try:
        captcha_text = predict_captcha(image_path)
        return jsonify({"captcha_text": captcha_text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

