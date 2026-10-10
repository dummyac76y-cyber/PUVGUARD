import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertOctagon, AlertTriangle, Bike, Bell, CheckCircle2, Clock3,
  Download, ExternalLink, FileText, Filter, LifeBuoy, MapPin, Menu, RadioTower,
  Search, ShieldAlert, ShieldCheck, Siren, Smartphone, Truck, Users, Wifi,
  X, Plus, Phone, Navigation, UserRound, LocateFixed, Settings2, LayoutDashboard
} from 'lucide-react';
import LiveMap, { MapPoint } from './LiveMap';

type VehicleKind = 'Motorcycle' | 'Tricycle';
type Unit = {
  id: string; name: string; kind: VehicleKind; plate: string; driver: string;
  driverPhone: string; deviceId: string; route: string; lat: number; lon: number;
  online: boolean; lastSeen: string; battery: number;
};
type IncidentKind = 'Automatic crash detection' | 'Manual SOS' | 'Discreet driver assistance' | 'Medical emergency' | 'Device offline';
type Incident = {
  id: string; unitId: string; kind: IncidentKind; priority: 'Critical' | 'High' | 'Medium';
  status: 'New' | 'Acknowledged' | 'Dispatched' | 'Resolved';
  location: string; lat: number; lon: number; createdAt: string; details: string;
  assignedResponderId?: string;
};
type Responder = { id: string; name: string; role: string; agency: string; phone: string; lat: number; lon: number; available: boolean };

const seedUnits: Unit[] = [
  { id:'UNIT-001', name:'Rider One', kind:'Motorcycle', plate:'DEMO-101', driver:'Sample Driver A', driverPhone:'', deviceId:'PG-001', route:'Kalibo town', lat:11.709, lon:122.365, online:true, lastSeen:'Just now', battery:82 },
  { id:'UNIT-002', name:'Tricycle Alpha', kind:'Tricycle', plate:'DEMO-202', driver:'Sample Driver B', driverPhone:'', deviceId:'PG-002', route:'Kalibo–Banga', lat:11.704, lon:122.358, online:true, lastSeen:'2 min ago', battery:76 },
  { id:'UNIT-003', name:'Rider Three', kind:'Motorcycle', plate:'DEMO-303', driver:'Sample Driver C', driverPhone:'', deviceId:'PG-003', route:'Kalibo–Numancia', lat:11.716, lon:122.371, online:false, lastSeen:'36 min ago', battery:0 },
];
const seedIncidents: Incident[] = [
  { id:'INC-DEMO-001', unitId:'UNIT-001', kind:'Automatic crash detection', priority:'Critical', status:'New', location:'Sample location · Kalibo', lat:11.709, lon:122.365, createdAt:new Date().toISOString(), details:'Illustrative impact + orientation + motion-cessation event. Verify before dispatch.' },
  { id:'INC-DEMO-002', unitId:'UNIT-002', kind:'Discreet driver assistance', priority:'Critical', status:'Acknowledged', location:'Sample location · Kalibo–Banga', lat:11.704, lon:122.358, createdAt:new Date(Date.now()-8*60000).toISOString(), details:'Illustrative silent request. Treat as sensitive; do not sound an alarm or contact the driver openly.' },
  { id:'INC-DEMO-003', unitId:'UNIT-003', kind:'Device offline', priority:'Medium', status:'New', location:'Last known location · Kalibo', lat:11.716, lon:122.371, createdAt:new Date(Date.now()-36*60000).toISOString(), details:'No recent heartbeat. Marker is last-known position, not live tracking.' },
];
const seedResponders: Responder[] = [
  { id:'RESP-001', name:'MDRRMO on-duty contact', role:'Emergency coordination', agency:'Local government / MDRRMO', phone:'', lat:11.710, lon:122.365, available:true },
  { id:'RESP-002', name:'Road safety contact', role:'Road incident support', agency:'Authorized local responder', phone:'', lat:11.700, lon:122.355, available:true },
  { id:'RESP-003', name:'Backup emergency contact', role:'Registered emergency contact', agency:'Driver / family contact', phone:'', lat:11.720, lon:122.375, available:true },
];
const readStore = <T,>(key:string, fallback:T):T => {
  try { const raw=localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
};
const haversineKm = (a:{lat:number;lon:number}, b:{lat:number;lon:number}) => {
  const rad=(n:number)=>n*Math.PI/180, dLat=rad(b.lat-a.lat), dLon=rad(b.lon-a.lon);
  const q=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLon/2)**2;
  return 6371*2*Math.atan2(Math.sqrt(q),Math.sqrt(1-q));
};
const fmtTime = (value:string) => new Date(value).toLocaleString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' });

