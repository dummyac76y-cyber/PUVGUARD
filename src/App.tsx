import { useMemo, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BusFront,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Cloud,
  Command,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Gauge,
  LayoutDashboard,
  LifeBuoy,
  MapPin,
  Menu,
  MoreHorizontal,
  RadioTower,
  Search,
  Settings2,
  Shield,
  ShieldCheck,
  Siren,
  SlidersHorizontal,
  Smartphone,
  Users,
  Wifi,
  X,
  Zap,
} from 'lucide-react';

type Incident = {
  id: string;
  vehicle: string;
  route: string;
  type: string;
  priority: 'Critical' | 'High' | 'Medium';
  status: string;
  location: string;
  time: string;
  age: string;
  detail: string;
};
const initialIncidents: Incident[] = [
  {
    id: 'INC-2026-0142',
    vehicle: 'PUV-018',
    route: 'Kalibo–Banga',
    type: 'Automatic crash alert',
    priority: 'Critical',
    status: 'New alert',
    location: 'Osmeña Avenue, Kalibo',
    time: '02:18:42',
    age: 'Just now',
    detail: 'Impact pattern detected; awaiting operator verification.',
  },
  {
    id: 'INC-2026-0141',
    vehicle: 'PUV-006',
    route: 'Kalibo–Numancia',
    type: 'Driver assistance',
    priority: 'High',
    status: 'Verification',
    location: 'National Highway, Andagao',
    time: '02:12:08',
    age: '6 min ago',
    detail: 'Discreet assistance request received from the driver.',
  },
  {
    id: 'INC-2026-0140',
    vehicle: 'PUV-023',
    route: 'Kalibo town route',
    type: 'Manual SOS',
    priority: 'High',
    status: 'Acknowledged',
    location: 'Tigayon junction, Kalibo',
    time: '01:56:31',
    age: '22 min ago',
    detail: 'Manual SOS received; staff acknowledgment recorded.',
  },
  {
    id: 'INC-2026-0139',
    vehicle: 'PUV-011',
    route: 'Kalibo–New Washington',
    type: 'Device offline',
    priority: 'Medium',
    status: 'Monitoring',
    location: 'Last known: Mabilo',
    time: '01:44:17',
    age: '36 min ago',
    detail: 'No recent device heartbeat. Location is not live.',
  },
];
const nav = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Incident center', icon: Siren, count: '3' },
  { label: 'Live map', icon: MapPin },
  { label: 'PUV fleet', icon: BusFront },
  { label: 'Device health', icon: RadioTower },
  { label: 'Reports', icon: FileText },
];
function App() {
  const [page, setPage] = useState('Overview');
  const [selected, setSelected] = useState('INC-2026-0142');
  const [incidents, setIncidents] = useState(initialIncidents);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All incidents');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const active = incidents.find(i => i.id === selected) ?? incidents[0];
  const filtered = useMemo(
    () =>
      incidents.filter(
        i =>
          [i.id, i.vehicle, i.route, i.type, i.location, i.status]
            .join(' ')
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (filter === 'All incidents' ||
            i.priority === filter ||
            i.status === filter)
      ),
    [incidents, query, filter]
  );
  function acknowledge(id: string) {
    setIncidents(prev =>
      prev.map(i => (i.id === id ? { ...i, status: 'Acknowledged' } : i))
    );
    setNotice(
      id +
        ' acknowledged. This is a local demo action; it has not notified real responders.'
    );
    setTimeout(() => setNotice(''), 5000);
  }
  function resolve(id: string) {
    setIncidents(prev =>
      prev.map(i => (i.id === id ? { ...i, status: 'Resolved' } : i))
    );
    setNotice(
      id + ' marked resolved in this demo. No real incident record was sent.'
    );
    setTimeout(() => setNotice(''), 5000);
  }
  const pageTitle = page === 'Overview' ? 'Operations overview' : page;
  return (
    <div className="shell">
      {sidebarOpen && (
        <button
          className="scrim"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={'sidebar ' + (sidebarOpen ? 'sidebar-open' : '')}>
        <div className="brand">
          <div className="brand-mark">
            <ShieldCheck size={23} />
          </div>
          <div>
            <b>
              PUV<span>GUARD</span>
            </b>
            <small>EMERGENCY OPERATIONS</small>
          </div>
          <button
            className="icon-button mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        <div className="workspace">
          <div className="workspace-icon">
            <Shield size={16} />
          </div>
          <div>
            <strong>MDRRMO</strong>
            <small>Monitoring workspace</small>
          </div>
          <ChevronDown size={15} className="muted-icon" />
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav>
          {nav.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => {
                  setPage(item.label);
                  setSidebarOpen(false);
                }}
                className={
                  'nav-item ' + (page === item.label ? 'nav-active' : '')
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.count && <em>{item.count}</em>}
                {page === item.label && <i />}
              </button>
            );
          })}
        </nav>
        <div className="nav-caption tools-caption">SYSTEM</div>
        <button
          className={
            'nav-item ' + (page === 'User management' ? 'nav-active' : '')
          }
          onClick={() => {
            setPage('User management');
            setSidebarOpen(false);
          }}
        >
          <Users size={18} />
          <span>User management</span>
        </button>
        <button
          className={'nav-item ' + (page === 'Settings' ? 'nav-active' : '')}
          onClick={() => {
            setPage('Settings');
            setSidebarOpen(false);
          }}
        >
          <Settings2 size={18} />
          <span>Settings & integrations</span>
        </button>
        <div className="sidebar-bottom">
          <div className="connection">
            <span className="pulse-dot" />
            <div>
              <b>Demo environment</b>
              <small>External services not connected</small>
            </div>
          </div>
          <div className="user-card">
            <div className="avatar">MD</div>
            <div className="user-info">
              <b>MDRRMO Staff</b>
              <small>Demo administrator</small>
            </div>
            <MoreHorizontal size={18} className="muted-icon" />
          </div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="top-left">
            <button
              className="icon-button menu-toggle"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="breadcrumb">
              PUVGUARD <ChevronRight size={14} /> <span>{page}</span>
            </div>
          </div>
          <div className="top-actions">
            <div className="system-status">
              <span className="pulse-dot" /> Demo mode
            </div>
            <button
              className="icon-button notification-button"
              aria-label="Notifications"
              onClick={() =>
                setNotice(
                  'Notifications are demo-only until backend integration is configured.'
                )
              }
            >
              <Bell size={18} />
              <i />
            </button>
            <div className="top-avatar">MD</div>
          </div>
        </header>
        <div className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" /> MDRRMO COMMAND CENTER
              </div>
              <h1>
                {pageTitle}
                <span className="live-pill">
                  <span className="pulse-dot" /> PREVIEW
                </span>
              </h1>
              <p>
                Public utility vehicle safety monitoring and incident
                coordination.
              </p>
            </div>
            <div className="heading-actions">
              <button
                className="button button-secondary"
                onClick={() => {
                  setQuery('');
                  setFilter('All incidents');
                  setNotice('Filters reset.');
                }}
              >
                <SlidersHorizontal size={16} /> Reset filters
              </button>
              <button
                className="button button-primary"
                onClick={() => setPage('Incident center')}
              >
                <Siren size={16} /> Open incidents
              </button>
            </div>
          </div>
          {notice && (
            <div className="notice">
              <CheckCircle2 size={17} />
              <span>{notice}</span>
              <button onClick={() => setNotice('')} aria-label="Dismiss notice">
                <X size={16} />
              </button>
            </div>
          )}
          {page === 'Settings & integrations' || page === 'Settings' ? (
            <section className="panel integrations">
              <div className="panel-heading">
                <div>
                  <h2>Integrations</h2>
                  <p>
                    Connect production services when your credentials are ready.
                  </p>
                </div>
                <span className="tag tag-muted">Not configured</span>
              </div>
              <div className="integration-row">
                <div className="integration-icon supa">S</div>
                <div className="integration-copy">
                  <b>Supabase</b>
                  <p>
                    Authentication, PostgreSQL database, realtime incident
                    updates and row-level security.
                  </p>
                  <small>
                    Expected variables: VITE_SUPABASE_URL ·
                    VITE_SUPABASE_ANON_KEY
                  </small>
                </div>
                <span className="tag tag-muted">Disconnected</span>
              </div>
              <div className="integration-row">
                <div className="integration-icon cato">C</div>
                <div className="integration-copy">
                  <b>Cato.com API</b>
                  <p>
                    Integration placeholder. Confirm the exact Cato API/product
                    and supported use case before implementing requests.
                  </p>
                  <small>
                    Keep API credentials server-side; never place private keys
                    in frontend variables.
                  </small>
                </div>
                <span className="tag tag-muted">Disconnected</span>
              </div>
              <div className="integration-row">
                <div className="integration-icon">
                  <Cloud size={20} />
                </div>
                <div className="integration-copy">
                  <b>Incident ingestion API</b>
                  <p>
                    Reserved for authenticated device event delivery, validation
                    and duplicate protection.
                  </p>
                  <small>
                    No live device events are being received in this preview.
                  </small>
                </div>
                <span className="tag tag-muted">Planned</span>
              </div>
            </section>
          ) : page === 'PUV fleet' ? (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Registered PUV units</h2>
                  <p>
                    Illustrative fleet inventory — replace with approved
                    records.
                  </p>
                </div>
                <button
                  className="button button-secondary"
                  onClick={() =>
                    setNotice(
                      'Fleet creation will be enabled after database integration.'
                    )
                  }
                >
                  <BusFront size={15} /> Register unit
                </button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>UNIT</th>
                      <th>ROUTE</th>
                      <th>DEVICE</th>
                      <th>LAST REPORT</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      [
                        'PUV-018',
                        'Kalibo–Banga',
                        'DEV-018',
                        'Just now',
                        'Connected',
                      ],
                      [
                        'PUV-006',
                        'Kalibo–Numancia',
                        'DEV-006',
                        '2 min ago',
                        'Connected',
                      ],
                      [
                        'PUV-023',
                        'Kalibo town route',
                        'DEV-023',
                        '4 min ago',
                        'Connected',
                      ],
                      [
                        'PUV-011',
                        'Kalibo–New Washington',
                        'DEV-011',
                        '36 min ago',
                        'Offline',
                      ],
                    ].map(r => (
                      <tr key={r[0]}>
                        <td>
                          <b>{r[0]}</b>
                          <small>Public utility vehicle</small>
                        </td>
                        <td>{r[1]}</td>
                        <td>{r[2]}</td>
                        <td>{r[3]}</td>
                        <td>
                          <span
                            className={
                              'status-dot ' +
                              (r[4] === 'Offline' ? 'status-red' : '')
                            }
                          />
                          {r[4]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : page === 'Device health' ? (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Device health</h2>
                  <p>Heartbeat status in sample data only.</p>
                </div>
                <span className="tag tag-muted">No hardware link</span>
              </div>
              <div className="device-grid">
                {[
                  ['PUV-018', 'Online', '82%', 'LTE / GPS'],
                  ['PUV-006', 'Online', '76%', 'LTE / GPS'],
                  ['PUV-023', 'Online', '91%', 'LTE / GPS'],
                  ['PUV-011', 'Offline', '—', 'No heartbeat'],
                ].map(d => (
                  <div className="device-card" key={d[0]}>
                    <div className="device-top">
                      <div className="device-symbol">
                        <RadioTower size={18} />
                      </div>
                      <span
                        className={
                          'tag ' + (d[1] === 'Online' ? 'tag-green' : 'tag-red')
                        }
                      >
                        {d[1]}
                      </span>
                    </div>
                    <h3>{d[0]}</h3>
                    <p>Assigned emergency unit</p>
                    <div className="device-meter">
                      <span style={{ width: d[2] === '—' ? '0%' : d[2] }} />
                    </div>
                    <div className="device-foot">
                      <span>
                        <Gauge size={13} /> Battery {d[2]}
                      </span>
                      <span>{d[3]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : page === 'Reports' ? (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Incident reporting</h2>
                  <p>Summary calculated from the sample incident set.</p>
                </div>
                <button
                  className="button button-secondary"
                  onClick={() => {
                    const csv =
                      'Incident,Vehicle,Type,Priority,Status,Location\n' +
                      incidents
                        .map(i =>
                          [
                            i.id,
                            i.vehicle,
                            i.type,
                            i.priority,
                            i.status,
                            i.location,
                          ]
                            .map(v => '"' + v.replaceAll('"', '""') + '"')
                            .join(',')
                        )
                        .join('\n');
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(
                      new Blob([csv], { type: 'text/csv' })
                    );
                    a.download = 'puvguard-demo-incidents.csv';
                    a.click();
                    URL.revokeObjectURL(a.href);
                  }}
                >
                  <Download size={15} /> Export demo CSV
                </button>
              </div>
              <div className="report-stats">
                <div>
                  <small>Total sample events</small>
                  <b>{incidents.length}</b>
                </div>
                <div>
                  <small>Critical priority</small>
                  <b>
                    {incidents.filter(i => i.priority === 'Critical').length}
                  </b>
                </div>
                <div>
                  <small>Awaiting action</small>
                  <b>
                    {incidents.filter(i => i.status === 'New alert').length}
                  </b>
                </div>
                <div>
                  <small>Resolved (demo)</small>
                  <b>{incidents.filter(i => i.status === 'Resolved').length}</b>
                </div>
              </div>
              <p className="footnote">
                Export contains only the illustrative records shown in this
                browser demo.
              </p>
            </section>
          ) : page === 'User management' ? (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Access roles</h2>
                  <p>
                    Proposed least-privilege roles. Authentication is not yet
                    connected.
                  </p>
                </div>
                <span className="tag tag-muted">Preview</span>
              </div>
              {[
                [
                  'System administrator',
                  'Manage accounts, devices, configuration and approved exports.',
                ],
                [
                  'MDRRMO dispatcher',
                  'Review and acknowledge incidents; record coordination actions.',
                ],
                [
                  'MDRRMO supervisor',
                  'Oversee incident activity and access authorized reports.',
                ],
                [
                  'PUV operator',
                  'View only approved records for their assigned fleet.',
                ],
                ['Research evaluator', 'Review approved prototype test data.'],
              ].map(r => (
                <div className="role-row" key={r[0]}>
                  <div className="role-icon">
                    <Users size={17} />
                  </div>
                  <div>
                    <b>{r[0]}</b>
                    <p>{r[1]}</p>
                  </div>
                  <span className="tag tag-muted">Planned</span>
                </div>
              ))}
            </section>
          ) : page === 'Live map' ? (
            <section className="panel map-page">
              <div className="panel-heading">
                <div>
                  <h2>Incident location overview</h2>
                  <p>
                    Schematic map only. No actual GPS coordinates are connected.
                  </p>
                </div>
                <span className="tag tag-amber">
                  <MapPin size={12} /> Illustrative
                </span>
              </div>
              <div className="schematic-map">
                <div className="map-road road-one" />
                <div className="map-road road-two" />
                <div className="map-road road-three" />
                <div className="map-road road-four" />
                <div className="map-water" />
                <div className="map-label label-one">KALIBO TOWN CENTER</div>
                <div className="map-label label-two">NATIONAL HIGHWAY</div>
                {[
                  { x: '23%', y: '48%', c: 'red', t: 'PUV-018' },
                  { x: '61%', y: '28%', c: 'amber', t: 'PUV-006' },
                  { x: '72%', y: '66%', c: 'green', t: 'PUV-023' },
                ].map(m => (
                  <div
                    key={m.t}
                    className={'map-pin pin-' + m.c}
                    style={{ left: m.x, top: m.y }}
                  >
                    <MapPin size={19} />
                    <span>{m.t}</span>
                  </div>
                ))}
              </div>
              <div className="map-legend">
                <span>
                  <i className="legend-red" /> Critical incident
                </span>
                <span>
                  <i className="legend-amber" /> Needs review
                </span>
                <span>
                  <i className="legend-green" /> Other unit
                </span>
              </div>
            </section>
          ) : (
            <>
              <section className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-top">
                    <span>ACTIVE INCIDENTS</span>
                    <span className="metric-icon red">
                      <AlertOctagon size={18} />
                    </span>
                  </div>
                  <div className="metric-value">
                    {
                      incidents.filter(
                        i => !['Resolved', 'Cancelled'].includes(i.status)
                      ).length
                    }
                    <span className="metric-trend trend-red">
                      <ArrowUpRight size={14} /> Monitor
                    </span>
                  </div>
                  <div className="metric-foot">
                    <span className="status-dot status-red" /> Incidents not yet
                    closed
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-top">
                    <span>REGISTERED PUVS</span>
                    <span className="metric-icon blue">
                      <BusFront size={18} />
                    </span>
                  </div>
                  <div className="metric-value">
                    24
                    <span className="metric-trend trend-blue">Demo fleet</span>
                  </div>
                  <div className="metric-foot">
                    <span className="status-dot" /> Vehicle count is
                    illustrative
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-top">
                    <span>DEVICES ONLINE</span>
                    <span className="metric-icon green">
                      <RadioTower size={18} />
                    </span>
                  </div>
                  <div className="metric-value">
                    23
                    <span className="metric-trend trend-green">
                      <ArrowUpRight size={14} /> Sample
                    </span>
                  </div>
                  <div className="metric-foot">
                    <span className="status-dot" /> No live device connection
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-top">
                    <span>NEEDS ACKNOWLEDGMENT</span>
                    <span className="metric-icon amber">
                      <Clock3 size={18} />
                    </span>
                  </div>
                  <div className="metric-value">
                    {incidents.filter(i => i.status === 'New alert').length}
                    <span className="metric-trend trend-amber">
                      Priority queue
                    </span>
                  </div>
                  <div className="metric-foot">
                    <span className="status-dot status-amber" /> Review and
                    verify
                  </div>
                </div>
              </section>
              <section className="primary-grid">
                <div className="panel map-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Incident overview</h2>
                      <p>Location preview · schematic only</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setPage('Live map')}
                    >
                      Open map <ExternalLink size={13} />
                    </button>
                  </div>
                  <div className="mini-map">
                    <div className="map-road road-one" />
                    <div className="map-road road-two" />
                    <div className="map-road road-three" />
                    <div className="map-road road-four" />
                    <div className="map-water" />
                    <div className="map-label label-one">
                      KALIBO TOWN CENTER
                    </div>
                    <div className="map-label label-two">NATIONAL HIGHWAY</div>
                    {[
                      { x: '23%', y: '48%', c: 'red', t: 'PUV-018' },
                      { x: '61%', y: '28%', c: 'amber', t: 'PUV-006' },
                      { x: '72%', y: '66%', c: 'green', t: 'PUV-023' },
                    ].map(m => (
                      <button
                        key={m.t}
                        className={'map-pin pin-' + m.c}
                        style={{ left: m.x, top: m.y }}
                        onClick={() => {
                          const item = incidents.find(i => i.vehicle === m.t);
                          if (item) setSelected(item.id);
                        }}
                      >
                        <MapPin size={18} />
                        <span>{m.t}</span>
                      </button>
                    ))}
                  </div>
                  <div className="map-bottom">
                    <span>
                      <i className="legend-red" /> Critical
                    </span>
                    <span>
                      <i className="legend-amber" /> Review
                    </span>
                    <span>
                      <i className="legend-green" /> Other unit
                    </span>
                    <span className="map-note">Sample positions only</span>
                  </div>
                </div>
                <div className="panel activity-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Response activity</h2>
                      <p>Recent event timeline</p>
                    </div>
                    <button
                      className="icon-button"
                      aria-label="More activity"
                      onClick={() => setPage('Incident center')}
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                  <div className="timeline">
                    <div className="timeline-item">
                      <div className="timeline-icon danger">
                        <AlertTriangle size={15} />
                      </div>
                      <div>
                        <b>Crash alert received</b>
                        <p>PUV-018 · Osmeña Avenue</p>
                        <small>02:18:42 · Awaiting acknowledgment</small>
                      </div>
                    </div>
                    <div className="timeline-item">
                      <div className="timeline-icon warning">
                        <Smartphone size={15} />
                      </div>
                      <div>
                        <b>Assistance request</b>
                        <p>PUV-006 · Andagao</p>
                        <small>02:12:08 · Verification in progress</small>
                      </div>
                    </div>
                    <div className="timeline-item">
                      <div className="timeline-icon info">
                        <Check size={15} />
                      </div>
                      <div>
                        <b>Alert acknowledged</b>
                        <p>PUV-023 · Tigayon junction</p>
                        <small>01:56:48 · Demo record</small>
                      </div>
                    </div>
                  </div>
                  <button
                    className="activity-link"
                    onClick={() => setPage('Incident center')}
                  >
                    View all incidents <ChevronRight size={15} />
                  </button>
                </div>
              </section>
              <section className="panel incidents-panel">
                <div className="panel-heading incident-heading">
                  <div>
                    <h2>
                      Incident queue{' '}
                      <span className="count-bubble">{filtered.length}</span>
                    </h2>
                    <p>Prioritize incoming alerts and track follow-up.</p>
                  </div>
                  <button
                    className="button button-secondary"
                    onClick={() => setPage('Incident center')}
                  >
                    <Filter size={15} /> Full queue
                  </button>
                </div>
                <div className="table-controls">
                  <div className="searchbox">
                    <Search size={16} />
                    <input
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="Search vehicle, incident, location…"
                    />
                  </div>
                  <select
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    aria-label="Filter incidents"
                  >
                    <option>All incidents</option>
                    <option>Critical</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>New alert</option>
                    <option>Acknowledged</option>
                    <option>Resolved</option>
                  </select>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>INCIDENT / UNIT</th>
                        <th>EVENT TYPE</th>
                        <th>LOCATION</th>
                        <th>PRIORITY</th>
                        <th>STATUS</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(i => (
                        <tr
                          key={i.id}
                          onClick={() => setSelected(i.id)}
                          className={selected === i.id ? 'selected-row' : ''}
                        >
                          <td>
                            <b>{i.id}</b>
                            <small>
                              {i.vehicle} · {i.route}
                            </small>
                          </td>
                          <td>
                            <span className="event-cell">
                              <span
                                className={
                                  'event-icon ' +
                                  (i.priority === 'Critical'
                                    ? 'event-red'
                                    : i.type === 'Manual SOS'
                                      ? 'event-amber'
                                      : 'event-blue')
                                }
                              >
                                {i.priority === 'Critical' ? (
                                  <AlertOctagon size={15} />
                                ) : i.type === 'Device offline' ? (
                                  <Wifi size={15} />
                                ) : (
                                  <LifeBuoy size={15} />
                                )}
                              </span>
                              {i.type}
                            </span>
                          </td>
                          <td>
                            {i.location}
                            <small>{i.age}</small>
                          </td>
                          <td>
                            <span
                              className={
                                'priority priority-' + i.priority.toLowerCase()
                              }
                            >
                              <i />
                              {i.priority}
                            </span>
                          </td>
                          <td>
                            <span
                              className={
                                'status-tag ' +
                                (i.status === 'New alert'
                                  ? 'status-new'
                                  : i.status === 'Resolved'
                                    ? 'status-resolved'
                                    : i.status === 'Acknowledged'
                                      ? 'status-ack'
                                      : 'status-review')
                              }
                            >
                              {i.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="row-open"
                              aria-label={'View ' + i.id}
                              onClick={e => {
                                e.stopPropagation();
                                setSelected(i.id);
                              }}
                            >
                              <ChevronRight size={17} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filtered.length === 0 && (
                    <div className="empty-state">
                      No incidents match the current search and filter.
                    </div>
                  )}
                </div>
                <div className="table-footer">
                  <span>
                    Showing {filtered.length} of {incidents.length} sample
                    incidents
                  </span>
                  <span>Updates are local to this preview</span>
                </div>
              </section>
              <section className="detail-panel panel">
                <div className="detail-head">
                  <div>
                    <div className="eyebrow">SELECTED INCIDENT</div>
                    <h2>
                      {active.id}{' '}
                      <span
                        className={
                          'priority priority-' + active.priority.toLowerCase()
                        }
                      >
                        <i />
                        {active.priority}
                      </span>
                    </h2>
                    <p>{active.detail}</p>
                  </div>
                  <span className="status-tag status-review">
                    {active.status}
                  </span>
                </div>
                <div className="detail-grid">
                  <div>
                    <small>PUV UNIT</small>
                    <b>
                      <BusFront size={15} />
                      {active.vehicle}
                    </b>
                  </div>
                  <div>
                    <small>EVENT TYPE</small>
                    <b>
                      <AlertTriangle size={15} />
                      {active.type}
                    </b>
                  </div>
                  <div>
                    <small>LAST KNOWN LOCATION</small>
                    <b>
                      <MapPin size={15} />
                      {active.location}
                    </b>
                  </div>
                  <div>
                    <small>DEVICE EVENT TIME</small>
                    <b>
                      <Clock3 size={15} />
                      {active.time}
                    </b>
                  </div>
                </div>
                <div className="detail-actions">
                  <span>
                    <ShieldCheck size={15} /> Actions are demo-only; no real
                    dispatch occurs.
                  </span>
                  <div>
                    {active.status !== 'Acknowledged' &&
                      active.status !== 'Resolved' && (
                        <button
                          className="button button-primary"
                          onClick={() => acknowledge(active.id)}
                        >
                          <CheckCircle2 size={15} /> Acknowledge
                        </button>
                      )}
                    {active.status !== 'Resolved' && (
                      <button
                        className="button button-secondary"
                        onClick={() => resolve(active.id)}
                      >
                        Mark resolved
                      </button>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}
          <footer className="footer">
            <span>
              <ShieldCheck size={14} /> PUVGUARD{' '}
              <span className="footer-sep">·</span> Emergency monitoring
              prototype
            </span>
            <span>
              Demo data only <span className="footer-sep">·</span> Not connected
              to emergency services
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}
export default App;
