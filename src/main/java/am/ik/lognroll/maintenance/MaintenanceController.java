package am.ik.lognroll.maintenance;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
		return new MaintenanceResponse(this.maintenanceMode.isEnabled());
	}

	@PostMapping("/enable")
	public ResponseEntity<Void> enable() {
		this.maintenanceMode.enable();
		logger.info("Maintenance mode enabled");
		return ResponseEntity.noContent().build();
	}

	@PostMapping("/disable")
	public ResponseEntity<Void> disable() {
		this.maintenanceMode.disable();
		logger.info("Maintenance mode disabled");
		return ResponseEntity.noContent().build();
	}

	public record MaintenanceResponse(boolean enabled) {
	}

}
