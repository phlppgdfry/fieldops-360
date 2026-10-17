"""Create a shareable deployment template without signed runtime URLs or bindings."""
import json,re,sys,zipfile,hashlib
from pathlib import Path
source=Path(sys.argv[1]);target=Path(sys.argv[2]);target.parent.mkdir(parents=True,exist_ok=True)
replacements=[]
with zipfile.ZipFile(source) as original,zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as public:
 for info in original.infolist():
  raw=original.read(info.filename)
  if info.filename.endswith(('.json','.xml')):
   text=raw.decode('utf-8-sig')
   # Signed HTTP callback URLs are deployment secrets, including XML escaped query strings.
   def scrub(match):
    uri=match.group(0)
    if re.search(r'(?:[?&]|&amp;)(?:sig|esig|se|skoid)=',uri,re.I):
     replacements.append(info.filename)
     return 'https://configure-erp-endpoint.example.invalid/receipts'
    return uri
   text=re.sub(r'https?://[^\s"<>]+',scrub,text)
   if info.filename == 'customizations.xml':
    def deactivate(match):
     block=match.group(0)
     block=re.sub(r'<StateCode>[^<]+</StateCode>', '<StateCode>0</StateCode>', block)
     return re.sub(r'<StatusCode>[^<]+</StatusCode>', '<StatusCode>1</StatusCode>', block)
    text=re.sub(r'<Workflow\b[\s\S]*?</Workflow>',deactivate,text)
   if info.filename.endswith('.json'):
    try:
     doc=json.loads(text)
     # Keep logical connector names; connection IDs are rebound for every environment.
     def visit(value):
      if isinstance(value,dict):
       for key,child in list(value.items()):
        if key=='connection' and isinstance(child,dict) and 'connectionReferenceLogicalName' in child:child.pop('name',None)
        visit(child)
      elif isinstance(value,list):
       for child in value:visit(child)
     visit(doc);text=json.dumps(doc,ensure_ascii=False,indent=2)
    except json.JSONDecodeError:pass
   raw=text.encode('utf-8')
  public.writestr(info.filename,raw)
with zipfile.ZipFile(target) as check:
 for name in check.namelist():
  if name.endswith(('.json','.xml')):
   text=check.read(name).decode('utf-8-sig')
   if re.search(r'https?://[^\s"<>]*(?:[?&]|&amp;)(?:sig|esig|skoid)=',text,re.I):raise RuntimeError('Signed URL remains in '+name)
print(json.dumps({'artifact':str(target),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'signedEndpointsRemoved':len(replacements),'filesChanged':sorted(set(replacements)),'runtimeEndpointMustBeBoundAfterImport':True},indent=2))
