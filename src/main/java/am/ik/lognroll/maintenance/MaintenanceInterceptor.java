package am.ik.lognroll.maintenance;

import java.net.URI;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.web.servlet.HandlerInterceptor;

public class MaintenanceInterceptor implements HandlerInterceptor {

	private final MaintenanceMode maintenanceMode;

	private final ObjectMapper objectMapper;

	public MaintenanceInterceptor(MaintenanceMode maintenanceMode, ObjectMapper objectMapper) {
		this.maintenanceMode = maintenanceMode;
		this.objectMapper = objectMapper;
	}

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
			throws Exception {
		if (this.maintenanceMode.isEnabled()) {
			String path = request.getRequestURI();
			if (isProtectedPath(path)) {
				ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE,
						"Service is under maintenance");
				problemDetail.setInstance(URI.create(path));
				response.setStatus(HttpStatus.SERVICE_UNAVAILABLE.value());
				response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
				this.objectMapper.writeValue(response.getWriter(), problemDetail);
				return false;
			}
		}
		return true;
	}

	private boolean isProtectedPath(String path) {
		// Allow maintenance endpoints
		if (path.startsWith("/api/maintenance")) {
			return false;
		}
		// Allow vacuum endpoint
		if (path.equals("/api/logs/vacuum")) {
			return false;
		}
		// Block /v1/logs and /api/logs
		if (path.startsWith("/v1/logs") || path.startsWith("/api/logs")) {
			return true;
		}
		return false;
	}

}
