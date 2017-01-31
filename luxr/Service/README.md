This repository can be cloned to quick-start a Spring Web Services applications.
It is setup with basic configuration that let's you start writing business logic
immediately.
It uses Gradle as the build framework. If you don't have gradle, this repo
already includes a bootstrapped gradle so you can use `./gradlew` to start up
the service. If you have gradle installed then you can just run the gradle
command in the directory and it will start up the application.

As part of the basic configuration, the following is included:
* Spring Boot
* Netty Server
* Checkstyle with Google rules
* FindBugs 3 (with HTML reports)
* Slf4j-Log4j (Configured for console)
* Mockito/Junit libs for testing
* Common libraries like Guava, Apache Commons Collections, Joda Time

The default gradle tasks are 'build' and 'run'.
build will run tests, checkstyle, and findbugs.
run will start the service.

The service is configured with `@EnableAutoConfiguration` and `@ComponentScan`,
so all files placed in the `src/main/java` directory will be configured, and of
course you can add additional `@Configuration` files. 
Once you have setup the basic structure for your project, you can change the
package for the `ServiceStarter.java` file from "temp" to whatever you choose,
just make sure it is in the root-level package since it will scan
sub-directories for beans.

If you need additional information, ping @rohantahiliani.

