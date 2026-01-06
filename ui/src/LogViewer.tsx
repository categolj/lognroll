import React, { ChangeEvent, KeyboardEvent, useState, useCallback } from 'react';
import ScrollToTop from 'react-scroll-to-top';
// @ts-expect-error TODO
import { JSONToHTMLTable } from '@kevincobain2000/json-to-html-table';
// @ts-expect-error TODO
import logfmt from 'logfmt';
import {
  Button,
  Input,
  Card,
  Alert,
  Checkbox,
  RadioGroup,
  Badge,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from './components/ui';
import VolumesChart, { VolumeData } from './VolumesChart';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useLogSearchParams } from './hooks/useLogSearchParams';

interface BuildUrlParams {
  size?: number;
  query: string;
  filter?: string;
  cursor?: string;
  from?: string;
  to?: string;
  interval?: number;
}

const buildLogsUrl = ({ size, query, filter, cursor, from, to }: BuildUrlParams): string => {
  let url = `/api/logs?size=${size}&query=${encodeURIComponent(query)}`;
  if (filter) {
    url += `&filter=${encodeURIComponent(filter)}`;
  }
  if (cursor) {
    url += `&cursor=${encodeURIComponent(cursor)}`;
  }
  if (from) {
    url += `&from=${encodeURIComponent(convertToIsoUtc(from))}`;
  }
  if (to) {
    url += `&to=${encodeURIComponent(convertToIsoUtc(to))}`;
  }
  return url;
};

const buildCountUrl = (path: string, { query, filter, from, to, interval }: BuildUrlParams): string => {
  let url = `/api/logs${path}?query=${encodeURIComponent(query)}`;
  if (filter) {
    url += `&filter=${encodeURIComponent(filter)}`;
  }
  if (from) {
    url += `&from=${encodeURIComponent(convertToIsoUtc(from))}`;
  }
  if (to) {
    url += `&to=${encodeURIComponent(convertToIsoUtc(to))}`;
  }
  if (interval) {
    url += `&interval=PT${interval}M`;
  }
  return url;
};

const convertToIsoUtc = (localDateTime: string): string => {
  const date = new Date(localDateTime);
  return date.toISOString();
};

function convertUtcToLocal(utcDateString: string): string {
  const date = new Date(utcDateString);
  return date.toLocaleString();
}

interface LogsResponse {
  logs: Log[];
}

interface CountResponse {
  totalCount: number;
}

interface VolumesResponse {
  volumes: VolumeData[];
}

interface Log {
  logId: number;
  timestamp: string;
  observedTimestamp: string;
  severityText?: string;
  severityNumber?: number;
  serviceName?: string;
  scope?: string;
  body?: string;
  traceId?: string;
  spanId?: string;
  attributes?: Record<string, object>;
  resourceAttributes?: Record<string, object>;
}

interface Message {
  text: string;
  status: 'success' | 'error' | 'warning' | 'info';
}

interface Problem {
  type: string;
  title: string;
  status: number;
  detail: string;
}

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  const hours = ('0' + date.getHours()).slice(-2);
  const minutes = ('0' + date.getMinutes()).slice(-2);
  const seconds = ('0' + date.getSeconds()).slice(-2);
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

const calcInterval = (from: string, to: string) => {
  if (!from) {
    return 60;
  }
  const startDate = new Date(from);
  const endDate = to ? new Date(to) : new Date();
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 3) {
    return 10;
  } else if (diffDays < 4) {
    return 20;
  } else if (diffDays < 5) {
    return 30;
  } else {
    return 60;
  }
};

const getSeverityVariant = (severity?: string): 'default' | 'success' | 'error' | 'warning' | 'info' => {
  if (!severity) return 'default';
  const s = severity.toUpperCase();
  if (s.includes('ERROR') || s.includes('FATAL') || s.includes('CRITICAL')) return 'error';
  if (s.includes('WARN')) return 'warning';
  if (s.includes('INFO')) return 'info';
  if (s.includes('DEBUG') || s.includes('TRACE')) return 'default';
  return 'default';
};

const getDefaultFrom = () => formatDate(new Date(new Date().getTime() - 12 * 60 * 60 * 1000));

