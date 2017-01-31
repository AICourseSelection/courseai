package LUXIP.poller.SpotifyPoller;

import LUXIP.Wrappers.Spotify.SpotifyWrapper;
import LUXIP.Wrappers.solr.SolrWrapper;
import org.xml.sax.InputSource;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Map;

/**
 * @author Tom Hamer
 */
public class SpotifyPoller {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final long SEARCH_INTERVAL = 3600000;
    private static final long UPDATE_INTERVAL = 10000000;
    
    private boolean poller = true;

    
    @Autowired
    private SpotifyWrapper spotifyWrapper;
    
    @Autowired
    private SolrWrapper solrWrapper;
    
    @Autowired
    private LyricsGetter lyricsGetter;

    /**
     * Searches and adds new songs, and updates others.
     */
    @Scheduled(fixedDelay = SEARCH_INTERVAL)
    public void poll() {
        if(poller) {
            ArrayList<LUXIPSong> songs = spotifyWrapper.getPopular();
            songs.forEach(s -> solrWrapper.update)
        }
    }
    
    @Scheduled(fixedDelay = UPDATE_INTERVAL)
    public void update() {
        ArrayList<LUXIPSong> songs = solrWrapper.getSongs();
        
        songs.forEach(s -> {lyricsGetter.appendLyrics(s);
                            solrWrapper.updateSongs(s);});
        
    }
}
