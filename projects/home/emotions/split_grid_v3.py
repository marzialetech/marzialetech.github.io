#!/usr/bin/env python3
"""Split character emotion sheet with individually tuned crop boxes."""

from PIL import Image
import os

INPUT_FILE = "tt5.png"
OUTPUT_DIR = "tt5_emotions"

# Image is 1200x800
# Each character has custom crop box: (left, top, right, bottom, label)
# Tuned individually to avoid overlap from adjacent characters

CHARACTERS = [
    # Row 1 - need to avoid bleeding from row 2
    (10, 0, 380, 250, "angry"),
    (350, 0, 720, 250, "wave_hi"),
    (720, 0, 1100, 255, "excited"),
    
    # Row 2 - need to avoid row 1 above and row 3 below
    (10, 265, 380, 520, "shouting"),
    (350, 265, 720, 520, "nervous"),
    (720, 260, 1100, 520, "laughing"),
    
    # Row 3 - need to avoid row 2 above
    (10, 530, 380, 800, "thinking"),
    (340, 530, 720, 800, "thumbs_up"),
    (720, 525, 1100, 800, "celebrating"),
]

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_path = os.path.join(script_dir, INPUT_FILE)
    output_dir = os.path.join(script_dir, OUTPUT_DIR)
    
    os.makedirs(output_dir, exist_ok=True)
    
    img = Image.open(input_path)
    print(f"Image size: {img.size[0]}x{img.size[1]}")
    print(f"Extracting {len(CHARACTERS)} characters with custom bounds...\n")
    
    for left, top, right, bottom, label in CHARACTERS:
        cropped = img.crop((left, top, right, bottom))
        output_path = os.path.join(output_dir, f"{label}.png")
        cropped.save(output_path)
        print(f"  {label}: ({left}, {top}) to ({right}, {bottom}) [{right-left}x{bottom-top}]")
    
    print(f"\nDone! {len(CHARACTERS)} images saved to '{OUTPUT_DIR}/'")

if __name__ == "__main__":
    main()
