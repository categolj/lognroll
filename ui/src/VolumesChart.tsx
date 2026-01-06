import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis, ResponsiveContainer, Legend } from 'recharts';
import { TooltipProps } from 'recharts/types/component/Tooltip';
import React from 'react';

// Severity categories matching getSeverityVariant in LogViewer
export type VolumeData = {
  date: string;
  error: number;
  warn: number;
  info: number;
  debug: number;
  trace: number;
  other: number;
};

// Colors for severity levels
const SEVERITY_COLORS = {
  error: '#EF4444',
  warn: '#F59E0B',
  info: '#3B82F6',
  debug: '#9CA3AF',
  trace: '#D1D5DB',
  other: '#E5E7EB',
} as const;

const SEVERITY_LABELS = {
  error: 'ERROR',
  warn: 'WARN',
  info: 'INFO',
  debug: 'DEBUG',
  trace: 'TRACE',
  other: 'OTHER',
} as const;

type SeverityKey = keyof typeof SEVERITY_COLORS;

const formatDate = (date: Date, useLocalTimezone: boolean): string => {
  if (useLocalTimezone) {
    return date.toLocaleString();
  }
  return date.toISOString().replace('T', ' ').substring(0, 19);
};

const fillMissingData = (data: VolumeData[], interval: number, useLocalTimezone: boolean) => {
  if (data.length <= 1) {
    return data.map(d => ({
      date: formatDate(new Date(d.date), useLocalTimezone),
      error: d.error,
      warn: d.warn,
      info: d.info,
      debug: d.debug,
      trace: d.trace,
      other: d.other,
      total: d.error + d.warn + d.info + d.debug + d.trace + d.other,
    }));
  }
  const filledData = [];
  const currentTime = new Date(data[0].date);
  const endTime = new Date(data[data.length - 1].date);
  let index = 0;
  while (currentTime <= endTime) {
    const givenData = data[index];
    if (currentTime.getTime() === new Date(givenData.date).getTime()) {
      filledData.push({
        date: formatDate(currentTime, useLocalTimezone),
        error: givenData.error,
        warn: givenData.warn,
        info: givenData.info,
        debug: givenData.debug,
        trace: givenData.trace,
        other: givenData.other,
        total: givenData.error + givenData.warn + givenData.info + givenData.debug + givenData.trace + givenData.other,
      });
      index++;
    } else {
      filledData.push({
        date: formatDate(currentTime, useLocalTimezone),
        error: 0,
        warn: 0,
        info: 0,
        debug: 0,
        trace: 0,
        other: 0,
        total: 0,
      });
    }
    currentTime.setMinutes(currentTime.getMinutes() + interval);
  }
  return filledData;
};

const TooltipContent = (props: TooltipProps<number, string>) => {
  if (!props.payload || props.payload.length < 1) {
    return null;
  }
  const data = props.payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-dark-700 dark:bg-dark-800">
      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">{data.date}</div>
      <div className="space-y-1">
        {(['error', 'warn', 'info', 'debug', 'trace', 'other'] as SeverityKey[]).map((key) => (
          data[key] > 0 && (
            <div key={key} className="flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: SEVERITY_COLORS[key] }}
                />
                <span className="text-gray-600 dark:text-gray-400">{SEVERITY_LABELS[key]}</span>
              </div>
              <span className="font-medium text-gray-800 dark:text-gray-200">{data[key].toLocaleString()}</span>
            </div>
          )
        ))}
        <div className="flex items-center justify-between gap-4 text-xs border-t border-gray-200 dark:border-dark-700 pt-1 mt-1">
          <span className="text-gray-600 dark:text-gray-400 font-medium">Total</span>
          <span className="font-bold text-gray-800 dark:text-gray-200">{data.total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

interface VolumesChartProps {
  data: VolumeData[];
  interval: number;
  useLocalTimezone: boolean;
  onClick: (date: string) => void;
}

const VolumesChart: React.FC<VolumesChartProps> = ({ data, interval, useLocalTimezone, onClick }) => {
  const filled = fillMissingData(data, interval, useLocalTimezone);

  // Stack order: other -> trace -> debug -> info -> warn -> error (error on top)
  const severityKeys: SeverityKey[] = ['other', 'trace', 'debug', 'info', 'warn', 'error'];

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={filled} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-dark-700" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            className="text-gray-500 dark:text-gray-400"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            className="text-gray-500 dark:text-gray-400"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<TooltipContent />} cursor={{ fill: 'rgba(136, 132, 216, 0.1)' }} />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            formatter={(value: string) => SEVERITY_LABELS[value as SeverityKey] || value}
          />
          {severityKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="severity"
              fill={SEVERITY_COLORS[key]}
              radius={index === severityKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={(x) => onClick(x.date)}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VolumesChart;
