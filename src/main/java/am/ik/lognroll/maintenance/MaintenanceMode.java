package am.ik.lognroll.maintenance;

import java.util.concurrent.atomic.AtomicBoolean;

import org.springframework.stereotype.Component;

@Component
public class MaintenanceMode {

	private final AtomicBoolean enabled = new AtomicBoolean(false);

	public boolean isEnabled() {
		return this.enabled.get();
	}

	public void enable() {
		this.enabled.set(true);
	}

	public void disable() {
		this.enabled.set(false);
	}

}
