package am.ik.lognroll.maintenance;

import java.nio.charset.StandardCharsets;

import am.ik.lognroll.IntegrationTestBase;
import am.ik.lognroll.logs.LogStore;
import am.ik.lognroll.maintenance.MaintenanceController.MaintenanceResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StreamUtils;

import static org.assertj.core.api.Assertions.assertThat;

class MaintenanceControllerTest extends IntegrationTestBase {

	@Autowired
	MaintenanceMode maintenanceMode;

	@Autowired
	LogStore logStore;

	@BeforeEach
	void setUp() {
		this.maintenanceMode.disable();
		this.logStore.clear();
	}

	@AfterEach
	void tearDown() {
		this.maintenanceMode.disable();
	}

	@Test
	void getMaintenanceStatus() {
		MaintenanceResponse response = this.restClient.get()
			.uri("/api/maintenance")
			.header(HttpHeaders.AUTHORIZATION, "Bearer changeme")
			.retrieve()
			.body(MaintenanceResponse.class);
		assertThat(response).isNotNull();
		assertThat(response.enabled()).isFalse();
	}

	@Test
	void maintenanceModeScenario() throws Exception {
		String json = StreamUtils.copyToString(new ClassPathResource("logs.json").getInputStream(),
				StandardCharsets.UTF_8);

		// Step 1: Access allowed when maintenance mode is disabled
		ResponseEntity<Void> ingestResponse1 = this.restClient.post()
			.uri("/v1/logs")
			.contentType(MediaType.APPLICATION_JSON)
			.header(HttpHeaders.AUTHORIZATION, "Bearer changeme")
			.body(json)
			.retrieve()
			.toBodilessEntity();
		assertThat(ingestResponse1.getStatusCode()).isEqualTo(HttpStatus.OK);

		ResponseEntity<String> logsResponse1 = this.restClient.get()
			.uri("/api/logs")
			.header(HttpHeaders.AUTHORIZATION, "Bearer changeme")
			.retrieve()
			.toEntity(String.class);
		assertThat(logsResponse1.getStatusCode()).isEqualTo(HttpStatus.OK);

		// Step 2: Enable maintenance mode
		ResponseEntity<Void> enableResponse = this.restClient.post()
			.uri("/api/maintenance/enable")
			.header(HttpHeaders.AUTHORIZATION, "Bearer changeme")
			.retrieve()
			.toBodilessEntity();
		assertThat(enableResponse.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

		// Step 3: Verify maintenance status is enabled
		MaintenanceResponse status = this.restClient.get()
			.uri("/api/maintenance")
			.header(HttpHeaders.AUTHORIZATION, "Bearer changeme")
			.retrieve()
			.body(MaintenanceResponse.class);
		assertThat(status).isNotNull();
		assertThat(status.enabled()).isTrue();

		// Step 4: Access blocked during maintenance mode
		ResponseEntity<Void> ingestResponse2 = this.restClient.post()
			.uri("/v1/logs")
			.contentType(MediaType.APPLICATION_JSON)
			.header(HttpHeaders.AUTHORIZATION, "Bearer changeme")
			.body(json)
			.retrieve()
			.toBodilessEntity();
		assertThat(ingestResponse2.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);

		ResponseEntity<String> logsResponse2 = this.restClient.get()
			.uri("/api/logs")
			.header(HttpHeaders.AUTHORIZATION, "Bearer changeme")
			.retrieve()
			.toEntity(String.class);
		assertThat(logsResponse2.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);

		ResponseEntity<String> countResponse = this.restClient.get()
			.uri("/api/logs/count")
			.header(HttpHeaders.AUTHORIZATION, "Bearer changeme")
			.retrieve()
			.toEntity(String.class);
		assertThat(countResponse.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);

		// Step 5: Vacuum is allowed during maintenance mode
		ResponseEntity<Void> vacuumResponse = this.restClient.post()
			.uri("/api/logs/vacuum")
			.header(HttpHeaders.AUTHORIZATION, "Bearer changeme")
			.retrieve()
			.toBodilessEntity();
		assertThat(vacuumResponse.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

		// Step 6: Disable maintenance mode
		ResponseEntity<Void> disableResponse = this.restClient.post()
			.uri("/api/maintenance/disable")
			.header(HttpHeaders.AUTHORIZATION, "Bearer changeme")
			.retrieve()
			.toBodilessEntity();
		assertThat(disableResponse.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

		// Step 7: Access allowed after maintenance mode is disabled
		ResponseEntity<Void> ingestResponse3 = this.restClient.post()
			.uri("/v1/logs")
			.contentType(MediaType.APPLICATION_JSON)
			.header(HttpHeaders.AUTHORIZATION, "Bearer changeme")
			.body(json)
			.retrieve()
			.toBodilessEntity();
		assertThat(ingestResponse3.getStatusCode()).isEqualTo(HttpStatus.OK);

		ResponseEntity<String> logsResponse3 = this.restClient.get()
			.uri("/api/logs")
			.header(HttpHeaders.AUTHORIZATION, "Bearer changeme")
			.retrieve()
			.toEntity(String.class);
		assertThat(logsResponse3.getStatusCode()).isEqualTo(HttpStatus.OK);
	}

}
