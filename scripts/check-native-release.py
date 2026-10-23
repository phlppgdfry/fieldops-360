"""Verify the real release contents, including nested Canvas archives."""
from pathlib import Path
import zipfile,io,re,json,hashlib,datetime
package=Path('power-platform/releases/FieldOps360_unmanaged_template.zip')
app=Path('power-platform/FieldOps360Native.msapp')
checked=0
def scan(raw,label):
 global checked
 with zipfile.ZipFile(io.BytesIO(raw)) as archive:
  for name in archive.namelist():
   value=archive.read(name);where=label+'/'+name
   if name.endswith(('.msapp','.zip','.msapr')):
    if zipfile.is_zipfile(io.BytesIO(value)):scan(value,where)
   elif name.endswith(('.json','.xml','.yaml')):
    checked+=1
    text=value.decode('utf-8-sig')
    assert not re.search(r'https?://[^\s"<>]*(?:[?&]|&amp;)(?:sig|esig|skoid)=',text,re.I),where
    assert not re.search(r'(?i)Bearer\s+eyJ|"(?:access_token|refresh_token|client_secret)"\s*:\s*"[^"\s]+',text),where
def source(raw,suffix):
 with zipfile.ZipFile(io.BytesIO(raw)) as z:return z.read(next(n for n in z.namelist() if n.endswith(suffix))).decode('utf-8-sig')
scan(package.read_bytes(),str(package));scan(app.read_bytes(),str(app))
with zipfile.ZipFile(package) as z:
 embedded=z.read(next(n for n in z.namelist() if n.endswith('.msapp')))
 assert 'fo_fieldops360mobile_46012' in z.read('solution.xml').decode('utf-8-sig')
 assert 'fo_fieldops360native_c065c' not in z.read('solution.xml').decode('utf-8-sig')
for raw in [app.read_bytes(),embedded]:
 assert 'Min(700' in source(raw,'ReviewScreen.pa.yaml'),'Export still contains the old small mobile layout'
 assert 'varOcrMismatch' in source(raw,'DocumentScreen.pa.yaml')
 assert 'If(IsBlank(varDelivery),Defaults(Leveringen),varDelivery)' in source(raw,'RegisterScreen.pa.yaml')
report={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Static verification of current standalone and embedded Canvas sources; nested secret-pattern scan, not runtime certification','packageSha256':hashlib.sha256(package.read_bytes()).hexdigest(),'appSha256':hashlib.sha256(app.read_bytes()).hexdigest(),'textFilesScanned':checked,'signedUrlsOrTokenPatternsFound':0,'currentMobileAppInSolution':True,'enlargedLayoutInBothArtifacts':True}
Path('docs/evidence/native-release-artifacts.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
