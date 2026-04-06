"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudRain, Sun, Droplets, MapPin, Wind, ArrowUp, ArrowDown } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip, XAxis } from "recharts";

interface HourlyData {
  timeAbbr: string;
  temp: number;
}

interface WeatherData {
  temp: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  tempMax: number;
  tempMin: number;
  hourly: HourlyData[];
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const url = "https://api.open-meteo.com/v1/forecast?latitude=50.0441&longitude=19.1415&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&hourly=temperature_2m&daily=temperature_2m_max,temperature_2m_min&timezone=Europe%2FWarsaw&forecast_days=1";
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch weather");
        const data = await res.json();
        
        const now = new Date();
        const currentHour = now.getHours();

        const chartData = data.hourly.time
           .map((timeStr: string, index: number) => {
             const h = new Date(timeStr).getHours();
             return {
               timeAbbr: `${h.toString().padStart(2, '0')}:00`,
               temp: data.hourly.temperature_2m[index],
             };
           });

        setWeather({
          temp: data.current.temperature_2m,
          humidity: data.current.relative_humidity_2m,
          windSpeed: data.current.wind_speed_10m,
          description: getWeatherDescription(data.current.weather_code),
          icon: getWeatherIcon(data.current.weather_code),
          tempMax: data.daily.temperature_2m_max[0],
          tempMin: data.daily.temperature_2m_min[0],
          hourly: chartData.length > 0 ? chartData : [
             { timeAbbr: "Teraz", temp: data.current.temperature_2m }
          ],
        });
      } catch (err) {
        setError("Wystąpił błąd przy pobieraniu pogody.");
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 15 * 60 * 1000); // 15 min refresh
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="h-full min-h-[16rem] bg-card rounded-3xl border border-border animate-pulse p-8"></div>;
  }

  if (error || !weather) {
    return (
      <div className="h-full min-h-[16rem] bg-card rounded-3xl border border-border p-8 flex items-center justify-center text-zinc-500 shadow-sm">
        <p>{error || "Brak danych"}</p>
      </div>
    );
  }

  const IconComponent = weather.icon === "sun" ? Sun : weather.icon === "rain" ? CloudRain : Cloud;

  return (
    <div className="h-full min-h-[16rem] bg-card rounded-3xl border border-border p-8 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-zinc-700 transition-all duration-300">
       <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500">
        <IconComponent size={120} className="text-zinc-100" strokeWidth={1} />
      </div>
      
      <div className="flex flex-col z-10 w-full h-full justify-between">
         <div className="flex items-start justify-between mb-4">
           <div>
             <h2 className="text-5xl md:text-6xl font-bold tracking-tighter text-zinc-100 drop-shadow-sm flex items-start">
               {Math.round(weather.temp)}<span className="text-2xl mt-1 md:mt-2 text-zinc-400 font-medium ml-1">°C</span>
             </h2>
             <div className="flex items-center gap-3 mt-2 text-sm font-medium">
                <div className="flex items-center gap-0.5 text-rose-400" title="Dzisiejsze maksimum">
                   <ArrowUp size={16} />
                   <span>{Math.round(weather.tempMax)}°</span>
                </div>
                <div className="flex items-center gap-0.5 text-blue-400" title="Dzisiejsze minimum">
                   <ArrowDown size={16} />
                   <span>{Math.round(weather.tempMin)}°</span>
                </div>
             </div>
           </div>
           
           <div className="text-right">
             <div className="flex items-center gap-1.5 text-zinc-300 justify-end font-medium">
               <MapPin size={16} className="text-rose-500" />
               <p className="text-base">Żory, PL</p>
             </div>
             <p className="text-sm text-zinc-500 mt-1">{weather.description}</p>
           </div>
         </div>

         {/* Hourly Graph Line */}
         <div className="w-full h-16 mt-2 mb-4 pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weather.hourly}>
                <defs>
                   <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                     <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.8}/>
                   </linearGradient>
                </defs>
                <XAxis dataKey="timeAbbr" hide />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '0.75rem', fontSize: '0.875rem' }}
                  itemStyle={{ color: '#fafafa' }}
                  labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                  formatter={(value: any) => [`${Math.round(value)}°C`, 'Temperatura']}
                  labelFormatter={(label) => `Godzina ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="temp" 
                  stroke="url(#colorTemp)" 
                  strokeWidth={3} 
                  dot={false}
                  activeDot={{ r: 4, fill: '#fafafa' }}
                />
              </LineChart>
            </ResponsiveContainer>
         </div>
         
         <div className="flex items-center gap-6 pt-4 border-t border-zinc-800/50">
           <div className="flex items-center gap-2 text-zinc-400">
             <Droplets size={18} className="text-blue-400" />
             <span className="font-medium">{weather.humidity}% wilg.</span>
           </div>
           <div className="flex items-center gap-2 text-zinc-400">
             <Wind size={18} className="text-zinc-300" />
             <span className="font-medium">{Math.round(weather.windSpeed)} km/h</span>
           </div>
         </div>
      </div>
    </div>
  );
}

function getWeatherDescription(code: number) {
  if (code === 0) return "Bezchmurnie";
  if (code >= 1 && code <= 3) return "Częściowe zachm.";
  if (code >= 45 && code <= 48) return "Mglisto";
  if (code >= 51 && code <= 55) return "Mżawka";
  if (code >= 61 && code <= 67) return "Deszcz";
  if (code >= 71 && code <= 77) return "Śnieg";
  if (code >= 80 && code <= 82) return "Przelotny deszcz";
  if (code >= 95) return "Burza";
  return "Pochmurno";
}

function getWeatherIcon(code: number) {
  if (code === 0 || code === 1) return "sun";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  return "cloud";
}
