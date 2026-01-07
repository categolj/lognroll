package am.ik.lognroll.maintenance;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/maintenance")
public class MaintenanceController {

	private final MaintenanceMode maintenanceMode;

	private final Logger logger = LoggerFactory.getLogger(MaintenanceController.class);

	public MaintenanceController(MaintenanceMode maintenanceMode) {
		this.maintenanceMode = maintenanceMode;
	}

	@GetMapping
	public MaintenanceResponse status() {
		return new MaintenanceResponse(this.maintenanceMode.isEnabled(), this.maintenanceMode.isVacuumInProgress());
	}

	@PostMapping("/enable")
	public ResponseEntity<Void> enable() {
		this.maintenanceMode.enable();
		logger.info("Maintenance mode enabled");
		return ResponseEntity.noContent().build();
	}

	@PostMapping("/disable")
	public ResponseEntity<Void> disable() {
		if (!this.maintenanceMode.disable()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT,
					"Cannot disable maintenance mode while vacuum is in progress");
		}
		logger.info("Maintenance mode disabled");
		return ResponseEntity.noContent().build();
	}

	public record MaintenanceResponse(boolean enabled, boolean vacuumInProgress) {
	}

}
