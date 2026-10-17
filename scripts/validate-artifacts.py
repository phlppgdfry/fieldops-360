import json,xml.etree.ElementTree as ET
from pathlib import Path
ns={'b':'http://www.omg.org/spec/BPMN/20100524/MODEL','di':'http://www.omg.org/spec/BPMN/20100524/DI'}
for p in Path('docs/processes').glob('*.bpmn'):
 root=ET.parse(p).getroot();proc=root.find('b:process',ns);ids={x.attrib['id'] for x in proc if 'id' in x.attrib};nodes={x.attrib['id'] for x in proc if x.tag.split('}')[-1] not in ['sequenceFlow']};edges=proc.findall('b:sequenceFlow',ns)
 for e in edges:assert e.attrib['sourceRef'] in ids and e.attrib['targetRef'] in ids
 assert len(root.findall('.//di:BPMNShape',ns))==len(nodes)
 assert len(root.findall('.//di:BPMNEdge',ns))==len(edges)
 assert proc.find('b:startEvent',ns) is not None and proc.find('b:endEvent',ns) is not None
 print(p,'XML, refs and diagram coverage valid')
for p in Path('power-platform/flows').glob('*.json'):
 d=json.loads(p.read_text());df=d['properties']['definition'];assert df['triggers'] and df['actions'];assert d['name'].startswith('fo_');print(p,'source structure valid (not tenant validation)')
assert len(json.loads(Path('power-platform/dataverse/schema.json').read_text()))==6
print('6 Dataverse table definitions present')

# Public native exports must be useful and must not grant access to the live test API.
import zipfile,re
package=Path('power-platform/releases/FieldOps360_unmanaged_template.zip')
if package.exists():
 with zipfile.ZipFile(package) as archive:
  names=archive.namelist()
  assert sum(name.endswith('.msapp') for name in names)==1
  assert any(name.endswith('.dll') for name in names)
  customizations=ET.fromstring(archive.read('customizations.xml'))
  workflows=customizations.findall('.//Workflow')
  assert len(workflows)==4
  assert all(w.findtext('StateCode')=='0' for w in workflows)
  for name in names:
   if name.endswith(('.xml','.json')):
    text=archive.read(name).decode('utf-8-sig')
    assert not re.search(r'https?://[^\s"<>]*(?:[?&]|&amp;)(?:sig|esig|skoid)=',text,re.I),name
 print('Public native solution: Canvas, server DLL, four inactive flows, no signed URLs')
