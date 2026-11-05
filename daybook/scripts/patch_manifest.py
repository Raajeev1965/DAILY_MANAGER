p = "android/app/src/main/AndroidManifest.xml"
s = open(p).read()
perms = ["POST_NOTIFICATIONS", "SCHEDULE_EXACT_ALARM", "USE_EXACT_ALARM", "VIBRATE", "RECORD_AUDIO",
         "WAKE_LOCK", "USE_FULL_SCREEN_INTENT", "RECEIVE_BOOT_COMPLETED"]
add = "".join(f'    <uses-permission android:name="android.permission.{x}" />\n' for x in perms if f"android.permission.{x}" not in s)
if "android.speech.RecognitionService" not in s:
    add += '    <queries>\n        <intent>\n            <action android:name="android.speech.RecognitionService" />\n        </intent>\n    </queries>\n'
s = s.replace("</manifest>", add + "</manifest>")
open(p, "w").write(s)

# Deep links (daybook://voice) and long-press launcher shortcuts
import os
s = open(p).read()
if 'android:scheme="daybook"' not in s:
    extra = '''            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="daybook" />
            </intent-filter>
            <meta-data android:name="android.app.shortcuts" android:resource="@xml/shortcuts" />
'''
    s = s.replace("</activity>", extra + "        </activity>", 1)
    open(p, "w").write(s)
res = "android/app/src/main/res"
os.makedirs(res + "/xml", exist_ok=True)
os.makedirs(res + "/values", exist_ok=True)
items = [("voice", "voice", "sc_voice"), ("expense", "voice?mode=expense", "sc_expense"), ("note", "voice?mode=note", "sc_note"), ("reminder", "voice?mode=reminder", "sc_reminder")]
x = '<?xml version="1.0" encoding="utf-8"?>\n<shortcuts xmlns:android="http://schemas.android.com/apk/res/android">\n'
for sid, url, st in items:
    x += f'''  <shortcut android:shortcutId="{sid}" android:enabled="true" android:icon="@mipmap/ic_launcher" android:shortcutShortLabel="@string/{st}" android:shortcutLongLabel="@string/{st}">
    <intent android:action="android.intent.action.VIEW" android:data="daybook://{url}" android:targetPackage="com.daybook.app" android:targetClass="com.daybook.app.MainActivity" />
  </shortcut>
'''
x += "</shortcuts>\n"
open(res + "/xml/shortcuts.xml", "w").write(x)
open(res + "/values/daybook_strings.xml", "w").write('''<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="sc_voice">Voice command</string>
    <string name="sc_expense">Add expense</string>
    <string name="sc_note">Voice note</string>
    <string name="sc_reminder">Add reminder</string>
</resources>
''')
