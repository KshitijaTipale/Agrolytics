import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const StatsCard = ({ title, value, unit, trend, trendValue, icon: Icon, color }) => {
    const getTrendIcon = () => {
        if (trend === 'up') return <ArrowUpRight size={16} />;
        if (trend === 'down') return <ArrowDownRight size={16} />;
        return <Minus size={16} />;
    };

    const getTrendColor = () => {
        if (trend === 'up') return '#2ecc71';
        if (trend === 'down') return '#e74c3c';
        return '#95a5a6';
    };

    return (
        <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>{title}</span>
                <div style={{
                    background: `${color}20`,
                    padding: '8px',
                    borderRadius: '8px',
                    color: color
                }}>
                    <Icon size={20} />
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                <h2 style={{ fontSize: '2rem', margin: 0, fontWeight: 700 }}>{value}</h2>
                {unit && <span style={{ color: '#888', fontSize: '0.9rem' }}>{unit}</span>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: 'auto', fontSize: '0.85rem' }}>
                <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: getTrendColor(),
                    fontWeight: 600,
                    background: `${getTrendColor()}15`,
                    padding: '2px 6px',
                    borderRadius: '4px'
                }}>
                    {getTrendIcon()} {trendValue}
                </span>
                <span style={{ color: '#999' }}>vs last month</span>
            </div>
        </div>
    );
};

export default StatsCard;
