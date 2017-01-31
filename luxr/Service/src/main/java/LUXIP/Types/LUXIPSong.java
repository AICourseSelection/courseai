package LUXIP.Types;


import LUXIP.Types.PopularityPoint;

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
 * Datatype to represent a song
 */
public class LUXIPSong {
    
    private static final String BASE_VERSION = "2017-1-30";
    
    
    private Optional<String> title;
    private Optional<String> sourceUrl;
    private List<String> artists;
    private List<List<String>> popularityHistory;
    private Optional<String> category;
    private Optional<String> subCategory;
    private Optional<String> lyrics;
    private Optional<String> releaseDate;
    private Optional<Integer> noOfStreams;
    private Optional<Integer> geniusInterest;
    private Optional<String> geniusId;
    private Optional<UUID> uuid;
    
    private LUXIPSong(final UUID uuid,
                           final String title,
                           final List<String> artists,
                           final String category,
                           final String subCategory,
                           final String lyrics,
                           final String releaseDate,
                           final Integer noOfStreams,
                           final Integer geniusInterest,
                           final String geniusId) {
        this.uuid = Optional.ofNullable(uuid);
        this.title = Optional.ofNullable(title);
        this.artists = ImmutableList.copyOf(artists);
        this.category = Optional.ofNullable(category);
        this.subCategory = Optional.ofNullable(subCategory);
        this.releaseDate = Optional.ofNullable(releaseDate);
        this.noOfStreams = Optional.ofNullable(noOfStreams);
        this.geniusInterest = Optional.ofNullable(geniusInterest);
        this.geniusId = Optional.ofNullable(geniusId);
    }
    
    @Override
    public String toString() {
        return "uuid: "+uuid+", title: "+title+", artists: "+artists+", category: "
                +category+", subCategory: "+subCategory+", lyrics: "+lyrics+", releaseDate: "+
                releaseDate+", noOfStreams: "+noOfStreams+", geniusInterest: "+geniusInterest;
    }
    
    public void setLyrics(String lyrics) {
        this.lyrics = lyrics;
    }
    
    
    public void addPopularityPoint(final String date,
                                   final String time,
                                   final Integer spotifyPopularity,
                                   final Integer geniusInterest) {
        ArrayList<Integer> popularityPoint = new ArrayList<>();
        popularityPoint.add(date);
        popularityPoint.add(time);
        popularityPoint.add(spotifyPopularity.toString());
        popularityPoint.add(geniusInterest.toString());
        popularityHistory.add(popularityPoint);
    }
    

    public Optional<UUID> getUuid() {
        return uuid;
    }
    
    public void setUuid(final UUID uuid) {
        this.uuid = Optional.ofNullable(uuid);
    }

    
    @Override
    public int hashCode() {
        return uuid.hashCode();
    }
    
    
    public Optional<String> getTitle() {
        return title;
    }
    
    public List<String> getArtists() {
        return artists;
    }
   
    public Optional<Integer> getGeniusInterest() {
        return geniusInterest;
    }
    /**
     * Builder.
     */
    public static class Builder {
        private  String title;
        private  List<String> artists = new ArrayList<>();
        private List<List<Integer>> popularityHistory; = new ArrayList<>();
        private  String category;
        private  String subCategory;
        private  String lyrics;
        private  String geniusId;
        private  String releaseDate;
        private  Integer noOfStreams;
        private  Integer geniusInterest;
        private  UUID uuid;
        
        public Builder() {
            super();
        }
        
        /**
         * Builder-style.
         *
         * @param UUID UUID
         * @return this
         */
        public Builder uuid(final UUID uuid) {
            this.uuid = uuid;
            return this;
        }
        
        /**
         * Builder-style.
         *
         * @param title title
         * @return this
         */
        public Builder title(final String title) {
            this.title = title;
            return this;
        }
        
        /**
         * Builder-style.
         *
         * @param geniusInterest geniusInterest
         * @return this
         */
        public Builder geniusInterest(final Integer geniusInterest) {
            this.geniusInterest = geniusInterest;
            return this;
        }
        
    
        
