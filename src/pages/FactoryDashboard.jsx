import { Link } from 'react-router-dom';
import StatsCard from '../components/StatsCard';
import FactoryMap from '../components/FactoryMap';
import { Users, Sprout, TrendingUp, Tractor } from 'lucide-react';

const FactoryDashboard = () => {
  // Dummy Data for Factory View
  const stats = [
    { title: 'Total Farmers', value: '1,248', unit: '', trend: 'up', trendValue: '12%', icon: Users, color: '#3498db' },
    { title: 'Total Acreage', value: '450', unit: 'Acres', trend: 'up', trendValue: '8%', icon: Sprout, color: '#2ecc71' },
    { title: 'Est. Yield', value: '28,500', unit: 'Tons', trend: 'down', trendValue: '2%', icon: TrendingUp, color: '#e67e22' },
    { title: 'Active Tractors', value: '42', unit: '', trend: 'up', trendValue: '5%', icon: Tractor, color: '#9b59b6' },
  ];

  const recentActivity = [
    { id: 1, name: 'Ramesh Patil', action: 'Added new field', time: '2 hours ago', type: 'new' },
    { id: 2, name: 'Suresh More', action: 'Updated harvest date', time: '5 hours ago', type: 'update' },
    { id: 3, name: 'Vikas Deshmukh', action: 'Registered', time: '1 day ago', type: 'new' },
    { id: 4, name: 'Anjali Pawar', action: 'Added 2 fields', time: '1 day ago', type: 'new' },
  ];

  // Dummy Polygons for Map (Around Ahmednagar)
  const dummyFields = [
    {
      id: 1,
      name: 'Field A',
      farmerName: 'Ramesh Patil',
      acreage: 4.5,
      coordinates: [[19.1, 74.7], [19.11, 74.71], [19.12, 74.7], [19.1, 74.7]], // Simple Triangle
      color: '#2ecc71'
    },
    {
      id: 2,
      name: 'Field B',
      farmerName: 'Suresh More',
      acreage: 2.1,
      coordinates: [[19.08, 74.72], [19.09, 74.73], [19.09, 74.71], [19.08, 74.72]],
      color: '#f1c40f'
    },
    {
      id: 3,
      name: 'Field C',
      farmerName: 'Vikas Deshmukh',
      acreage: 6.8,
      coordinates: [[19.15, 74.68], [19.16, 74.69], [19.17, 74.67], [19.15, 74.68]],
      color: '#e74c3c'
    }
  ];

  return (
    <div className="dashboard-container">

      {/* Header */}
      <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" className="back-btn">←</Link>
          <div>
            <h1 className="page-title" style={{ margin: 0, fontSize: '1.8rem' }}>Factory Portal 🏭</h1>
            <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>Overview of supply chain and field operations</p>
          </div>
        </div>
        <div className="date-badge">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {stats.map((stat, i) => (
          <StatsCard key={i} {...stat} />
        ))}
      </div>

      {/* Main Content Grid: Map & Activity */}
      <div className="dashboard-grid-layout" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', height: '500px' }}>

        {/* Map Section */}
        <div className="bento-card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
            <h3 style={{ margin: 0 }}>Live Field Map</h3>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <FactoryMap fields={dummyFields} />
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bento-card">
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Recent Activity</h3>
          <div className="activity-feed">
            {recentActivity.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: '0.8rem', paddingBottom: '1rem', marginBottom: '1rem', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: item.type === 'new' ? '#e8f5e9' : '#fff3e0',
                  color: item.type === 'new' ? '#2ecc71' : '#f39c12',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', fontSize: '0.8rem'
                }}>
                  {item.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 500 }}>{item.name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>{item.action}</div>
                  <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.2rem' }}>{item.time}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="btn-secondary" style={{ width: '100%', marginTop: 'auto' }}>View Full Report</button>
        </div>

      </div>

    </div>
  );
}

export default FactoryDashboard;
