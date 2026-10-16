from pathlib import Path
from xml.sax.saxutils import escape
out=Path('docs/processes');out.mkdir(exist_ok=True)
flows={
'as-is':[('start','Levering komt aan'),('userTask','Chauffeur vult papieren bon in'),('userTask','Bon naar werfleider'),('exclusiveGateway','Bon volledig?'),('userTask','Werfleider zoekt ontbrekende gegevens'),('userTask','Goedkeuring via e-mail'),('userTask','Administratie neemt over in Excel en ERP'),('end','ERP bijgewerkt')],
 'to-be':[('start','Levering komt aan'),('userTask','Registreer levering en bonfoto'),('serviceTask','OCR en datavalidatie'),('userTask','Mens bevestigt of corrigeert OCR'),('exclusiveGateway','Gegevens compleet?'),('userTask','Werfleider beoordeelt levering'),('exclusiveGateway','Goedgekeurd?'),('serviceTask','ERP synchroniseren met idempotentiesleutel'),('exclusiveGateway','ERP beschikbaar?'),('serviceTask','Herhaal maximaal drie keer en meld fout'),('end','Ontvangst en audit opgeslagen')]
}
for key,steps in flows.items():
 tags={'start':'startEvent','end':'endEvent'}
 edges=[]
 if key=='as-is':edges=[(0,1,''),(1,2,''),(2,3,''),(3,4,'Nee'),(4,2,''),(3,5,'Ja'),(5,6,''),(6,7,'')]
 else:edges=[(0,1,''),(1,2,''),(2,3,''),(3,4,''),(4,1,'Nee'),(4,5,'Ja'),(5,6,''),(6,1,'Afgewezen'),(6,7,'Ja'),(7,8,''),(8,10,'Ja'),(8,9,'Nee'),(9,7,'Herstart na herstel')]
 incoming={i:[] for i in range(len(steps))};outgoing={i:[] for i in range(len(steps))}
 for n,(a,b,label) in enumerate(edges):outgoing[a].append(f'f{n}');incoming[b].append(f'f{n}')
 nodes=[]
 for i,(kind,name) in enumerate(steps):
  tag=tags.get(kind,kind);children=''.join(f'<bpmn:incoming>{v}</bpmn:incoming>' for v in incoming[i])+''.join(f'<bpmn:outgoing>{v}</bpmn:outgoing>' for v in outgoing[i]);nodes.append(f'<bpmn:{tag} id="n{i}" name="{escape(name)}">{children}</bpmn:{tag}>')
 seq=''.join(f'<bpmn:sequenceFlow id="f{n}" sourceRef="n{a}" targetRef="n{b}" name="{escape(label)}"/>' for n,(a,b,label) in enumerate(edges))
 # Two-lane snake grid provides fully positioned, editable BPMN-DI shapes.
 positions={i:(70+(i%4)*260,100+(i//4)*210) for i in range(len(steps))}
 shapes=''.join(f'<bpmndi:BPMNShape id="shape{i}" bpmnElement="n{i}"><dc:Bounds x="{positions[i][0]}" y="{positions[i][1]}" width="{50 if steps[i][0] in ["start","end","exclusiveGateway"] else 190}" height="80"/></bpmndi:BPMNShape>' for i in range(len(steps)))
 lines=''.join(f'<bpmndi:BPMNEdge id="edge{n}" bpmnElement="f{n}"><di:waypoint x="{positions[a][0]+90}" y="{positions[a][1]+80}"/><di:waypoint x="{positions[b][0]+90}" y="{positions[b][1]}"/></bpmndi:BPMNEdge>' for n,(a,b,label) in enumerate(edges))
 xml=f'''<?xml version="1.0" encoding="UTF-8"?><bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="FieldOps_{key}" targetNamespace="https://example.com/fieldops"><bpmn:process id="Process_{key}" name="FieldOps 360 {key}" isExecutable="false">{''.join(nodes)}{seq}</bpmn:process><bpmndi:BPMNDiagram id="Diagram_{key}"><bpmndi:BPMNPlane id="Plane_{key}" bpmnElement="Process_{key}">{shapes}{lines}</bpmndi:BPMNPlane></bpmndi:BPMNDiagram></bpmn:definitions>'''
 (out/(key+'.bpmn')).write_text(xml)
print('Editable AS-IS and TO-BE BPMN 2.0 generated')
