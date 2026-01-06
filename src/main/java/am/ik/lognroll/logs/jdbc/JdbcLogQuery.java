package am.ik.lognroll.logs.jdbc;

import am.ik.lognroll.logs.Log;
import am.ik.lognroll.logs.LogBuilder;
import am.ik.lognroll.logs.LogQuery;
import am.ik.lognroll.logs.filter.FilterExpressionConverter;
import am.ik.lognroll.logs.filter.converter.Sqlite3FilterExpressionConverter;
import am.ik.lognroll.logs.query.Sqlite3QueryConverter;
import am.ik.lognroll.util.Json;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Component
public class JdbcLogQuery implements LogQuery {

	private final JdbcClient jdbcClient;

	private final ObjectMapper objectMapper;

	private final FilterExpressionConverter converter = new Sqlite3FilterExpressionConverter();

	public JdbcLogQuery(JdbcClient jdbcClient, ObjectMapper objectMapper) {
		this.jdbcClient = jdbcClient;
		this.objectMapper = objectMapper;
	}

	QueryAndParams buildQueryAndParams(SearchRequest request) {
		StringBuilder sql = new StringBuilder();
		Map<String, Object> params = new HashMap<>();
		String query = request.query();
		if (StringUtils.hasText(query)) {
			sql.append("""
					FROM log_fts
					JOIN log ON log_fts.rowid = log.log_id
					JOIN resource_attributes ON log.resource_attributes_digest = resource_attributes.digest
					""");
		}
		else {
			sql.append("""
					FROM log
					JOIN resource_attributes ON log.resource_attributes_digest = resource_attributes.digest
					""");
		}
		sql.append("""
				WHERE 1 = 1
				""");
		if (request.pageRequest() != null) {
			Cursor cursor = request.pageRequest().cursor();
			if (cursor != null) {
				sql.append("""
						AND observed_timestamp <= :observed_timestamp
						AND timestamp < :timestamp
						""");
				params.put("observed_timestamp", Timestamp.from(cursor.observedTimestamp()));
				params.put("timestamp", Timestamp.from(cursor.timestamp()));
			}
		}
		if (request.from() != null) {
			sql.append("""
					AND observed_timestamp >= :from
					""");
			params.put("from", Timestamp.from(request.from()));
		}
		if (request.to() != null) {
			sql.append("""
					AND observed_timestamp <= :to
					""");
			params.put("to", Timestamp.from(request.to()));
		}
		if (StringUtils.hasText(query)) {
			sql.append("""
					AND log_fts MATCH(:query)
					""");
			params.put("query", Sqlite3QueryConverter.convertQuery(query));
		}
		if (request.filterExpression() != null) {
			sql.append("AND ")
				.append(this.converter.convertExpression(request.filterExpression()))
				.append(System.lineSeparator());
		}
		return new QueryAndParams(sql.toString(), params);
	}

	@Override
	public List<Log> findLatestLogs(SearchRequest request) {
		StringBuilder sql = new StringBuilder("""
				SELECT log.log_id,
				       log.timestamp,
				       log.observed_timestamp,
				       log.severity_text,
				       log.severity_number,
				       log.service_name,
				       log.scope,
				       log.body,
				       log.trace_id,
				       log.span_id,
				       log.trace_flags,
				       log.attributes,
				       resource_attributes.resource_attributes
				""");
		QueryAndParams queryAndParams = buildQueryAndParams(request);
		sql.append(queryAndParams.query());
		sql.append("""
				ORDER BY observed_timestamp DESC, timestamp DESC
				""");
		if (request.pageRequest() != null && request.pageRequest().pageSize() > 0) {
			sql.append("LIMIT %d".formatted(request.pageRequest().pageSize()));
		}
		return this.jdbcClient.sql(sql.toString()) //
			.params(queryAndParams.params()) //
			.query((rs, rowNum) -> LogBuilder.log()
				.logId(rs.getLong("log_id"))
				.timestamp(rs.getTimestamp("timestamp").toInstant())
				.observedTimestamp(rs.getTimestamp("observed_timestamp").toInstant())
				.severityText(rs.getString("severity_text"))
				.severityNumber(rs.getInt("severity_number"))
				.serviceName(rs.getString("service_name"))
				.scope(rs.getString("scope"))
				.body(rs.getString("body"))
				.traceId(rs.getString("trace_id"))
				.spanId(rs.getString("span_id"))
				.traceFlags(rs.getInt("trace_flags"))
				.attributes(Json.parse(this.objectMapper, rs.getString("attributes")))
				.resourceAttributes(Json.parse(this.objectMapper, rs.getString("resource_attributes")))
				.build()) //
			.list();
	}

	@Override
	public long count(SearchRequest request) {
		StringBuilder sql = new StringBuilder("""
				SELECT COUNT(log.log_id)
				""");
		QueryAndParams queryAndParams = buildQueryAndParams(request);
		sql.append(queryAndParams.query());
		return this.jdbcClient.sql(sql.toString()) //
			.params(queryAndParams.params()) //
			.query(Long.class)
			.single();
	}

