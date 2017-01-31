package LUXIP.config;

import LUXIP.Wrappers.Lyrics.LyricsGetter;
import org.springframework.context.annotation.ComponentScan;



import com.fasterxml.jackson.datatype.jdk8.Jdk8Module;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.net.UnknownHostException;

/**
 * Contains the basic configuration.
 *
 * @author
 */
@Configuration
public class AppConfig {
  
    @Bean
    public LyricsGetter lyricsGetter() {
        return new LyricsGetter();
    }

    
}

