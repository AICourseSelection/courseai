package LUXIP.Wrappers.Lyrics;

import java.util.Arrays;
import java.util.List;
import java.util.ArrayList;
import javax.ws.rs.core.MultivaluedMap;
import org.springframework.util.LinkedMultiValueMap;

import com.fasterxml.jackson.datatype.jdk8.Jdk8Module;

import LUXIP.Types.LUXIPSong;


import javax.ws.rs.client.Client;
import javax.ws.rs.client.ClientBuilder;
import javax.ws.rs.client.WebTarget;
import javax.ws.rs.core.Response;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;

import javax.ws.rs.core.MediaType;
import java.lang.IllegalStateException;

import java.util.Map;
import com.fasterxml.jackson.core.type.TypeReference;
/**
 * Retrieves lyrics for songs online using Genius API
 *
 */
@Component
public class LyricsGetter {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    
    @Value("${Genius.clientKey:cKtlbldnZYr7J70_MCF12SlV3_RGUI_YrP1FHXRrFr7Q1vElfbd2Dod_8OIQVLKS}")
    public String geniusClientKey;
    
    @Value("${Genius.secretKey:hyvjG1VJwzYeHf79mLyg7vP2YF9z7mpDWYtX09Zh-bpFy9f0sBPzVp6bbuaLLUP8dlIHDTLbBBC6dE96zluK0Q")
    public String geniusSecretKey;

    @Value("${Genius.apiEndpoint:https://api.genius.com/}")
    private String apiEndpoint;
    
    
    
    public String getLyrics(String geniusId) {
        final Client client = ClientBuilder.newClient();
        Response response = getLyricsResponse(client, geniusId);
        if (response.getStatus() == 200) {
            System.out.println("Recieved lyrics from genius "+response.readEntity(String.class));
            final String strData = response.readEntity(String.class);
            client.close();
            final Map<String, String> data;
            try {
                data = MAPPER.readValue(strData, new TypeReference<Map<String, Object>>() {});
                return (String) ((Map<String,Object>) data.get("response")).get("lyrics");
                
            }catch(Exception e) {
                System.out.println("Failed to parse response from API client "+e);
            }
            throw new IllegalStateException("Failed to get lyrics");
        
    }
    

    /**
     * Append the lyrics of a given song.
     */
    public void appendLyrics(LUXIPSong song) {
        final Client client = ClientBuilder.newClient();
        Response response = getSearchResponse(client, song.getTitle()+" "+song.getArtists().get(0));
        if (response.getStatus() == 200) {
            System.out.println("Recieved response from genius "+response.readEntity(String.class));
            final String strData = response.readEntity(String.class);
            client.close();
            final Map<String, String> data;
            try {
                data = MAPPER.readValue(strData, new TypeReference<Map<String, Object>>() {});
                
                List hits = (ArrayList) ((Map<String,Object>) data.get("response")).get("hits");
                
                int hitCount = 0;
                while(!(((String) getHitAttribute(hitCount,"type")).equals("song")))
                    hitCount++;
                    boolean searchFailure = hitCount>10;
                    if(searchFailure) {
                        System.out.println("Error: song was not found");
                        break;
                    }
                if(!searchFailure) {
                    song.setLyrics(getLyrics((String) getHitAttribute(hit[hitCount],"id")));
                }
                String lyrics = data.get("response");
                
                
            } catch(Exception e) {
                System.out.println("Failed to parse response from API client "+e);
            }
            
        } else {
            
            System.out.println("There was an error "+response);
            
            
        }
        
        
        throw new IllegalStateException("Failed to get lyrics");
    }
    
    public Map searchForSongs(String searchTerm) {
        final Client client = ClientBuilder.newClient();
        Response response = getSearchResponse(client, searchTerm);
        final LUXIPSong.Builder builder = new LUXIPSong.Builder();
        if (response.getStatus() == 200) {
            final String strData = response.readEntity(String.class);
            System.out.println("Recieved search response from Genius "+strData);
            final Map<String, Object> data;
            try {
                data = MAPPER.readValue(strData, new TypeReference<Map<String, Object>>() {});
                
                List hits = (ArrayList) ((Map<String,Object>) data.get("response")).get("hits");
                
                ArrayList<LUXIPSong> songCollection = new ArrayList<>();
                
                hits.forEach( hit -> {
                        if(((String) getHitAttribute(hit,"type")).equals("song")) {
                            LUXIPSong newSong = builder.title((String) getHitAttribute(hit,"full_title"))
                                                        .geniusInterest((Integer) getHitStat(hit,"pageviews"))
                                                        .geniusId((String) getHitAttribute(hit,"id"))
                                                        .build();
                            songCollection.add(newSong);
                        }
                    
                    }
                    
                    
                );
                
                
                System.out.println("The title collection was "+songCollection);
                
                
                //need to work out what the response looks like here, and then see if I can take the response and get the first element of the array
                client.close();
                return data;
                
                //new LinkedMultiValueMap( data);
                
            } catch(Exception e) {
                System.out.println("Failed to parse response from API client "+e);
            }
            
        } else {
            
            System.out.println("There was an error "+response.readEntity(String.class));
            
            
        }
        throw new IllegalStateException("Failed to get lyrics");

    }
    
    private Object getHitAttribute(Object data, String attribute) {
        return ((Map<String, Object>) ((Map<String,Object>) data).get("result")).get(attribute);
    }
    
    private Object getHitStat(Object data, String statistic) {
        return ((Map<String,Object>) getHitAttribute(data, "stats")).get(statistic);
    }
    
    private Response getLyricsResponse(Client client, String id) {
        WebTarget myResource = client.target(apiEndpoint+"/songs/"+id);
        Response response = myResource.request(MediaType.APPLICATION_JSON)
        .header("Authorization", "Bearer "+geniusClientKey)
        .get();
        return response;
    }
    
    private Response getSearchResponse(Client client, String query) {
        WebTarget myResource = client.target(apiEndpoint+"/search").queryParam("q", query);
        Response response = myResource.request(MediaType.APPLICATION_JSON)
        .header("Authorization", "Bearer "+geniusClientKey)
        .get();
        return response;
    }


}

