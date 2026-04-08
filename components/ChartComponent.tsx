
import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface ChartComponentProps {
  data: any[];
  title: string;
  type: 'bar' | 'line' | 'pie';
  dataKeyX?: string;
  dataKeyY?: string;
  pieDataKey?: string;
  pieNameKey?: string;
  barKeys?: { key: string; color: string }[];
  lineKeys?: { key: string; color: string }[];
  colors?: string[];
}

const ChartComponent: React.FC<ChartComponentProps> = ({
  data,
  title,
  type,
  dataKeyX,
  dataKeyY,
  pieDataKey,
  pieNameKey,
  barKeys,
  lineKeys,
  colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
}) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 p-3 rounded shadow-2xl backdrop-blur-md">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 border-b border-gray-800 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3 py-0.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
              <span className="text-[10px] font-bold text-gray-300 uppercase">{entry.name}:</span>
              <span className="text-[10px] font-black text-white font-mono ml-auto">{entry.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full flex flex-col relative group/chart">
      {title && <h4 className="text-[10px] font-black text-gray-500 mb-6 uppercase tracking-[0.2em] border-l-2 border-indigo-500 pl-3">{title}</h4>}
      
      {/* Subtle Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-10" />

      <ResponsiveContainer width="100%" height="100%">
        {type === 'bar' && (
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#374151" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey={dataKeyX} 
              stroke="#4b5563" 
              fontSize={9} 
              tickLine={false} 
              axisLine={false}
              dy={10}
              tick={{ fill: '#6b7280', fontWeight: 700 }}
            />
            <YAxis 
              dataKey={dataKeyY} 
              stroke="#4b5563" 
              fontSize={9} 
              tickLine={false} 
              axisLine={false}
              tick={{ fill: '#6b7280', fontWeight: 700 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} />
            {barKeys?.map((item, index) => (
              <Bar key={index} dataKey={item.key} fill={item.color} radius={[2, 2, 0, 0]} barSize={24} />
            ))}
          </BarChart>
        )}
        {type === 'line' && (
          <LineChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#374151" vertical={true} opacity={0.1} />
            <CartesianGrid strokeDasharray="4 4" stroke="#374151" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey={dataKeyX} 
              stroke="#4b5563" 
              fontSize={9} 
              tickLine={false} 
              axisLine={false}
              dy={10}
              tick={{ fill: '#6b7280', fontWeight: 700 }}
            />
            <YAxis 
              stroke="#4b5563" 
              fontSize={9} 
              tickLine={false} 
              axisLine={false}
              tick={{ fill: '#6b7280', fontWeight: 700 }}
            />
            <Tooltip content={<CustomTooltip />} />
            {lineKeys?.map((item, index) => (
              <Line 
                key={index} 
                type="monotone" 
                dataKey={item.key} 
                stroke={item.color} 
                strokeWidth={3}
                dot={{ r: 0 }}
                activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} 
                animationDuration={1500}
              />
            ))}
          </LineChart>
        )}
        {type === 'pie' && (
          <PieChart>
            <Pie
              data={data}
              dataKey={pieDataKey}
              nameKey={pieNameKey}
              cx="50%"
              cy="50%"
              innerRadius="65%"
              outerRadius="85%"
              paddingAngle={4}
              fill="#8884d8"
              stroke="none"
              animationBegin={0}
              animationDuration={1200}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              layout="vertical" 
              verticalAlign="middle" 
              align="right" 
              iconType="rect"
              iconSize={8}
              wrapperStyle={{ fontSize: '9px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
            />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default ChartComponent;