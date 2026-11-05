set -e
[ -d android ] || npx cap add android
mkdir -p android/app/src/main/res/raw
cp android-assets/alarm.wav android/app/src/main/res/raw/alarm.wav
python3 scripts/patch_manifest.py
npx cap sync android
