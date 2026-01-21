from PIL import Image
import os

icon_path = "app_icon.png"
if os.path.exists(icon_path):
    img = Image.open(icon_path)
    img.save("app_icon.ico", format="ICO", sizes=[(256, 256), (128, 128), (64, 64), (32, 32), (16, 16)])
    print("Icon converted to .ico")
else:
    print("app_icon.png not found")
