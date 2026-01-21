import os
import subprocess
import shutil

# Backend klasörüne geç
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Eski build klasörlerini temizle
for folder in ["build", "dist"]:
    if os.path.exists(folder):
        try:
            shutil.rmtree(folder)
        except Exception as e:
            print(f"Uyarı: {folder} silinemedi, dosya kilitli olabilir: {e}")

# PyInstaller komutu
# Note: Windows'ta ";" seperatörü kullanılır (UNIX'te ":")
cmd = [
    "pyinstaller",
    "--name=AD-Pulse",
    "--onefile",
    "--icon=app_icon.ico",
    "--add-data", "../frontend/dist;frontend/dist",
    "--collect-all", "ldap3", # ldap3 bazen ek modüller isteyebiliyor
    "main.py"
]

print(f"Build başlatılıyor: {' '.join(cmd)}")
subprocess.run(cmd, check=True)

print("\nBuild başarılı! 'dist/AD-Pulse.exe' oluşturuldu.")