        /**
         * @param artists artists
         * @return this
         */
        public Builder artists(final List<String> artists) {
            if (CollectionUtils.isNotEmpty(artists)) {
                this.artists.addAll(artists);
            }
            return this;
        }
        
        
        /**
         * @param category category
         * @return this
         */
        public Builder category(final String category) {
            this.category = category;
            return this;
        }
        
        /**
         * @param pophist popularity history
         * @return this
         */
        public Builder category(final String pophist) {
            this.popularityHistory = pophist;
            return this;
        }
        
        /**
         * Builder-style.
         *
         * @param popularityHistory popularityHistory
         * @return this
         */
        public Builder popularityHistory(final ArrayList<ArrayList<String>> popularityHistory) {
            this.popularityHistory = popularityHistory;
            return this;
        }
        
        /**
         * @param lyrics lyrics
         * @return this
         */
        public Builder lyrics(final String lyrics) {
            this.lyrics = lyrics;
            return this;
        }
        
        /**
         * @param releaseDate release date
         * @return this
         */
        public Builder releaseDate(final String releaseDate) {
            this.releaseDate = releaseDate;
            return this;
        }
        
        /**
         * @param noOfStreams number of views the song has recieved on spotify
         * @return this
         */
        public Builder noOfStreams(final int noOfStreams) {
            this.noOfStreams = noOfStreams;
            return this;
        }
        
        /**
         * @param noOfStreams number of views the song has recieved on spotify
         * @return this
         */
        public Builder geniusId(final String geniusId) {
            this.geniusId = geniusId;
            return this;
        }
        
        /**
         * Builds instance.
         *
         * @return LUXIPSong if valid
         */
        public LUXIPSong build() {
            return new LUXIPSong(uuid,
                                      title,
                                      artists, popularityHistory,
                                    category, subCategory, lyrics,
                                      releaseDate, noOfStreams, geniusInterest, popularityHistory, geniusId);
        }
        
        public Builder self() {
            return this;
        }
    }
    
    public static List<LUXIPSong> sortSongsByAttribute(List<LUXIPSong> songs, String attributeName) {
        
        return songs.stream().sorted(Comparator.comparing(LUXIPSong::getGeniusInterest).reversed()).collect(Collectors.toList());
        
        
    }
    
    public SolrInputDocument toSolrInput() {
        final SolrInputDocument inputDocument = new SolrInputDocument();
        inputDocument.addField("_id", getUuid().get());
        inputDocument.addField("title", title.orElse(""));
        inputDocument.addField("sourceUrl", sourceUrl.orElse(""));
        inputDocument.addField("artists", artists.orElse(""));
        inputDocument.addField("popularityHistory", popularityHistory);
        inputDocument.addField("category", category.orElse(""));
        inputDocument.addField("subCategory", subCategory.orElse(""));
        inputDocument.addField("lyrics", lyrics.orElse(""));
        inputDocument.addField("releaseDate", releaseDate.orElse(""));
        inputDocument.addField("noOfStreams", noOfStreams.orElse(""));
        inputDocument.addField("geniusId", geniusId.orElse(""));
        return inputDocument;
    }

    public static LUXIPSong fromSolrInput(SolrInputDocument inputDocument) {
        final LUXIPSong.Builder builder = new LUXIPSong.Builder();
        builder.uuid(inputDocument.getField("_id"))
                .title(inputDocument.getField("title"))
                .sourceUrl(inputDocument.getField("sourceUrl"))
                .artists(inputDocument.getField("artists"))
                .popularityHistory(inputDocument.getField("popularityHistory"))
                .category(inputDocument.getField("category"))
                .subCategory(inputDocument.getField("subCategory"))
                .lyrics(inputDocument.getField("lyrics"))
                .releaseDate(inputDocument.getField("releaseDate"))
                .noOfStreams(inputDocument.getField("noOfStreams"))
                .geniusId(inputDocument.getField("geniusId"))
                .build();
    }



}

