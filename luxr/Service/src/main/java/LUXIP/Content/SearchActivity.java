package LUXIP.content;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.xml.sax.InputSource;

import LUXIP.Wrappers.Lyrics.LyricsGetter;


import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.beans.factory.annotation.Qualifier;


import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;


/**
 * @author 
 */
@RestController
public class SearchActivity {
    @Autowired
    private LyricsGetter lyricsGetter;
    
    @RequestMapping(value = "/search/{search_term}", method = RequestMethod.GET, produces = "application/json")
    @ResponseBody
    public ResponseEntity search(@PathVariable("search_term") final String search_term) {
        lyricsGetter.searchForSongs(search_term);
        return new ResponseEntity(new HttpHeaders(), null,HttpStatus.OK);
    }
    
    
}
