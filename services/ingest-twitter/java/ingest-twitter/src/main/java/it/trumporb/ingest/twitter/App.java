package it.trumporb.ingest.twitter;

import com.google.common.collect.Lists;

import com.twitter.hbc.ClientBuilder;
import com.twitter.hbc.core.Client;
import com.twitter.hbc.core.Constants;
import com.twitter.hbc.core.endpoint.StatusesFilterEndpoint;
import com.twitter.hbc.core.processor.StringDelimitedProcessor;
import com.twitter.hbc.httpclient.auth.Authentication;
import com.twitter.hbc.httpclient.auth.OAuth1;
import com.twitter.hbc.twitter4j.Twitter4jStatusClient;

import twitter4j.StallWarning;
import twitter4j.Status;
import twitter4j.StatusDeletionNotice;
import twitter4j.StatusListener;
import twitter4j.User;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.IOException;

import java.util.concurrent.BlockingQueue;
import java.util.concurrent.Executors;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.Date;
import java.util.Hashtable;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

/**
 * Hello world!
 *
 */
public class App
{
  private static long TRUMP_ID = 25073877;
  private static Hashtable<Long, Integer> favoriteCounts = new Hashtable<Long, Integer>();
  public static int followersCount = 0;
  public static Date lastFollowersUpdate = new Date(Long.MIN_VALUE);

  // private class Count<T> {
  //   private Date lastUpdate;
  //   private T lastValue;

  //   public Count(T value) {
  //     lastValue = value;
  //     lastUpdate = Date.getNow();
  //   }

  //   public T update (Date date, T value) {
  //     if (date >= lastUpdate) lastValue = value;
  //   }

  //   public T getValue() { return lastValue; }
  // }

  public static void run( String consumerKey,
                          String consumerSecret,
                          String token,
                          String secret,
                          List<Long> followings ) throws InterruptedException
  {
    BlockingQueue<String> queue = new LinkedBlockingQueue<String>(1000000);
    StatusesFilterEndpoint endpoint = new StatusesFilterEndpoint();

    endpoint.followings(followings);

    Authentication auth = new OAuth1(consumerKey, consumerSecret, token, secret);

    Client client = new ClientBuilder()
            .hosts(Constants.STREAM_HOST)
            .endpoint(endpoint)
            .authentication(auth)
            .processor(new StringDelimitedProcessor(queue))
            .build();

    int threads = 1;
    ExecutorService service = Executors.newFixedThreadPool(threads);

    Twitter4jStatusClient t4jClient = new Twitter4jStatusClient(client, queue, Lists.newArrayList(createListener()), service);

    t4jClient.connect();

    for (int i = 0; i < threads; i++) t4jClient.process();

    while (!client.isDone()) {
      Thread.sleep(2000);
    }

    client.stop();
  }

  private static <T> T coalesce(T a, T b) {
    return a == null ? b : a;
  }

  public static StatusListener createListener() {
    return new StatusListener() {
      @Override
      public void onStatus(Status status) {
        User user = status.getUser();
        String text = status.getText();
        Date createdAt = status.getCreatedAt();

        // handle TRUMP tweet
        if (!isNullOrEmpty(text) && user.getId() == TRUMP_ID) {
          long id = status.getId();

          int oldFavoriteCount = coalesce(favoriteCounts.get(id), 0);
          int favoriteCount = status.getFavoriteCount();
          favoriteCounts.put(id, favoriteCount);

          int favoriteChange = favoriteCount - oldFavoriteCount;

          int currentFollowersCount = user != null ? user.getFollowersCount() : -1;

          if (createdAt != null) {
            if (createdAt.before(lastFollowersUpdate)) currentFollowersCount = followersCount;
            else lastFollowersUpdate = createdAt;
          }

          int followersChange = followersCount > 0 && currentFollowersCount > -1 ? currentFollowersCount - followersCount : 0;

          if (currentFollowersCount > -1) {
            followersCount = currentFollowersCount;
          }

          System.out.println("t," + id + "," + favoriteChange + "," + followersChange);
        }
        // handle retweet
        else if (status.isRetweet()) {
          Status tweet = status.getRetweetedStatus();

          long id = tweet.getId();

          int favoriteCount = tweet.getFavoriteCount();
          int oldFavoriteCount = coalesce(favoriteCounts.get(id), favoriteCount);
          favoriteCounts.put(id, favoriteCount);

          int favoriteChange = favoriteCount - oldFavoriteCount;

          User tweetUser = tweet.getUser();

          if (tweetUser != null && tweetUser.getId() == TRUMP_ID) {
            int currentFollowersCount = user != null ? tweetUser.getFollowersCount() : -1;

            if (createdAt != null) {
              if (createdAt.before(lastFollowersUpdate)) currentFollowersCount = followersCount;
              else lastFollowersUpdate = createdAt;
            }

            int followersChange = followersCount > 0 && currentFollowersCount > -1 ? currentFollowersCount - followersCount : 0;

            if (currentFollowersCount > -1) {
              followersCount = currentFollowersCount;
            }



            System.out.println("r," + id + "," + favoriteChange + "," + followersChange);
          }
        }
        else {
          // System.err.println(status.toString());
        }
      }

      @Override
      public void onStallWarning(StallWarning warning) {
        System.err.println(warning.toString());
      }

      @Override
      public void onDeletionNotice(StatusDeletionNotice statusDeletionNotice) {}

      @Override
      public void onTrackLimitationNotice(int limit) {}

      @Override
      public void onScrubGeo(long user, long upToStatus) {}

      @Override
      public void onException(Exception e) {}
    };
  }

  public static void main(String[] args) {
    List<Long> followings = Lists.newArrayList(TRUMP_ID);

    // try {
    //   BufferedReader in = new BufferedReader(new InputStreamReader(System.in));

    //   String input = in.readLine();

    //   String[] idStrings = input.split(",");

    //   for (int i = 0; i < idStrings.length; i++) {
    //     followings.add(Long.valueOf(idStrings[i]));
    //   }
    // }
    // catch (IOException e) {
    //   System.out.println(e);
    // }

    Map<String, String> env = System.getenv();

    try {
      App.run(env.get("CONSUMER_KEY"), env.get("CONSUMER_SECRET"), env.get("TOKEN"), env.get("SECRET"), followings);
    } catch (InterruptedException e) {
      System.out.println(e);
    }
  }

  private static boolean isNullOrEmpty(String s) {
    return s == null || "".equals(s);
  }
}