function App() {
  const [page,setPage]=useState('Overview');
  const [units,setUnits]=useState<Unit[]>(()=>readStore('puvguard_units_v2',seedUnits));
  const [incidents,setIncidents]=useState<Incident[]>(()=>readStore('puvguard_incidents_v2',seedIncidents));
  const [responders,setResponders]=useState<Responder[]>(()=>readStore('puvguard_responders_v2',seedResponders));
  const [selectedId,setSelectedId]=useState('INC-DEMO-001');
  const [query,setQuery]=useState('');
  const [filter,setFilter]=useState('All');
  const [notice,setNotice]=useState('');
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const [unitModal,setUnitModal]=useState(false);
  const [responderModal,setResponderModal]=useState(false);
  const [dispatchTarget,setDispatchTarget]=useState<Incident|null>(null);
  const [unitForm,setUnitForm]=useState({name:'',kind:'Motorcycle' as VehicleKind,plate:'',driver:'',driverPhone:'',deviceId:'',route:'',lat:'11.7100',lon:'122.3650'});
  const [responderForm,setResponderForm]=useState({name:'',role:'Emergency coordination',agency:'',phone:'',lat:'11.7100',lon:'122.3650'});
  const [showResolved,setShowResolved]=useState(false);

  useEffect(()=>{localStorage.setItem('puvguard_units_v2',JSON.stringify(units));},[units]);
  useEffect(()=>{localStorage.setItem('puvguard_incidents_v2',JSON.stringify(incidents));},[incidents]);
  useEffect(()=>{localStorage.setItem('puvguard_responders_v2',JSON.stringify(responders));},[responders]);

  const selected=incidents.find(i=>i.id===selectedId) ?? incidents[0];
  const selectedUnit=selected ? units.find(u=>u.id===selected.unitId) : undefined;
  const filteredIncidents=useMemo(()=>incidents.filter(i=>{
    const u=units.find(x=>x.id===i.unitId);
    const text=[i.id,i.kind,i.location,i.status,u?.name,u?.plate,u?.driver].join(' ').toLowerCase();
    return text.includes(query.toLowerCase()) && (filter==='All'||i.priority===filter||i.status===filter) && (showResolved||i.status!=='Resolved');
  }),[incidents,units,query,filter,showResolved]);
  const nearestResponders=useMemo(()=>selected ? responders.filter(r=>r.available).map(r=>({...r,distance:haversineKm(selected,r)})).sort((a,b)=>a.distance-b.distance):[],[responders,selected]);
  const setNoticeFor=useCallback((message:string)=>{setNotice(message);},[]);
  const acknowledge=(id:string)=>{setIncidents(prev=>prev.map(i=>i.id===id?{...i,status:'Acknowledged'}:i));setNoticeFor('Incident acknowledged in this browser. No responder has been notified.');};
  const resolve=(id:string)=>{setIncidents(prev=>prev.map(i=>i.id===id?{...i,status:'Resolved'}:i));setNoticeFor('Incident marked resolved locally.');};
  const dispatch=(incident:Incident,responder:Responder)=>{
    setIncidents(prev=>prev.map(i=>i.id===incident.id?{...i,status:'Dispatched',assignedResponderId:responder.id}:i));
    setDispatchTarget(null);
    setNoticeFor('Dispatch assignment saved locally to '+responder.name+'. This does not transmit a real dispatch request; call the verified contact using the contact details below.');
  };
  const registerUnit=(e:FormEvent)=>{
    e.preventDefault();
    const lat=Number(unitForm.lat),lon=Number(unitForm.lon);
    if(!unitForm.name.trim()||!unitForm.plate.trim()||!unitForm.driver.trim()||!unitForm.deviceId.trim()||!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180){setNoticeFor('Enter a unit name, plate/identifier, driver, device ID, and valid GPS coordinates.');return;}
    const id='UNIT-'+String(Date.now()).slice(-6);
    setUnits(prev=>[{id,name:unitForm.name.trim(),kind:unitForm.kind,plate:unitForm.plate.trim(),driver:unitForm.driver.trim(),driverPhone:unitForm.driverPhone.trim(),deviceId:unitForm.deviceId.trim(),route:unitForm.route.trim()||'Not specified',lat,lon,online:false,lastSeen:'Never connected',battery:0},...prev]);
    setUnitModal(false);setUnitForm({name:'',kind:'Motorcycle',plate:'',driver:'',driverPhone:'',deviceId:'',route:'',lat:'11.7100',lon:'122.3650'});
    setNoticeFor('Unit registered in this browser. It will show Offline until real device heartbeats are integrated.');
  };
  const registerResponder=(e:FormEvent)=>{
    e.preventDefault(); const lat=Number(responderForm.lat),lon=Number(responderForm.lon);
    if(!responderForm.name.trim()||!responderForm.agency.trim()||!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180){setNoticeFor('Enter responder name, agency, and valid coordinates.');return;}
    setResponders(prev=>[{id:'RESP-'+String(Date.now()).slice(-6),name:responderForm.name.trim(),role:responderForm.role,agency:responderForm.agency.trim(),phone:responderForm.phone.trim(),lat,lon,available:true},...prev]);
    setResponderModal(false);setResponderForm({name:'',role:'Emergency coordination',agency:'',phone:'',lat:'11.7100',lon:'122.3650'});
    setNoticeFor('Responder/contact added locally. Verify the agency and phone number before relying on it.');
  };
  const addDemoIncident=(kind:IncidentKind)=>{
    const unit=units[0]; if(!unit){setNoticeFor('Register a unit first.');return;}
    const id='INC-'+new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,14);
    const critical=kind!=='Device offline';
    const incident:Incident={id,unitId:unit.id,kind,priority:critical?'Critical':'Medium',status:'New',location:'Unit last-reported coordinates',lat:unit.lat,lon:unit.lon,createdAt:new Date().toISOString(),details:'Manually created demonstration event. Connect authenticated device ingestion before using live events.'};
    setIncidents(prev=>[incident,...prev]);setSelectedId(id);setPage('Incident center');setNoticeFor('Sample incident created for testing. This did not come from a real sensor.');
  };
  const points:MapPoint[]=useMemo(()=>[
    ...incidents.filter(i=>i.status!=='Resolved').map(i=>({id:i.id,label:i.id+' · '+i.kind,lat:i.lat,lon:i.lon,kind:(i.priority==='Critical'?'critical':'assistance') as MapPoint['kind'],detail:i.location})),
    ...units.map(u=>({id:u.id,label:u.name,lat:u.lat,lon:u.lon,kind:'unit' as const,detail:u.kind+' · '+(u.online?'Online':'Offline')+' · '+u.plate})),
    ...responders.filter(r=>r.available).map(r=>({id:r.id,label:r.name,lat:r.lat,lon:r.lon,kind:'responder' as const,detail:r.agency})),
  ],[incidents,units,responders]);
  const nav=[['Overview',LayoutDashboard],['Incident center',Siren],['Live map',MapPin],['PUV fleet',Bike],['Responders & contacts',Users],['Device health',RadioTower],['Reports',FileText],['Settings',Settings2]] as const;
  const title=page==='Overview'?'Operations overview':page;
  const unitName=(id:string)=>units.find(u=>u.id===id)?.name ?? id;
  const incidentPanel=(full:boolean)=>(
    <section className="panel">
      <div className="panel-heading">
        <div><h2>{full?'Incident center':'Recent incidents'} <span className="count-bubble">{filteredIncidents.length}</span></h2><p>Crash detection, manual SOS, silent assistance and device availability.</p></div>
        {full&&<div className="inline-actions"><button className="button button-secondary" onClick={()=>setShowResolved(v=>!v)}>{showResolved?'Hide resolved':'Show resolved'}</button><button className="button button-primary" onClick={()=>addDemoIncident('Manual SOS')}><Plus size={15}/> Test SOS event</button></div>}
      </div>
      <div className="table-controls">
        <div className="searchbox"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search incident, driver, unit, plate, location…"/></div>
        <select value={filter} onChange={e=>setFilter(e.target.value)} aria-label="Filter incidents"><option>All</option><option>Critical</option><option>High</option><option>Medium</option><option>New</option><option>Acknowledged</option><option>Dispatched</option><option>Resolved</option></select>
      </div>
      <div className="table-wrap"><table><thead><tr><th>INCIDENT / UNIT</th><th>EVENT</th><th>LOCATION</th><th>PRIORITY</th><th>STATUS</th><th></th></tr></thead><tbody>
      {filteredIncidents.map(i=><tr key={i.id} onClick={()=>setSelectedId(i.id)} className={selectedId===i.id?'selected-row':''}>
        <td><b>{i.id}</b><small>{unitName(i.unitId)} · {units.find(u=>u.id===i.unitId)?.kind ?? 'Unknown vehicle'}</small></td>
        <td><span className="event-cell"><span className={'event-icon '+(i.priority==='Critical'?'event-red':'event-amber')}>{i.kind==='Automatic crash detection'?<AlertOctagon size={15}/>:i.kind==='Device offline'?<Wifi size={15}/>:<ShieldAlert size={15}/>}</span>{i.kind}</span></td>
        <td>{i.location}<small>{fmtTime(i.createdAt)}</small></td>
        <td><span className={'priority priority-'+i.priority.toLowerCase()}><i/>{i.priority}</span></td>
        <td><span className={'status-tag status-'+i.status.toLowerCase()}>{i.status}</span></td>
        <td><button className="row-open" aria-label={'Select '+i.id} onClick={e=>{e.stopPropagation();setSelectedId(i.id);}}><ExternalLink size={16}/></button></td>
      </tr>)}
      </tbody></table>{!filteredIncidents.length&&<div className="empty-state">No incidents match these filters.</div>}</div>
      <div className="table-footer"><span>Showing {filteredIncidents.length} of {incidents.length} locally stored records</span><span>GPS and statuses are illustrative until device data is connected.</span></div>
    </section>
  );

  return <div className="shell">
    {sidebarOpen&&<button className="scrim" aria-label="Close navigation" onClick={()=>setSidebarOpen(false)}/>}
    <aside className={'sidebar '+(sidebarOpen?'sidebar-open':'')}>
      <div className="brand"><div className="brand-mark"><ShieldCheck size={23}/></div><div><b>PUV<span>GUARD</span></b><small>DRIVER SAFETY OPERATIONS</small></div><button className="icon-button mobile-close" onClick={()=>setSidebarOpen(false)} aria-label="Close menu"><X size={18}/></button></div>
      <div className="workspace"><div className="workspace-icon"><ShieldCheck size={16}/></div><div><strong>MDRRMO</strong><small>Monitoring workspace</small></div></div>
      <div className="nav-caption">OPERATIONS</div><nav>{nav.map(([label,Icon])=><button key={label} className={'nav-item '+(page===label?'nav-active':'')} onClick={()=>{setPage(label);setSidebarOpen(false);}}><Icon size={18}/><span>{label}</span>{label==='Incident center'&&<em>{incidents.filter(i=>i.status!=='Resolved').length}</em>}{page===label&&<i/>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="connection"><span className="pulse-dot"/><div><b>Prototype mode</b><small>Local browser storage</small></div></div><div className="user-card"><div className="avatar">MD</div><div className="user-info"><b>MDRRMO Operator</b><small>Local prototype session</small></div></div></div>
    </aside>
    <main className="main"><header className="topbar"><div className="top-left"><button className="icon-button menu-toggle" onClick={()=>setSidebarOpen(true)} aria-label="Open navigation"><Menu size={20}/></button><div className="breadcrumb">PUVGUARD <span>›</span> <span>{page}</span></div></div><div className="top-actions"><div className="system-status"><span className="pulse-dot"/> Prototype mode</div><button className="icon-button" aria-label="Notifications" onClick={()=>setNoticeFor('Prototype notifications are shown inside this dashboard only.')}><Bell size={18}/></button></div></header>
      <div className="content"><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> MDRRMO COMMAND CENTER</div><h1>{title}<span className="live-pill"><span className="pulse-dot"/> DEMO DATA</span></h1><p>Motorcycle and tricycle emergency awareness, location monitoring and responder coordination.</p></div><div className="heading-actions"><button className="button button-secondary" onClick={()=>{setQuery('');setFilter('All');setNoticeFor('Filters reset.');}}><Filter size={15}/> Reset filters</button><button className="button button-primary" onClick={()=>setPage('Incident center')}><Siren size={15}/> Incident center</button></div></div>
      {notice&&<div className="notice"><CheckCircle2 size={17}/><span>{notice}</span><button onClick={()=>setNotice('')} aria-label="Dismiss notice"><X size={16}/></button></div>}
      {page==='Overview'&&<>
        <section className="metrics-grid">
          <div className="metric-card"><div className="metric-top"><span>REGISTERED UNITS</span><span className="metric-icon blue"><Bike size={18}/></span></div><div className="metric-value">{units.length}<span className="metric-trend">Motorcycles + tricycles</span></div><div className="metric-foot">Fleet directory</div></div>
          <div className="metric-card"><div className="metric-top"><span>ONLINE DEVICES</span><span className="metric-icon green"><Wifi size={18}/></span></div><div className="metric-value">{units.filter(u=>u.online).length}<span className="metric-trend">of {units.length} units</span></div><div className="metric-foot"><span className="status-dot"/> Demo heartbeat state only</div></div>
          <div className="metric-card"><div className="metric-top"><span>ACTIVE INCIDENTS</span><span className="metric-icon red"><Siren size={18}/></span></div><div className="metric-value">{incidents.filter(i=>i.status!=='Resolved').length}<span className="metric-trend">Unresolved</span></div><div className="metric-foot"><span className="status-dot status-red"/> Verify every alert</div></div>
          <div className="metric-card"><div className="metric-top"><span>AVAILABLE CONTACTS</span><span className="metric-icon amber"><Users size={18}/></span></div><div className="metric-value">{responders.filter(r=>r.available).length}<span className="metric-trend">Responder directory</span></div><div className="metric-foot">Confirm official details</div></div>
        </section>
        <section className="panel map-panel"><div className="panel-heading"><div><h2>Incident and unit map</h2><p>Selectable incident, vehicle and responder markers.</p></div><button className="text-button" onClick={()=>setPage('Live map')}>Open full map <ExternalLink size={13}/></button></div><LiveMap points={points}/><div className="map-bottom"><span><i className="legend-red"/> Critical incident</span><span><i className="legend-amber"/> Assistance / other incident</span><span><i className="legend-green"/> Registered unit</span><span>R = responder/contact</span></div></section>
        {incidentPanel(false)}
        {selected&&<section className="panel detail-panel"><div className="detail-head"><div><div className="eyebrow">SELECTED INCIDENT</div><h2>{selected.id} <span className={'priority priority-'+selected.priority.toLowerCase()}><i/>{selected.priority}</span></h2><p>{selected.details}</p></div><span className={'status-tag status-'+selected.status.toLowerCase()}>{selected.status}</span></div><div className="detail-grid"><div><small>VEHICLE / DRIVER</small><b><Bike size={15}/>{selectedUnit?.name??selected.unitId}</b><small>{selectedUnit?.kind} · {selectedUnit?.plate} · {selectedUnit?.driver}</small></div><div><small>EVENT TYPE</small><b><AlertTriangle size={15}/>{selected.kind}</b></div><div><small>INCIDENT LOCATION</small><b><MapPin size={15}/>{selected.location}</b><small>{selected.lat.toFixed(5)}, {selected.lon.toFixed(5)}</small></div><div><small>EVENT TIME</small><b><Clock3 size={15}/>{fmtTime(selected.createdAt)}</b></div></div><div className="detail-actions"><span><ShieldAlert size={15}/> Prototype action only. Verify the event and use official emergency procedures.</span><div>{selected.status==='New'&&<button className="button button-secondary" onClick={()=>acknowledge(selected.id)}>Acknowledge</button>}<button className="button button-primary" onClick={()=>setDispatchTarget(selected)}><Navigation size={15}/> Find nearest responder</button></div></div></section>}
      </>}
      {page==='Incident center'&&<>{incidentPanel(true)}{selected&&<section className="panel detail-panel"><div className="detail-head"><div><div className="eyebrow">INCIDENT DETAILS</div><h2>{selected.id}</h2><p>{selected.details}</p></div><span className={'status-tag status-'+selected.status.toLowerCase()}>{selected.status}</span></div><div className="detail-grid"><div><small>VEHICLE NAME</small><b>{selectedUnit?.name??selected.unitId}</b><small>{selectedUnit?.kind} · {selectedUnit?.plate}</small></div><div><small>DRIVER</small><b><UserRound size={15}/>{selectedUnit?.driver??'Unknown'}</b></div><div><small>EVENT</small><b><AlertTriangle size={15}/>{selected.kind}</b></div><div><small>LOCATION / GPS</small><b><MapPin size={15}/>{selected.location}</b><small>{selected.lat.toFixed(5)}, {selected.lon.toFixed(5)}</small><a href={'https://www.google.com/maps?q='+selected.lat+','+selected.lon} target="_blank" rel="noreferrer">Open directions/map</a></div></div><div className="detail-actions"><span>Assigned responder: {selected.assignedResponderId?responders.find(r=>r.id===selected.assignedResponderId)?.name:'None'}</span><div>{selected.status==='New'&&<button className="button button-secondary" onClick={()=>acknowledge(selected.id)}>Acknowledge</button>}{selected.status!=='Resolved'&&<button className="button button-primary" onClick={()=>setDispatchTarget(selected)}><Navigation size={15}/> Dispatch nearest</button>}{selected.status!=='Resolved'&&<button className="button button-secondary" onClick={()=>resolve(selected.id)}>Resolve</button>}</div></div></section>}</>}
      {page==='Live map'&&<section className="panel map-panel"><div className="panel-heading"><div><h2>Live map</h2><p>Incident coordinates, unit last-known positions, and responder directory.</p></div><span className="tag tag-muted">GPS data required</span></div><LiveMap points={points} height={560} onSelect={id=>{if(id.startsWith('INC-')){setSelectedId(id);setPage('Incident center');}else if(id.startsWith('UNIT-'))setPage('PUV fleet');else setPage('Responders & contacts');}}/><div className="map-bottom"><span><i className="legend-red"/> Critical</span><span><i className="legend-amber"/> Other incident</span><span><i className="legend-green"/> Unit</span><span>R = responder</span></div></section>}
      {page==='PUV fleet'&&<section className="panel"><div className="panel-heading"><div><h2>Registered motorcycles and tricycles</h2><p>Record the vehicle identity, driver, device, route and last reported GPS position.</p></div><button className="button button-primary" onClick={()=>setUnitModal(true)}><Plus size={15}/> Register vehicle</button></div><div className="table-wrap"><table><thead><tr><th>VEHICLE / NAME</th><th>TYPE / PLATE</th><th>DRIVER</th><th>DEVICE</th><th>LOCATION / ROUTE</th><th>STATUS</th></tr></thead><tbody>{units.map(u=><tr key={u.id}><td><b>{u.name}</b><small>{u.id}</small></td><td>{u.kind}<small>{u.plate}</small></td><td>{u.driver}<small>{u.driverPhone||'Phone not provided'}</small></td><td>{u.deviceId}<small>Battery {u.battery||'—'}%</small></td><td>{u.route}<small>{u.lat.toFixed(5)}, {u.lon.toFixed(5)}</small></td><td><span className={'tag '+(u.online?'tag-green':'tag-red')}>{u.online?'Online':'Offline'}</span><small>{u.lastSeen}</small></td></tr>)}</tbody></table>{!units.length&&<div className="empty-state">No vehicles registered yet. Select Register vehicle.</div>}</div><p className="panel-note">Online/offline is a demo state until the device sends authenticated heartbeats. New registrations start offline.</p></section>}
      {page==='Responders & contacts'&&<section className="panel"><div className="panel-heading"><div><h2>Responder and emergency contact directory</h2><p>Add verified MDRRMO/LGU contacts, authorized responders and registered emergency contacts.</p></div><button className="button button-primary" onClick={()=>setResponderModal(true)}><Plus size={15}/> Add contact</button></div><div className="responder-grid">{responders.map(r=><div className="responder-card" key={r.id}><div className="responder-top"><span className="metric-icon blue"><Users size={18}/></span><span className={'tag '+(r.available?'tag-green':'tag-red')}>{r.available?'Available':'Unavailable'}</span></div><h3>{r.name}</h3><p>{r.role}</p><small>{r.agency}</small><div className="responder-coords"><MapPin size={14}/>{r.lat.toFixed(5)}, {r.lon.toFixed(5)}</div><div className="responder-actions">{r.phone?<a className="button button-secondary" href={'tel:'+r.phone}><Phone size={14}/> Call {r.phone}</a>:<span className="tag tag-muted">Add verified phone</span>}<button className="text-button" onClick={()=>setNoticeFor('Verify this contact and location with the relevant agency before operational use.')}>Verify details</button></div></div>)}</div><p className="panel-note">Seed contact names are placeholders, not confirmed official personnel. Replace them with verified local contacts and correct coordinates before testing dispatch workflows.</p></section>}
      {page==='Device health'&&<section className="panel"><div className="panel-heading"><div><h2>Device heartbeat and battery</h2><p>Demo status until the embedded devices are connected.</p></div><button className="button button-secondary" onClick={()=>setNoticeFor('Heartbeat status cannot be refreshed without the device-ingestion backend.')}>Refresh status</button></div><div className="device-grid">{units.map(u=><div className="device-card" key={u.id}><div className="device-top"><div className="device-symbol"><RadioTower size={18}/></div><span className={'tag '+(u.online?'tag-green':'tag-red')}>{u.online?'Online':'Offline'}</span></div><h3>{u.name}</h3><p>{u.deviceId} · {u.kind}</p><div className="device-meter"><span style={{width:u.battery+'%'}}/></div><div className="device-foot"><span><Activity size={13}/> Battery {u.battery||'—'}%</span><span>{u.lastSeen}</span></div></div>)}</div></section>}
      {page==='Reports'&&<section className="panel"><div className="panel-heading"><div><h2>Incident reports</h2><p>Export locally stored prototype records.</p></div><button className="button button-primary" onClick={()=>{const rows=[['Incident','Vehicle','Vehicle type','Plate','Driver','Event','Priority','Status','Location','Latitude','Longitude','Created'],...incidents.map(i=>{const u=units.find(x=>x.id===i.unitId);return[i.id,u?.name??i.unitId,u?.kind??'',u?.plate??'',u?.driver??'',i.kind,i.priority,i.status,i.location,String(i.lat),String(i.lon),i.createdAt];})];const csv=rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));const a=document.createElement('a');a.href=url;a.download='puvguard-incidents.csv';a.click();URL.revokeObjectURL(url);}}> <Download size={15}/> Export CSV</button></div><div className="report-stats"><div><small>Registered units</small><b>{units.length}</b></div><div><small>Total incidents</small><b>{incidents.length}</b></div><div><small>Critical active</small><b>{incidents.filter(i=>i.priority==='Critical'&&i.status!=='Resolved').length}</b></div><div><small>Resolved</small><b>{incidents.filter(i=>i.status==='Resolved').length}</b></div></div>{incidentPanel(false)}</section>}
      {page==='Settings'&&<section className="panel integrations"><div className="panel-heading"><div><h2>Integrations and safety configuration</h2><p>Connect services only after setting up access controls and secure server-side ingestion.</p></div></div><div className="integration-row"><div className="integration-icon">X</div><div className="integration-copy"><b>Vaisala Xweather MapsGL</b><p>MapLibre base map and optional Xweather radar overlay.</p><small>Netlify environment: VITE_XWEATHER_CLIENT_ID and VITE_XWEATHER_CLIENT_SECRET. Restrict credentials to your deployed domain in Xweather.</small></div><span className="tag tag-muted">{import.meta.env.VITE_XWEATHER_CLIENT_ID?'Configured at build':'Needs credentials'}</span></div><div className="integration-row"><div className="integration-icon supa">S</div><div className="integration-copy"><b>Supabase</b><p>Planned database persistence, authenticated users, realtime device heartbeat and incident events.</p><small>Not connected. Browser localStorage is not shared between operators.</small></div><span className="tag tag-muted">Not connected</span></div><div className="integration-row"><div className="integration-icon cato">4G</div><div className="integration-copy"><b>Device ingestion / SMS</b><p>Backend endpoint needed to verify signed device events, store GPS, notify registered contacts with primary-to-secondary failover and audit dispatch.</p><small>Never place provider secrets in frontend code. Confirm the cellular/SMS provider and Cato API product/use case before implementing.</small></div><span className="tag tag-muted">Planned</span></div></section>}
      <footer className="footer"><span><ShieldCheck size={14}/> PUVGUARD · Motorcycle and tricycle safety prototype</span><span>Demo records only · Not an emergency dispatch service</span></footer>
      </div>
    </main>
    {unitModal&&<div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setUnitModal(false);}}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="unit-modal-title"><div className="modal-head"><div><h2 id="unit-modal-title">Register vehicle</h2><p>Use real assigned identifiers; coordinates are latitude and longitude.</p></div><button className="icon-button" onClick={()=>setUnitModal(false)} aria-label="Close"><X size={18}/></button></div><form onSubmit={registerUnit} className="form-grid"><label>Vehicle name / identifier<input required value={unitForm.name} onChange={e=>setUnitForm({...unitForm,name:e.target.value})} placeholder="e.g. Motorcycle 014"/></label><label>Vehicle type<select value={unitForm.kind} onChange={e=>setUnitForm({...unitForm,kind:e.target.value as VehicleKind})}><option>Motorcycle</option><option>Tricycle</option></select></label><label>Plate / registered ID<input required value={unitForm.plate} onChange={e=>setUnitForm({...unitForm,plate:e.target.value})} placeholder="Plate number or approved ID"/></label><label>Driver full name<input required value={unitForm.driver} onChange={e=>setUnitForm({...unitForm,driver:e.target.value})}/></label><label>Driver phone (optional)<input type="tel" value={unitForm.driverPhone} onChange={e=>setUnitForm({...unitForm,driverPhone:e.target.value})}/></label><label>Device ID<input required value={unitForm.deviceId} onChange={e=>setUnitForm({...unitForm,deviceId:e.target.value})} placeholder="Unique hardware ID"/></label><label>Route / operating area<input value={unitForm.route} onChange={e=>setUnitForm({...unitForm,route:e.target.value})}/></label><label>Last known latitude<input required type="number" step="any" value={unitForm.lat} onChange={e=>setUnitForm({...unitForm,lat:e.target.value})}/></label><label>Last known longitude<input required type="number" step="any" value={unitForm.lon} onChange={e=>setUnitForm({...unitForm,lon:e.target.value})}/></label><div className="modal-actions"><button type="button" className="button button-secondary" onClick={()=>setUnitModal(false)}>Cancel</button><button type="submit" className="button button-primary"><Plus size={15}/> Register unit</button></div><p className="form-note">Stored in this browser only. Live device registration and online/offline heartbeats require a backend.</p></form></section></div>}
    {responderModal&&<div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setResponderModal(false);}}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="responder-modal-title"><div className="modal-head"><div><h2 id="responder-modal-title">Add responder / contact</h2><p>Only enter verified official contact information.</p></div><button className="icon-button" onClick={()=>setResponderModal(false)} aria-label="Close"><X size={18}/></button></div><form onSubmit={registerResponder} className="form-grid"><label>Name<input required value={responderForm.name} onChange={e=>setResponderForm({...responderForm,name:e.target.value})}/></label><label>Role<select value={responderForm.role} onChange={e=>setResponderForm({...responderForm,role:e.target.value})}><option>Emergency coordination</option><option>Police / law enforcement</option><option>Medical / ambulance</option><option>Fire and rescue</option><option>Registered family contact</option><option>Road incident support</option></select></label><label>Agency / organization<input required value={responderForm.agency} onChange={e=>setResponderForm({...responderForm,agency:e.target.value})}/></label><label>Phone number<input type="tel" value={responderForm.phone} onChange={e=>setResponderForm({...responderForm,phone:e.target.value})} placeholder="Verified phone only"/></label><label>Latitude<input required type="number" step="any" value={responderForm.lat} onChange={e=>setResponderForm({...responderForm,lat:e.target.value})}/></label><label>Longitude<input required type="number" step="any" value={responderForm.lon} onChange={e=>setResponderForm({...responderForm,lon:e.target.value})}/></label><div className="modal-actions"><button type="button" className="button button-secondary" onClick={()=>setResponderModal(false)}>Cancel</button><button type="submit" className="button button-primary"><Plus size={15}/> Save contact</button></div></form></section></div>}
    {dispatchTarget&&<div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setDispatchTarget(null);}}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="dispatch-title"><div className="modal-head"><div><h2 id="dispatch-title">Nearest available contacts</h2><p>{dispatchTarget.id} · {dispatchTarget.kind} · {dispatchTarget.lat.toFixed(5)}, {dispatchTarget.lon.toFixed(5)}</p></div><button className="icon-button" onClick={()=>setDispatchTarget(null)} aria-label="Close"><X size={18}/></button></div><div className="dispatch-warning"><ShieldAlert size={17}/> Distance is straight-line approximation, not road travel time. This demo cannot send dispatch messages. Verify the emergency and follow official protocols.</div><div className="dispatch-list">{nearestResponders.map((r,index)=><div className="dispatch-row" key={r.id}><div className="dispatch-rank">{index+1}</div><div className="dispatch-copy"><b>{r.name}</b><p>{r.role} · {r.agency}</p><small>{r.distance.toFixed(2)} km straight-line · {r.phone||'No phone recorded'}</small></div><div className="dispatch-actions">{r.phone&&<a className="button button-secondary" href={'tel:'+r.phone}><Phone size={14}/> Call</a>}<a className="text-button" href={'https://www.google.com/maps/dir/?api=1&origin='+dispatchTarget.lat+','+dispatchTarget.lon+'&destination='+r.lat+','+r.lon} target="_blank" rel="noreferrer"><Navigation size={14}/> Route</a><button className="button button-primary" onClick={()=>dispatch(dispatchTarget,r)}>Assign</button></div></div>)}{!nearestResponders.length&&<div className="empty-state">No available contacts. Add and verify a responder first.</div>}</div><div className="modal-actions"><button className="button button-secondary" onClick={()=>setDispatchTarget(null)}>Close</button></div></section></div>}
  </div>;
}
export default App;
