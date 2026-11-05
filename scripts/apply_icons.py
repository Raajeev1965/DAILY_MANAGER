"""Installs the Daybook launcher icons into the generated Android project."""
import os, shutil, sys, glob
RES = "android/app/src/main/res"
if not os.path.isdir(RES):
    sys.exit("ERROR: " + RES + " not found. Run this after the android project is created.")

# 1. copy the PNGs and background colour
for src in glob.glob("android-res/**/*", recursive=True):
    if os.path.isfile(src):
        dst = os.path.join(RES, os.path.relpath(src, "android-res"))
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copyfile(src, dst)

# 2. remove default Capacitor icon resources that could win over ours
for f in ["drawable/ic_launcher_background.xml", "drawable-v24/ic_launcher_foreground.xml"]:
    p = os.path.join(RES, f)
    if os.path.exists(p): os.remove(p)

# 3. make the adaptive icon point at our files
adaptive = '''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
'''
os.makedirs(RES + "/mipmap-anydpi-v26", exist_ok=True)
for n in ["ic_launcher.xml", "ic_launcher_round.xml"]:
    open(os.path.join(RES, "mipmap-anydpi-v26", n), "w").write(adaptive)

# 4. make sure the manifest uses them
m = "android/app/src/main/AndroidManifest.xml"
s = open(m).read()
s = s.replace('android:icon="@drawable/ic_launcher"', 'android:icon="@mipmap/ic_launcher"')
if 'android:icon=' not in s:
    s = s.replace("<application", '<application android:icon="@mipmap/ic_launcher" android:roundIcon="@mipmap/ic_launcher_round"', 1)
open(m, "w").write(s)
print("Icons installed:")
for f in sorted(glob.glob(RES + "/mipmap-*/ic_launcher*")): print("  ", f)