const LogViewer: React.FC = () => {
  const searchParams = useLogSearchParams();

  // URL-synced state - use URL params if present, otherwise use defaults
  const [query, setQueryState] = useState<string>(searchParams.query);
  const [filter, setFilterState] = useState<string>(searchParams.filter);
  const [size, setSizeState] = useState<number>(searchParams.size);
  const [from, setFromState] = useState<string>(
    searchParams.hasFromParam ? searchParams.from : getDefaultFrom()
  );
  const [to, setToState] = useState<string>(searchParams.to);

  // Local state
  const [logs, setLogs] = useState<Log[]>([]);
  const [count, setCount] = useState<number | string>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [jsonToTable, setJsonToTable] = useState<boolean>(false);
  const [useLocalTimezone, setUseLocalTimezone] = useState<boolean>(true);
  const [useOccurredTimestamp, setUseOccurredTimestamp] = useState<boolean>(false);
  const [timestampLabel, setTimestampLabel] = useState<'observed_timestamp' | 'timestamp'>('observed_timestamp');
  const [useSeverityText, setUseSeverityText] = useState<boolean>(true);
  const [severityLabel, setSeverityLabel] = useState<'severity_text' | 'severity_number'>('severity_text');
  const [showLoadMore, setShowLoadMore] = useState<boolean>(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [volumes, setVolumes] = useState<VolumeData[]>([]);
  const [interval, setInterval] = useState<number>(10);

  // Sync URL params when local state changes
  const setQuery = useCallback((value: string) => {
    setQueryState(value);
  }, []);

  const setFilter = useCallback((value: string) => {
    setFilterState(value);
  }, []);

  const setSize = useCallback((value: number) => {
    setSizeState(value);
  }, []);

  const setFrom = useCallback((value: string) => {
    setFromState(value);
  }, []);

  const setTo = useCallback((value: string) => {
    setToState(value);
  }, []);

  // Update URL when search is executed
  const syncToUrl = useCallback(() => {
    searchParams.updateParams({
      query,
      filter,
      from,
      to,
      size,
    });
  }, [searchParams, query, filter, from, to, size]);


  const setProblemMessage = (data: Problem) =>
    setMessage({
      status: 'error',
      text: data.detail,
    });

  const fetchLogs = async () => {
    setIsLoading(true);
    setMessage(null);
    // Sync state to URL
    syncToUrl();
    try {
      const logsResponse = await fetch(buildLogsUrl({ size, query, filter, from, to }));
      if (logsResponse.status === 200) {
        const logsData: LogsResponse = await logsResponse.json();
        setLogs(logsData.logs);
        setCount('Counting...');
        setShowLoadMore(logsData.logs.length >= size);
      } else {
        const data: Problem = await logsResponse.json();
        setProblemMessage(data);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setIsLoading(false);
    }
    try {
      const countResponse = await fetch(buildCountUrl('/count', { query, filter, from, to }));
      const interval = calcInterval(from, to);
      const volumesResponse = await fetch(buildCountUrl('/volumes', { query, filter, from, to, interval }));
      if (countResponse.status === 200) {
        const countData: CountResponse = await countResponse.json();
        setCount(countData.totalCount);
      } else {
        const data: Problem = await countResponse.json();
        setProblemMessage(data);
      }
      if (volumesResponse.status === 200) {
        const volumesData: VolumesResponse = await volumesResponse.json();
        setVolumes(volumesData.volumes);
        setInterval(interval);
      } else {
        const data: Problem = await volumesResponse.json();
        setProblemMessage(data);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const fetchMoreLogs = async () => {
    if (logs.length === 0) {
      return;
    }
    const lastLog = logs[logs.length - 1];
    const url = buildLogsUrl({
      size,
      query,
      filter,
      from,
      to,
      cursor: `${lastLog.timestamp},${lastLog.observedTimestamp}`,
    });
    setIsLoading(true);
    try {
      const response = await fetch(url);
      if (response.status == 200) {
        const { logs: moreLogs }: LogsResponse = await response.json();
        setLogs([...logs, ...moreLogs]);
        setShowLoadMore(moreLogs.length >= size);
      } else {
        const data: Problem = await response.json();
        setProblemMessage(data);
      }
    } catch (error) {
      console.error('Error fetching more logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      fetchLogs().then();
    }
  };

  const shouldJsonToTable = (log: Log) =>
    jsonToTable && log.body && log.body.startsWith('{') && log.body.endsWith('}');
  const shouldLogfmtToTable = (log: Log) =>
    jsonToTable && log.body && /^[a-zA-Z0-9_]+=/.test(log.body);

  const addFilter = (field: string, value: string | number | undefined) => {
    if (value === undefined || value === null) return;
    const newFilter = `${field}=='${value}'`;
    setFilter(filter ? `${filter} AND ${newFilter}` : newFilter);
  };

  return (
    <div className="space-y-6">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-lg bg-white px-6 py-4 shadow-lg dark:bg-dark-800">
            <svg className="h-5 w-5 animate-spin text-primary-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Loading...</span>
          </div>
        </div>
      )}

      {/* Search Section */}
      <Card padding="sm">
        <div className="space-y-2">
          {/* Search inputs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-40">
              <Input
                placeholder="Search query"
                value={query}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder={'Filter (e.g. severity_text==\'ERROR\', attributes["status"]>=400)'}
                value={filter}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFilter(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                leftIcon={<FunnelIcon className="h-4 w-4" />}
              />
            </div>
            <div className="w-20">
              <Input
                type="number"
                placeholder="Size"
                value={size}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSize(Number(e.target.value))}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                min={1}
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">From:</span>
              <Input
                type="datetime-local"
                value={from}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFrom(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">To:</span>
              <Input
                type="datetime-local"
                value={to}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setTo(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Options and Search button */}
          <div className="flex flex-wrap items-center gap-4">
            <Checkbox
              label="Format as table"
              checked={jsonToTable}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setJsonToTable(e.target.checked)}
              disabled={isLoading}
            />
            <Checkbox
              label="Local timezone"
              checked={useLocalTimezone}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setUseLocalTimezone(e.target.checked)}
              disabled={isLoading}
            />
            <RadioGroup
              label="Timestamp:"
              name="timestamp"
              value={useOccurredTimestamp ? 'occurred' : 'observed'}
              onChange={(value) => {
                setUseOccurredTimestamp(value === 'occurred');
                setTimestampLabel(value === 'occurred' ? 'timestamp' : 'observed_timestamp');
              }}
              options={[
                { value: 'occurred', label: 'occurred' },
                { value: 'observed', label: 'observed' },
              ]}
              disabled={isLoading}
            />
            <RadioGroup
              label="Severity:"
              name="severity"
              value={useSeverityText ? 'text' : 'number'}
              onChange={(value) => {
                setUseSeverityText(value === 'text');
                setSeverityLabel(value === 'text' ? 'severity_text' : 'severity_number');
              }}
              options={[
                { value: 'text', label: 'text' },
                { value: 'number', label: 'number' },
              ]}
              disabled={isLoading}
            />
            <div className="ml-auto">
              <Button onClick={fetchLogs} disabled={isLoading} isLoading={isLoading}>
                View Logs
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Error message */}
      {message && (
        <Alert status={message.status} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* Chart Section */}
      {volumes.length > 0 && (
        <Card title="Log Volume" subtitle={`Interval: ${interval} min`}>
          <VolumesChart
            data={volumes}
            interval={interval}
            useLocalTimezone={useLocalTimezone}
            onClick={(date) => {
              const from = new Date(date);
              const to = new Date(from.getTime() + interval * 60 * 1000);
              setFrom(formatDate(from));
              setTo(formatDate(to));
            }}
          />
        </Card>
      )}

      {/* Results Section */}
      {count !== undefined && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Total Count:</span>
          <Badge variant="info">{count.toLocaleString()}</Badge>
        </div>
      )}

      {/* Logs Table */}
      {logs.length > 0 && (
        <Card padding="none">
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>{timestampLabel}</TableHeader>
                  <TableHeader>{severityLabel}</TableHeader>
                  <TableHeader>service_name</TableHeader>
                  <TableHeader>scope</TableHeader>
                  <TableHeader className="min-w-[300px]">body</TableHeader>
                  <TableHeader>trace_id</TableHeader>
                  <TableHeader>span_id</TableHeader>
                  <TableHeader className="min-w-[300px]">attributes</TableHeader>
                  <TableHeader className="min-w-[300px]">resource_attributes</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => {
                  const timestamp = useOccurredTimestamp ? log.timestamp : log.observedTimestamp;
                  return (
                    <TableRow key={log.logId}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {useLocalTimezone ? convertUtcToLocal(timestamp) : timestamp}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getSeverityVariant(log.severityText)}
                          onClick={() =>
                            addFilter(
                              useSeverityText ? 'severity_text' : 'severity_number',
                              useSeverityText ? log.severityText : log.severityNumber
                            )
                          }
                        >
                          {useSeverityText ? log.severityText : log.severityNumber}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={() => addFilter('service_name', log.serviceName)}>
                        {log.serviceName}
                      </TableCell>
                      <TableCell onClick={() => addFilter('scope', log.scope)}>{log.scope}</TableCell>
                      <TableCell className="max-w-md">
                        <div className="whitespace-pre-wrap break-all text-xs">
                          {log.body && shouldJsonToTable(log) ? (
                            <JSONToHTMLTable data={JSON.parse(log.body)} tableClassName="table-modern" />
                          ) : shouldLogfmtToTable(log) ? (
                            <JSONToHTMLTable data={logfmt.parse(log.body)} tableClassName="table-modern" />
                          ) : (
                            log.body
                          )}
                        </div>
                      </TableCell>
                      <TableCell
                        onClick={() => addFilter('trace_id', log.traceId)}
                        className="font-mono text-xs"
                      >
                        {log.traceId}
                      </TableCell>
                      <TableCell
                        onClick={() => addFilter('span_id', log.spanId)}
                        className="font-mono text-xs"
                      >
                        {log.spanId}
                      </TableCell>
                      <TableCell className="min-w-[300px]">
                        <div className="text-xs whitespace-pre-wrap break-all">
                          {jsonToTable ? (
                            <JSONToHTMLTable data={log.attributes || []} tableClassName="table-modern" />
                          ) : (
                            logfmt.stringify(log.attributes)
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[300px]">
                        <div className="text-xs whitespace-pre-wrap break-all">
                          {jsonToTable ? (
                            <JSONToHTMLTable data={log.resourceAttributes || []} tableClassName="table-modern" />
                          ) : (
                            logfmt.stringify(log.resourceAttributes)
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Load More */}
      {showLoadMore && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={fetchMoreLogs} disabled={isLoading} isLoading={isLoading} size="lg">
            Load More
          </Button>
        </div>
      )}

      <ScrollToTop
        smooth
        className="!bg-accent-500 !shadow-lg hover:!bg-accent-600 transition-colors"
        style={{ borderRadius: '9999px', padding: '8px' }}
      />
    </div>
  );
};

export default LogViewer;
