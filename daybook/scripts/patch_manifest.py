p = "android/app/src/main/AndroidManifest.xml"
s = open(p).read()
perms = ["POST_NOTIFICATIONS", "SCHEDULE_EXACT_ALARM", "USE_EXACT_ALARM", "VIBRATE", "RECORD_AUDIO",
         "WAKE_LOCK", "USE_FULL_SCREEN_INTENT", "RECEIVE_BOOT_COMPLETED"]
add = "".join(f'    <uses-permission android:name="android.permission.{x}" />\n' for x in perms if f"android.permission.{x}" not in s)
if "android.speech.RecognitionService" not in s:
    add += '    <queries>\n        <intent>\n            <action android:name="android.speech.RecognitionService" />\n        </intent>\n    </queries>\n'
s = s.replace("</manifest>", add + "</manifest>")
open(p, "w").write(s)
