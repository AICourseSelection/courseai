package temp;

import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Hello Test.
 */
public class HelloTest {
    private static final Logger LOG = LoggerFactory.getLogger(HelloTest.class);

    @Test
    public void hello() {
        LOG.info("Hello");
    }
}

