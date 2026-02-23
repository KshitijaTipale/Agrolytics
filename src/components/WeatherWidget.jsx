import { useState, useEffect } from 'react';
import { CloudSun, Droplets, Wind, Sun, CloudRain, CloudLightning, CloudSnow } from 'lucide-react';

const WeatherWidget = () => {
    const [weather, setWeather] = useState({
        temp: '--',
        condition: 'Fetching...',
        humidity: '--',
        wind: '--',
        icon: CloudSun,
        color: '#f59e0b'
    });

    useEffect(() => {
        const fetchWeather = async (lat = 19.0952, lon = 74.7496) => { // Default: Ahmednagar, MH
            try {
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relative_humidity_2m`);
                if (!res.ok) throw new Error("Failed to fetch");

                const data = await res.json();

                const temp = data.current_weather.temperature;
                const windspeed = data.current_weather.windspeed;
                const code = data.current_weather.weathercode;

                // Get current hour's humidity roughly
                const currentHourIndex = new Date().getHours();
                const humidity = data.hourly?.relative_humidity_2m?.[currentHourIndex] || 45;

                // WMO Weather interpretation codes
                let condition = "Clear";
                let IconContext = Sun;
                let color = "#f59e0b"; // orange/sun

                if (code === 0) { condition = "Clear Sky"; IconContext = Sun; color = "#f59e0b"; }
                else if (code >= 1 && code <= 3) { condition = "Partly Cloudy"; IconContext = CloudSun; color = "#60a5fa"; }
                else if (code >= 45 && code <= 48) { condition = "Foggy"; IconContext = Wind; color = "#9ca3af"; }
                else if (code >= 51 && code <= 67) { condition = "Rainy"; IconContext = CloudRain; color = "#3b82f6"; }
                else if (code >= 71 && code <= 77) { condition = "Snow"; IconContext = CloudSnow; color = "#93c5fd"; }
                else if (code >= 80 && code <= 82) { condition = "Showers"; IconContext = CloudRain; color = "#2563eb"; }
                else if (code >= 95) { condition = "Thunderstorm"; IconContext = CloudLightning; color = "#7c3aed"; }

                setWeather({
                    temp,
                    condition,
                    humidity,
                    wind: windspeed,
                    icon: IconContext,
                    color
                });
            } catch (err) {
                console.error("Weather fetch error:", err);
                // Fallback to static mock data if offline/error
                setWeather({ temp: 28, condition: 'Sunny & Clear', humidity: 45, wind: 12, icon: CloudSun, color: '#f59e0b' });
            }
        };

        // Attempt to get user location, otherwise fallback
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
                () => fetchWeather() // Error (e.g. denied), use default
            );
        } else {
            fetchWeather();
        }
    }, []);

    const WeatherIcon = weather.icon;

    return (
        <div className="bento-card widget-card">
            <div className="card-label">Current Weather</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                <WeatherIcon size={40} color={weather.color} />
                <div>
                    <div className="info-value">{weather.temp}°C</div>
                    <div className="subtext">{weather.condition}</div>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <div className="weather-pill"><Droplets size={14} color="#0288d1" /> {weather.humidity}%</div>
                <div className="weather-pill"><Wind size={14} color="#00897b" /> {weather.wind} km/h</div>
            </div>
        </div>
    );
};

export default WeatherWidget;