	@Override
	public List<Volume> findVolumes(SearchRequest request, Duration interval) {
		StringBuilder sql = new StringBuilder("""
				SELECT strftime('%%Y-%%m-%%dT%%H', observed_timestamp / 1000, 'unixepoch') || ':' ||
				   printf('%%02d', (strftime('%%M', observed_timestamp / 1000, 'unixepoch') / %d) * %d) ||
				   ':00Z' AS date,
				   COALESCE(severity_text, '') AS severity_text,
				   count(log_id) AS count
				""".formatted(interval.toMinutes(), interval.toMinutes()));
		QueryAndParams queryAndParams = buildQueryAndParams(request);
		sql.append(queryAndParams.query());
		sql.append("""
				GROUP BY date, severity_text
				ORDER BY date ASC;
				""");
		List<SeverityCount> severityCounts = this.jdbcClient.sql(sql.toString())
			.params(queryAndParams.params())
			.query((rs, rowNum) -> new SeverityCount(Instant.parse(rs.getString("date")), rs.getString("severity_text"),
					rs.getLong("count")))
			.list();
		return aggregateVolumes(severityCounts);
	}

	private List<Volume> aggregateVolumes(List<SeverityCount> severityCounts) {
		Map<Instant, Volume> volumeMap = new LinkedHashMap<>();
		for (SeverityCount sc : severityCounts) {
			Volume volume = volumeMap.computeIfAbsent(sc.date(), date -> new Volume(date, 0, 0, 0, 0, 0, 0));
			volume = switch (sc.category()) {
				case ERROR -> new Volume(volume.date(), volume.error() + sc.count(), volume.warn(), volume.info(),
						volume.debug(), volume.trace(), volume.other());
				case WARN -> new Volume(volume.date(), volume.error(), volume.warn() + sc.count(), volume.info(),
						volume.debug(), volume.trace(), volume.other());
				case INFO -> new Volume(volume.date(), volume.error(), volume.warn(), volume.info() + sc.count(),
						volume.debug(), volume.trace(), volume.other());
				case DEBUG -> new Volume(volume.date(), volume.error(), volume.warn(), volume.info(),
						volume.debug() + sc.count(), volume.trace(), volume.other());
				case TRACE -> new Volume(volume.date(), volume.error(), volume.warn(), volume.info(), volume.debug(),
						volume.trace() + sc.count(), volume.other());
				case OTHER -> new Volume(volume.date(), volume.error(), volume.warn(), volume.info(), volume.debug(),
						volume.trace(), volume.other() + sc.count());
			};
			volumeMap.put(sc.date(), volume);
		}
		return new ArrayList<>(volumeMap.values());
	}

	private enum Category {

		ERROR, WARN, INFO, DEBUG, TRACE, OTHER;

		static Category of(String severityText) {
			if (severityText == null || severityText.isEmpty()) {
				return OTHER;
			}
			String upper = severityText.toUpperCase();
			if (upper.contains("ERROR") || upper.contains("FATAL") || upper.contains("CRITICAL")) {
				return ERROR;
			}
			if (upper.contains("WARN")) {
				return WARN;
			}
			if (upper.contains("INFO")) {
				return INFO;
			}
			if (upper.contains("DEBUG")) {
				return DEBUG;
			}
			if (upper.contains("TRACE")) {
				return TRACE;
			}
			return OTHER;
		}

	}

	private record SeverityCount(Instant date, String severityText, long count) {

		Category category() {
			return Category.of(severityText);
		}

	}

	@Override
	@Transactional
	public int delete(SearchRequest request) {
		StringBuilder sql = new StringBuilder("SELECT log.log_id ");
		QueryAndParams queryAndParams = buildQueryAndParams(request);
		sql.append(queryAndParams.query());
		List<Long> deleteIds = this.jdbcClient.sql(sql.toString())
			.params(queryAndParams.params())
			.query(Long.class)
			.list();
		List<List<Long>> splitList = splitList(deleteIds, 1000);
		int deleted = 0;
		for (List<Long> deleteIdList : splitList) {
			deleted += this.jdbcClient.sql("DELETE FROM log WHERE log_id IN (:ids)")
				.param("ids", deleteIdList) //
				.update();
		}
		return deleted;
	}

	static <T> List<List<T>> splitList(List<T> originalList, int chunkSize) {
		List<List<T>> partitionedList = new ArrayList<>();
		int size = originalList.size();
		for (int i = 0; i < size; i += chunkSize) {
			partitionedList.add(new ArrayList<>(originalList.subList(i, Math.min(size, i + chunkSize))));
		}
		return partitionedList;
	}

	private record QueryAndParams(String query, Map<String, Object> params) {
	}

}
