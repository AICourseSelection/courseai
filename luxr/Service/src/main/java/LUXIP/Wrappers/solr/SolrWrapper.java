package LUXIP.Wrappers.Solr;

import java.util.Arrays;
import java.util.List;
import java.util.ArrayList;

import org.apache.solr.client
import org.apache.solr.client.solrj.impl.HttpSolrClient;



/**
 * Retrieves lyrics for songs online using Genius API
 *
 */
@Component
public class SolrWrapper {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private final String SOLR_URL_STRING = "http://localhost:8983/solr/techproducts";
    private SolrClient solr;
    
    @Autowired
    private SpotifyWrapper SpotifyWrapper;
    
    @PostConstruct
    public void init() {
        SolrClient solr = new HttpSolrClient.Builder(SOLR_URL_STRING).build();
    }
    
    /**
     * Save a new song/update a song in solr
     */
    public boolean updateSong(final LUXIPSong song) {
        solr.add(song.toSolrInput());
        solr.commit();
        return true;
    }
    
    public List<LUXIPSong> getSongs() {
        SolrQuery query = new SolrQuery();
        QueryResponse response = solr.query(query);
        return convertDocs(response.getResults);
    }
                     
    public List<LUXIPSong> searchSolr(String term) {
        QueryResponse response = solr.search(term)
        return convertDocs(response.getResults);
    }

    private List<LUXIPSong> convertDocs(SolrDocumentList solrdocs) {
        ArrayList<LUXIPSong> songs = new ArrayList<>();
        solrdocs.forEach(s -> songs.add(fromSolrInput(s));
        return songs;
    }
                     
}

