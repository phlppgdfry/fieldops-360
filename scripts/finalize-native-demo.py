"""Crop the actual recorded app and create captions from the real tour timeline."""
from pathlib import Path
import json,subprocess
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i','.data/native-demo-short-hq.webm','-vf','crop=390:796:0:48','-c:v','libvpx-vp9','-crf','30','-b:v','0','-an','docs/evidence/native-demo.webm'],check=True)
text=Path('.data/native-demo-tour.log').read_text()
report=json.loads(text.split('### Result\n')[1].split('\n###')[0])
duration=float(json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','json','docs/evidence/native-demo.webm']))['format']['duration'])
offset=max(0,duration-report['duration']-0.5)
def stamp(t):
 ms=round(t*1000)
 return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}.{ms%1000:03}'
scenes=[{'seconds':0,'title':'FieldOps 360 — echte native Power Apps-demonstratie.'}]+[{'seconds':s['seconds']+offset,'title':s['title']} for s in report['scenes']]
vtt='WEBVTT\n\n'
for i,scene in enumerate(scenes):
 end=scenes[i+1]['seconds'] if i+1<len(scenes) else duration
 vtt+=f'{stamp(scene["seconds"])} --> {stamp(end)}\n{scene["title"]}\n\n'
Path('docs/evidence/native-demo.nl.vtt').write_text(vtt.rstrip()+'\n')
report.update({'video':'native-demo.webm','captions':'native-demo.nl.vtt','durationSeconds':duration,'width':390,'height':796,'note':'Actual player recording cropped to the app. The tour views stored real Microsoft OCR and an earlier genuine human approval receipt; it does not execute an approval.'})
Path('docs/evidence/native-demo-recording.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print({'durationSeconds':duration,'captions':len(scenes)})
