#!/usr/bin/env python3
"""Split character emotion sheet by centering on each figure."""

from PIL import Image
import os

INPUT_FILE = "tt5.png"
OUTPUT_DIR = "tt5_emotions"

# Image is 1200x800
# Manually identified approximate center points for each character's face/upper body
# Format: (center_x, center_y, label)
# Adjusted based on visual inspection of where each character is positioned

CHARACTERS = [
    # Row 1
    (200, 135, "angry"),
    (530, 125, "wave_hi"),
    (920, 130, "excited"),
    
    # Row 2
    (200, 400, "shouting"),
    (530, 390, "nervous"),
    (920, 395, "laughing"),
    
    # Row 3
    (200, 665, "thinking"),
    (530, 660, "thumbs_up"),
    (920, 655, "celebrating"),
]

# Crop dimensions (width, height) - sized to capture each character
CROP_WIDTH = 380
CROP_HEIGHT = 260

def crop_centered(img, center_x, center_y, width, height):
    """Crop an image centered on a point, clamping to image bounds."""
    img_width, img_height = img.size
    
    # Calculate crop box
    left = center_x - width // 2
    top = center_y - height // 2
    right = left + width
    bottom = top + height
    
    # Clamp to image bounds
    if left < 0:
        right -= left
        left = 0
    if top < 0:
        bottom -= top
        top = 0
    if right > img_width:
        left -= (right - img_width)
        right = img_width
    if bottom > img_height:
        top -= (bottom - img_height)
        bottom = img_height
    
    # Final clamp
    left = max(0, left)
    top = max(0, top)
    right = min(img_width, right)
    bottom = min(img_height, bottom)
    
    return img.crop((left, top, right, bottom))

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_path = os.path.join(script_dir, INPUT_FILE)
    output_dir = os.path.join(script_dir, OUTPUT_DIR)
    
    os.makedirs(output_dir, exist_ok=True)
    
    img = Image.open(input_path)
    print(f"Image size: {img.size[0]}x{img.size[1]}")
    print(f"Crop size: {CROP_WIDTH}x{CROP_HEIGHT}")
    print(f"Extracting {len(CHARACTERS)} characters...\n")
    
    for center_x, center_y, label in CHARACTERS:
        cropped = crop_centered(img, center_x, center_y, CROP_WIDTH, CROP_HEIGHT)
        output_path = os.path.join(output_dir, f"{label}.png")
        cropped.save(output_path)
        print(f"  {label}: center ({center_x}, {center_y}) -> {output_path}")
    
    print(f"\nDone! {len(CHARACTERS)} images saved to '{OUTPUT_DIR}/'")

if __name__ == "__main__":
    main()
