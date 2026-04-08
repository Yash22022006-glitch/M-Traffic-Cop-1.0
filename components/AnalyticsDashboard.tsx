
import React, { useState, useEffect } from 'react';
import ChartComponent from './ChartComponent';
import { MOCK_CASES, VIOLATION_TYPE_COLORS } from '../constants';
import { Case, CaseStatus, ViolationType } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { Activity, AlertCircle, CheckCircle2, Clock, MapPin, TrendingUp } from 'lucide-react';

const AnalyticsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>({});

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      processAnalyticsData();
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const processAnalyticsData = () => {
    // Violation Trendlines (Monthly)
    const monthlyDataMap = new Map<string, Record<ViolationType, number>>();
    MOCK_CASES.forEach(c => {
      const month = new Date(c.createdAt).toLocaleString('en-US', { year: 'numeric', month: 'short' });
      if (!monthlyDataMap.has(month)) {
        const initialMonthData: Record<ViolationType, number> = {} as Record<ViolationType, number>;
        Object.values(ViolationType).forEach(vt => initialMonthData[vt] = 0);
        monthlyDataMap.set(month, initialMonthData);
      }
      c.violationTypes.forEach(vt => {
        const currentMonthData = monthlyDataMap.get(month)!;
        currentMonthData[vt]++;
      });
    });
    const monthlyTrendData = Array.from(monthlyDataMap.entries())
      .map(([month, violations]) => ({ month, ...violations }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    // Hourly Patterns
    const hourlyData: Record<string, number> = {};
    for (let i = 0; i < 24; i++) {
      hourlyData[String(i).padStart(2, '0')] = 0;
    }
    MOCK_CASES.forEach(c => {
      const hour = new Date(c.createdAt).getHours();
      hourlyData[String(hour).padStart(2, '0')]++;
    });
    const hourlyPatternData = Object.entries(hourlyData).map(([hour, count]) => ({ hour: `${hour}:00`, count }));

    // Intersection Ranking
    const intersectionCounts: Record<string, number> = {};
    MOCK_CASES.forEach(c => {
      const placeName = c.location.placeName;
      intersectionCounts[placeName] = (intersectionCounts[placeName] || 0) + 1;
    });
    const intersectionRankingData = Object.entries(intersectionCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5

    // Violation Type Distribution (Pie Chart)
    const violationTypeDistribution: Record<ViolationType, number> = {} as Record<ViolationType, number>;
    Object.values(ViolationType).forEach(vt => violationTypeDistribution[vt] = 0);
    MOCK_CASES.forEach(c => {
      c.violationTypes.forEach(vt => {
        violationTypeDistribution[vt]++;
      });
    });
    const violationDistributionData = Object.entries(violationTypeDistribution)
      .map(([name, value]) => ({ name: (name as ViolationType).replace(/_/g, ' '), value }));

    // Cases by Status
    const statusCounts: Record<CaseStatus, number> = {} as Record<CaseStatus, number>;
    Object.values(CaseStatus).forEach(s => statusCounts[s] = 0);
    MOCK_CASES.forEach(c => {
      statusCounts[c.status]++;
    });
    const statusDistributionData = Object.entries(statusCounts)
      .map(([name, value]) => ({ name: (name as CaseStatus).replace(/_/g, ' '), value }));

    // Key Metrics
    const totalCases = MOCK_CASES.length;
    const pendingCases = statusCounts[CaseStatus.PENDING_REVIEW];
    const resolvedCases = statusCounts[CaseStatus.ACCEPTED];
    const highConfidenceCases = MOCK_CASES.filter(c => c.confidence > 0.9).length;

    setAnalyticsData({
      monthlyTrendData,
      hourlyPatternData,
      intersectionRankingData,
      violationDistributionData,
      statusDistributionData,
      metrics: {
        totalCases,
        pendingCases,
        resolvedCases,
        highConfidenceCases,
      }
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const lineKeys = Object.values(ViolationType).map(type => ({
    key: type,
    color: VIOLATION_TYPE_COLORS[type].replace('bg-', '#').replace('-500', '700'),
  }));

  const pieColors = Object.values(VIOLATION_TYPE_COLORS).map(color => color.replace('bg-', '#').replace('-500', '700'));

  return (
    <div className="flex-1 bg-[#050505] text-gray-100 min-h-full overflow-y-auto hide-scrollbar font-sans selection:bg-indigo-500/30">
      {/* Top Status Bar - Technical/Hardware feel */}
      <div className="border-b border-white/5 bg-black/80 backdrop-blur-xl sticky top-0 z-20 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white whitespace-nowrap">System Live</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/10">
            {['24H', '7D', '30D'].map((range) => (
              <button
                key={range}
                className={`px-3 py-1 text-[9px] font-black rounded-md transition-all ${
                  range === '24H' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors group">
            <Activity className="w-3.5 h-3.5 text-gray-400 group-hover:text-white" />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Hero Section: Main Metrics & System Health */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Total Incidents"
              value={analyticsData.metrics.totalCases}
              trend="+12.4%"
              trendUp={true}
              color="indigo"
            />
            <MetricCard
              title="Active Queue"
              value={analyticsData.metrics.pendingCases}
              trend="5.2%"
              trendUp={false}
              color="amber"
            />
            <MetricCard
              title="Resolved"
              value={analyticsData.metrics.resolvedCases}
              trend="+18.1%"
              trendUp={true}
              color="emerald"
            />
            <MetricCard
              title="AI Precision"
              value={`${(analyticsData.metrics.highConfidenceCases / analyticsData.metrics.totalCases * 100).toFixed(1)}%`}
              trend="+0.5%"
              trendUp={true}
              color="rose"
            />
          </div>
          
          {/* System Health / Status Card */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Activity className="w-24 h-24 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-[11px] font-[750] text-gray-500 uppercase tracking-[0.2em] mb-4">System Integrity</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-[750] text-gray-400 uppercase">CCTV Nodes</span>
                  <span className="text-[10px] font-black text-emerald-400">98.2%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[98%]" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Processing Latency</span>
                  <span className="text-[10px] font-black text-indigo-400">42ms</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-[40%]" />
                </div>
              </div>
            </div>
            <button className="mt-6 w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-indigo-400 transition-all">
              Run Diagnostics
            </button>
          </div>
        </div>

        {/* Main Visualization Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Large Trend Chart */}
          <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-3xl p-8 relative overflow-hidden">
            <div className="flex items-center justify-between mb-10 relative z-10">
              <div>
                <h3 className="text-lg font-black text-white tracking-tight uppercase">Violation Dynamics</h3>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Temporal analysis of detected infractions</p>
              </div>
              <div className="flex gap-3">
                {lineKeys.slice(0, 2).map((lk, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
                    <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_5px_currentColor]" style={{ backgroundColor: lk.color, color: lk.color }} />
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-tighter">{lk.key.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-[380px] relative z-10">
              <ChartComponent
                title=""
                type="line"
                data={analyticsData.monthlyTrendData}
                dataKeyX="month"
                lineKeys={lineKeys}
              />
            </div>
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          </div>

          {/* Distribution & Hotspots Column */}
          <div className="space-y-6">
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <Activity className="w-4 h-4 text-indigo-400" />
                </div>
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Infraction Mix</h3>
              </div>
              <div className="h-64">
                <ChartComponent
                  title=""
                  type="pie"
                  data={analyticsData.violationDistributionData}
                  pieDataKey="value"
                  pieNameKey="name"
                  colors={pieColors}
                />
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-500/10 rounded-lg">
                    <MapPin className="w-4 h-4 text-rose-400" />
                  </div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Critical Zones</h3>
                </div>
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Top 5</span>
              </div>
              <div className="space-y-4">
                {analyticsData.intersectionRankingData.map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-gray-600 w-4">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] font-bold text-gray-300 uppercase truncate max-w-[120px]">{item.name}</span>
                        <span className="text-[10px] font-black text-white font-mono">{item.count}</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-rose-500/50" 
                          style={{ width: `${(item.count / analyticsData.intersectionRankingData[0].count) * 100}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Patterns & Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-8">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-black text-white uppercase tracking-widest">Hourly Load Distribution</h3>
            </div>
            <div className="h-56">
              <ChartComponent
                title=""
                type="bar"
                data={analyticsData.hourlyPatternData}
                dataKeyX="hour"
                barKeys={[{ key: 'count', color: '#6366f1' }]}
              />
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 flex items-center gap-12">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-8">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Resolution Efficiency</h3>
              </div>
              <div className="space-y-6">
                {analyticsData.statusDistributionData.map((item: any, i: number) => (
                  <div key={i}>
                    <div className="flex justify-between mb-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.name}</span>
                      <span className="text-[10px] font-black text-white font-mono">{item.value}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${i === 0 ? 'bg-indigo-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${(item.value / analyticsData.metrics.totalCases) * 100}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-48 h-48 hidden md:block">
              <ChartComponent
                title=""
                type="pie"
                data={analyticsData.statusDistributionData}
                pieDataKey="value"
                pieNameKey="name"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  trend: string;
  trendUp: boolean;
  color: 'indigo' | 'emerald' | 'amber' | 'rose';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, trend, trendUp, color }) => {
  const colorClasses = {
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  };

  return (
    <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex flex-col group hover:bg-white/[0.04] transition-all duration-500 relative overflow-hidden">
      <div className="mb-6 relative z-10">
        <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] leading-tight block max-w-[80px]">{title}</span>
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center flex-wrap gap-2 mb-4">
          <div className="text-3xl font-black text-white font-mono tracking-tighter">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          <div className={`text-[10px] font-black px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${
            trendUp 
              ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20' 
              : 'bg-rose-500/5 text-rose-400 border-rose-500/20'
          }`}>
            {trendUp ? '↑' : '↓'} {trend}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className={`h-1 flex-1 rounded-full transition-all duration-700 ${
                i < 8 ? `bg-${color}-500/40` : 'bg-white/5'
              }`}
              style={{ transitionDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Decorative Scanline */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent h-1/2 w-full -translate-y-full group-hover:translate-y-[200%] transition-transform duration-[2000ms] ease-in-out pointer-events-none" />
    </div>
  );
};

export default AnalyticsDashboard;