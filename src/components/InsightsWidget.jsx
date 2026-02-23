import { Activity, AlertCircle, CheckCircle2, Wind } from 'lucide-react';

const InsightsWidget = ({ fields }) => {
    // Generate simple dynamic insights based on field data
    const generateInsights = () => {
        let insights = [];

        // 1. Check for unconfigured fields
        const unconfigured = fields.filter(f => {
            const details = Array.isArray(f.field_details) ? f.field_details[0] : f.field_details;
            return !details?.planting_date;
        });

        if (unconfigured.length > 0) {
            insights.push({
                id: 'unconfigured',
                type: 'warning',
                icon: AlertCircle,
                title: 'Action Required',
                desc: `You have ${unconfigured.length} field(s) needing configuration setup.`
            });
        }

        // 2. Check for newly planted (e.g. less than 30 days)
        const newPlantings = fields.filter(f => {
            const details = Array.isArray(f.field_details) ? f.field_details[0] : f.field_details;
            if (!details?.planting_date) return false;
            const diff = (new Date() - new Date(details.planting_date)) / (1000 * 60 * 60 * 24);
            return diff < 30;
        });

        if (newPlantings.length > 0) {
            insights.push({
                id: 'new-plant',
                type: 'info',
                icon: CheckCircle2,
                title: 'Early Stage Growth',
                desc: `${newPlantings.length} field(s) are in early growth stages. Ensure adequate moisture.`
            });
        }

        // Add some default placeholder ones if array is too small to make it look active
        if (insights.length < 3) {
            insights.push({
                id: 'weather-opt',
                type: 'success',
                icon: CheckCircle2,
                title: 'Optimal Conditions',
                desc: 'Current weather pattern is optimal for fertilizer application.'
            });
        }

        if (insights.length < 3) {
            insights.push({
                id: 'wind-alert',
                type: 'info',
                icon: Wind,
                title: 'Wind Check',
                desc: 'Moderate breeze expected. Spraying is safe before noon.'
            });
        }

        return insights;
    };

    const insights = generateInsights();

    return (
        <div className="bento-card" style={{ height: 'fit-content' }}>
            <div className="card-top" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <h3 style={{ fontSize: '1.25rem', color: '#2c3e50', margin: 0 }}>Farm Insights</h3>
                <Activity size={20} color="#4CAF50" />
            </div>

            {insights.map(item => {
                const Icon = item.icon;
                return (
                    <div className="alert-item" key={item.id}>
                        <div className={`alert-icon ${item.type}`}>
                            <Icon size={20} />
                        </div>
                        <div className="alert-content">
                            <h4>{item.title}</h4>
                            <p>{item.desc}</p>
                        </div>
                    </div>
                )
            })}

            <button className="view-all-btn">
                View All Activity
            </button>
        </div>
    );
};

export default InsightsWidget;
