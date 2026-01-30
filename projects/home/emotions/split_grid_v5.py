#!/usr/bin/env python3
"""Split character emotion sheet - final tuned version."""

from PIL import Image
import os

INPUT_FILE = "tt5.png"
OUTPUT_DIR = "tt5_emotions"

# Image is 1200x800
# Individually tuned for each character to minimize overlap
# (left, top, right, bottom, label)

CHARACTERS = [
    # Row 1 - need tighter bottom to avoid row 2 hair
    (25, 5, 365, 235, "angry"),
    (365, 5, 700, 230, "wave_hi"),  
    (735, 5, 1100, 235, "excited"),
    
    # Row 2 - need tighter bottom to avoid row 3 hair
    (25, 270, 365, 495, "shouting"),
    (370, 275, 695, 495, "nervous"),
    (740, 270, 1095, 495, "laughing"),
    
    # Row 3 - can extend to bottom
    (25, 540, 365, 795, "thinking"),
    (360, 545, 700, 795, "thumbs_up"),
    (735, 535, 1100, 795, "celebrating"),
]

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_path = os.path.join(script_dir, INPUT_FILE)
    output_dir = os.path.join(script_dir, OUTPUT_DIR)
    
    os.makedirs(output_dir, exist_ok=True)
    
    img = Image.open(input_path)
    print(f"Image size: {img.size[0]}x{img.size[1]}")
    print(f"Extracting {len(CHARACTERS)} characters...\n")
    
    for left, top, right, bottom, label in CHARACTERS:
        cropped = img.crop((left, top, right, bottom))
        output_path = os.path.join(output_dir, f"{label}.png")
        cropped.save(output_path)
        print(f"  {label}: [{right-left}x{bottom-top}]")
    
    print(f"\nDone! {len(CHARACTERS)} images saved to '{OUTPUT_DIR}/'")

if __name__ == "__main__":
    main()
