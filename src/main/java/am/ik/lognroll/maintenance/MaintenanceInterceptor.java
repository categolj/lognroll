package am.ik.lognroll.maintenance;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpStatus;
import org.springframework.web.servlet.HandlerInterceptor;

public class MaintenanceInterceptor implements HandlerInterceptor {

	private final MaintenanceMode maintenanceMode;

	public MaintenanceInterceptor(MaintenanceMode maintenanceMode) {
		this.maintenanceMode = maintenanceMode;
	}

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
			throws Exception {
		if (this.maintenanceMode.isEnabled()) {
			String path = request.getRequestURI();
			if (isProtectedPath(path)) {
				response.sendError(HttpStatus.SERVICE_UNAVAILABLE.value(), "Service is under maintenance");
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
