#!/usr/bin/env python3
"""Split character emotion sheet - with corner cleanup."""

from PIL import Image, ImageDraw
import os

INPUT_FILE = "tt5.png"
OUTPUT_DIR = "tt5_emotions"

# Image is 1200x800
# Individually tuned for each character
# (left, top, right, bottom, label, cleanup_corners)
# cleanup_corners: list of corners to paint white - 'bl', 'br', 'tl', 'tr'

CHARACTERS = [
    # Row 1
    (25, 5, 365, 240, "angry", []),
    (365, 5, 700, 240, "wave_hi", []),  
    (735, 5, 1100, 245, "excited", ['bl']),
    
    # Row 2 - these have overlap from row 3 hair
    (25, 270, 365, 510, "shouting", ['bl', 'br']),
    (370, 275, 700, 510, "nervous", ['bl', 'br']),
    (740, 270, 1100, 510, "laughing", ['bl', 'br']),
    
    # Row 3
    (25, 540, 365, 795, "thinking", []),
    (360, 545, 700, 795, "thumbs_up", []),
    (735, 535, 1100, 795, "celebrating", []),
]

def cleanup_corner(img, corner, size=60):
    """Paint a corner white to remove overlap."""
    draw = ImageDraw.Draw(img)
    w, h = img.size
    
    if corner == 'bl':  # bottom-left
        points = [(0, h), (size, h), (0, h - size)]
    elif corner == 'br':  # bottom-right
        points = [(w, h), (w - size, h), (w, h - size)]
    elif corner == 'tl':  # top-left
        points = [(0, 0), (size, 0), (0, size)]
    elif corner == 'tr':  # top-right
        points = [(w, 0), (w - size, 0), (w, size)]
    else:
        return
    
    draw.polygon(points, fill=(255, 255, 255, 255))

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_path = os.path.join(script_dir, INPUT_FILE)
    output_dir = os.path.join(script_dir, OUTPUT_DIR)
    
    os.makedirs(output_dir, exist_ok=True)
    
    img = Image.open(input_path).convert('RGBA')
    print(f"Image size: {img.size[0]}x{img.size[1]}")
    print(f"Extracting {len(CHARACTERS)} characters with corner cleanup...\n")
    
    for left, top, right, bottom, label, corners in CHARACTERS:
        cropped = img.crop((left, top, right, bottom))
        
        # Clean up specified corners
        for corner in corners:
            cleanup_corner(cropped, corner, size=70)
        
        # Convert back to RGB for PNG saving
        output_path = os.path.join(output_dir, f"{label}.png")
        cropped.save(output_path)
        
        corner_info = f" (cleaned: {corners})" if corners else ""
        print(f"  {label}: [{right-left}x{bottom-top}]{corner_info}")
    
    print(f"\nDone! {len(CHARACTERS)} images saved to '{OUTPUT_DIR}/'")

if __name__ == "__main__":
    main()
