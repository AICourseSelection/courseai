package LUXIP;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.context.annotation.ComponentScan;


/**
 * Initializes the Spring app context and starts the application.
 *
 * @author tinks
 */
@ComponentScan
@EnableAutoConfiguration
public class ServiceStarter {
    /**
     * Starts the application.
     *
     * @param args CLI args
     */
    public static void main(final String... args) {
        SpringApplication.run(ServiceStarter.class, args);
    }
}
