package LUXIP.wrappers.spotify;

import java.util.Arrays;
import java.util.List;
import java.util.ArrayList;

import LUXIP.Types.LUXIPSong;


import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.Response;


import org.springframework.beans.factory.annotation.Value;

import javax.ws.rs.core.MediaType;

/**
 * Provides access to the Spotify REST API.
 */
public class SpotifyWrapper {
    
    @Value("${Spotify.apiEndpoint:https://api.spotify.com/}")
    private String apiEndpoint;
    
    @Value("${Spotify.token:8jqNAIWkulo0z_8cASRaCMvHqicLt2Kk06KhL0GxSd44pMlMmq-jNasMsF-V1Frz}")
    public String token;
    
    /**
     * Get new releases.
     */
    public List<LUXIPSong> getReleases() {
        
        final Client client = ClientBuilder.newClient();
        
        WebTarget myResource = client.target(apiEndpoint+"v1/browse/new-releases").queryParam("country","US");
        Response response = myResource.request(MediaType.APPLICATION_JSON)
            .header("Authorization",token)
            .get();

        
        
        
        //the problem is, im not exactly sure how to iterate through this list of items in response. Need to look through jackson documentation or something
        //actually spotify new releases only gives albums - need to look up songs as well. This looks like a big task. Maybe Ill need to encapsulate some of the tasks.
        //this task is going to need some help - ill have to create a helper
        
        return new ArrayList<>();
    }
    
    /**
     * Get popular songs
     */
    public List<LUXIPSong> getPopular() {
        final Client client = ClientBuilder.newClient();
        
        WebTarget myResource = client.target(apiEndpoint+"v1/browse/popular").queryParam("country","US");
        Response response = myResource.request(MediaType.APPLICATION_JSON)
        .header("Authorization",token)
        .get();
        
        return new ArrayList<>();
    }
    
    public LUXIPSong lookupSong(String id) {
        final Client client = ClientBuilder.newClient();
        
        WebTarget myResource = client.target(apiEndpoint+"v1/browse/new-releases").queryParam("country","US");
        Response response = myResource.request(MediaType.APPLICATION_JSON)
            .header("Authorization",token)
            .get();
        
        final LUXIPSong.Builder builder = new LUXIPSong.Builder();
        
        
        return builder.build();
    }



}

