import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis, ResponsiveContainer } from 'recharts';
// @ts-expect-error TODO
import { JSONToHTMLTable } from '@kevincobain2000/json-to-html-table';
import { TooltipProps } from 'recharts/types/component/Tooltip';
import React from 'react';

export type VolumeData = { date: string; count: number };

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
      count: d.count,
    }));
  }
  const filledData = [];
  const currentTime = new Date(data[0].date);
  const endTime = new Date(data[data.length - 1].date);
  let index = 0;
  while (currentTime <= endTime) {
    const givenData = data[index];
    if (currentTime.getTime() === new Date(givenData.date).getTime()) {
      filledData.push({ date: formatDate(currentTime, useLocalTimezone), count: givenData.count });
      index++;
    } else {
      filledData.push({ date: formatDate(currentTime, useLocalTimezone), count: 0 });
    }
    currentTime.setMinutes(currentTime.getMinutes() + interval);
  }
  return filledData;
};

const TooltipContent = (props: TooltipProps<string, string>) => {
  if (!props.payload || props.payload.length < 1) {
    return <></>;
  }
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-dark-700 dark:bg-dark-800">
      <JSONToHTMLTable data={props.payload[0].payload} tableClassName="table-modern text-xs" />
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
          <Bar
            dataKey="count"
            fill="#8884d8"
            radius={[4, 4, 0, 0]}
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={(x) => onClick(x.date)}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VolumesChart;
