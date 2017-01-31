package LUXIP.Types;



import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.ArrayList;
import java.util.stream.Stream;
import java.util.stream.Collectors;
import java.util.Comparator;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;

import com.google.common.collect.ImmutableList;
import org.apache.commons.collections.CollectionUtils;

/**
 * Datatype to represent a point in the popularity history of a LUXIPSong
 */
public class PopularityPoint {
    
    private final String date;
    private final String time;
    private final Integer spotifyPopularity;
    private final Integer geniusInterest;
    
    public PopularityPoint(final String date,
                           final String time,
                           final Integer spotifyPopularity,
                           final Integer geniusInterest) {
        this.date = date;
        this.time = time;
        this.spotifyPopularity = time;
        this.geniusInterest = geniusInterest;

    }
    
    @Override
    public String toString() {
        return "date: "+date+", time: "+time+", spotifyPopularity: "+spotifyPopularity+", geniusInterest: "
                +geniusInterest;
    }



}

