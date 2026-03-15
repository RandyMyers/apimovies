const tmdbService = require('./tmdbService');
const UserTVShow = require('../models/UserTVShow');
const EpisodeTracking = require('../models/EpisodeTracking');

/**
 * Calculate countdown to episode air date
 */
function calculateCountdown(airDate) {
  if (!airDate) return null;
  
  const now = new Date();
  const air = new Date(airDate);
  const diff = air - now;
  
  if (diff < 0) return null; // Already aired
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return {
    days,
    hours,
    minutes,
    totalMinutes: Math.floor(diff / (1000 * 60)),
  };
}

/**
 * Get next episode to air for a TV show
 * Uses TMDb's next_episode_to_air field
 */
async function getNextEpisodeForShow(tvId) {
  try {
    const tvDetails = await tmdbService.getTVDetails(tvId);
    
    if (!tvDetails) return null;
    if (tvDetails.next_episode_to_air && typeof tvDetails.next_episode_to_air === 'object' && tvDetails.next_episode_to_air.air_date) {
      return tvDetails.next_episode_to_air;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Get all episodes for a season with air dates
 */
async function getSeasonEpisodes(tvId, seasonNumber) {
  try {
    const season = await tmdbService.getTVSeason(tvId, seasonNumber);
    return season.episodes || []; // Array of episodes with air_date
  } catch (error) {
    console.error(`Error fetching season ${seasonNumber} episodes for TV show ${tvId}:`, error);
    return [];
  }
}

/**
 * Get upcoming episodes. For guests: use TMDb airing_today + on_the_air. For users: filter by tracked shows.
 * TMDb: /tv/airing_today = shows airing today; /tv/on_the_air = shows that air in the next 7 days.
 */
async function getUpcomingEpisodesForUser(userId) {
  try {
    // Fetch both airing today and on the air, then merge and dedupe by show id
    const [airingTodayResponse, onTheAirResponse] = await Promise.all([
      tmdbService.getAiringTodayTV(1, 'en-US'),
      tmdbService.getOnTheAirTV(1, 'en-US'),
    ]);
    const airingToday = airingTodayResponse.results || [];
    const onTheAir = onTheAirResponse.results || [];
    const seenIds = new Set();
    const airingShows = [];
    for (const show of [...airingToday, ...onTheAir]) {
      if (show && show.id && !seenIds.has(show.id)) {
        seenIds.add(show.id);
        airingShows.push(show);
      }
    }

    // If user is authenticated, filter to only their tracked shows
    let showsToProcess = airingShows;
    if (userId) {
      const userTVShows = await UserTVShow.find({
        userId,
        status: { $in: ['watching', 'want_to_watch'] },
      });
      const trackedTvIds = new Set(userTVShows.map(show => show.tmdbTvId));
      showsToProcess = airingShows.filter(show => trackedTvIds.has(show.id));
    }

    const upcomingEpisodes = [];

    // For each show that's airing, get detailed episode info
    for (const show of showsToProcess) {
      try {
        // Get full TV details to get next_episode_to_air with episode details
        const tvDetails = await tmdbService.getTVDetails(show.id);
        const nextEpisode = tvDetails.next_episode_to_air;
        
        if (nextEpisode && nextEpisode.air_date) {
          // Get watch providers for the show
          let watchProviders = null;
          try {
            const providersData = await tmdbService.getTVWatchProviders(show.id, 'US');
            watchProviders = providersData.results?.US || null;
          } catch (error) {
            console.warn(`Could not fetch watch providers for show ${show.id}:`, error.message);
          }

          // Get network information (first network from networks array)
          const network = tvDetails.networks && tvDetails.networks.length > 0 
            ? tvDetails.networks[0].name 
            : null;

          // Format air time
          const airDateTime = new Date(nextEpisode.air_date);
          const airTime = airDateTime.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
          });

          upcomingEpisodes.push({
            tvId: show.id,
            showName: tvDetails.name || show.name || 'Unknown Show',
            showPoster: tvDetails.poster_path || show.poster_path,
            nextEpisode: nextEpisode,
            countdown: calculateCountdown(nextEpisode.air_date),
            watchProviders: watchProviders,
            network: network,
            airTime: airTime,
            airDateTime: airDateTime,
          });
        }
      } catch (error) {
        // Continue with other shows
      }
    }

    // Sort by air date and time (soonest first)
    return upcomingEpisodes.sort(
      (a, b) => a.airDateTime - b.airDateTime
    );
  } catch (error) {
    console.error('Error fetching upcoming episodes:', error);
    throw error;
  }
}

/**
 * Get recently aired episodes (last N days)
 */
async function getRecentEpisodesForUser(userId, days = 7) {
  try {
    if (!userId) return [];

    const userTVShows = await UserTVShow.find({
      userId,
      status: { $in: ['watching', 'completed'] },
    });

    if (userTVShows.length === 0) {
      return [];
    }

    const recentEpisodes = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const now = new Date();

    for (const show of userTVShows) {
      try {
        // Get TV details first to find the latest season
        const tvDetails = await tmdbService.getTVDetails(show.tmdbTvId);
        
        if (!tvDetails || !tvDetails.seasons || tvDetails.seasons.length === 0) continue;

        const latestSeason = tvDetails.seasons[tvDetails.seasons.length - 1];
        
        const season = await tmdbService.getTVSeason(show.tmdbTvId, latestSeason.season_number);
        let episodes = season.episodes || [];
        
        // Also check the previous season if latest has no episodes
        if (episodes.length === 0 && tvDetails.seasons.length > 1) {
          const prevSeason = tvDetails.seasons[tvDetails.seasons.length - 2];
          const prevSeasonData = await tmdbService.getTVSeason(show.tmdbTvId, prevSeason.season_number);
          episodes = prevSeasonData.episodes || [];
        }

        const recent = episodes.filter((ep) => {
          if (!ep.air_date) return false;
          const airDate = new Date(ep.air_date);
          return airDate >= cutoffDate && airDate <= now;
        });

        if (recent.length > 0) {
          recentEpisodes.push(
            ...recent.map((ep) => ({
              tvId: show.tmdbTvId,
              showName: tvDetails.name || 'Unknown Show',
              showPoster: tvDetails.poster_path,
              episode: ep,
              isWatched: false, // Will be checked from EpisodeTracking
            }))
          );
        }
      } catch (error) {
        // Continue with other shows
      }
    }

    // Sort by air date (most recent first)
    const sorted = recentEpisodes.sort(
      (a, b) => new Date(b.episode.air_date) - new Date(a.episode.air_date)
    );

    // Check which episodes are watched
    for (const item of sorted) {
      const tracking = await EpisodeTracking.findOne({
        userId,
        tmdbTvId: item.tvId,
        seasonNumber: item.episode.season_number,
        episodeNumber: item.episode.episode_number,
        isWatched: true,
      });
      item.isWatched = !!tracking;
    }

    return sorted;
  } catch (error) {
    throw error;
  }
}

/**
 * Get "What's Next" list - shows ordered by countdown to next episode
 */
/**
 * Get "What's Next" list - shows ordered by countdown to next episode
 * Uses /tv/airing_today endpoint to get shows airing today
 * If userId is provided, filters to only user's tracked shows
 * If userId is null, returns all shows airing today
 */
async function getWhatsNextEpisodes(userId) {
  try {
    const airingTodayResponse = await tmdbService.getAiringTodayTV(1, 'en-US');
    const airingTodayShows = airingTodayResponse.results || [];

    let showsToProcess = airingTodayShows;
    if (userId) {
      const userTVShows = await UserTVShow.find({
        userId,
        status: { $in: ['watching', 'want_to_watch'] },
      });
      const trackedTvIds = new Set(userTVShows.map(show => show.tmdbTvId));
      showsToProcess = airingTodayShows.filter(show => trackedTvIds.has(show.id));
    }

    const whatsNext = [];

    // For each show airing today, get detailed episode info
    for (const show of showsToProcess) {
      try {
        // Get full TV details to get next_episode_to_air with episode details
        const tvDetails = await tmdbService.getTVDetails(show.id);
        const nextEpisode = tvDetails.next_episode_to_air;
        
        if (nextEpisode && nextEpisode.air_date) {
          const countdown = calculateCountdown(nextEpisode.air_date);
          
          // Only include if episode hasn't aired yet (countdown is not null)
          if (countdown !== null) {
            // Get watch providers for the show
            let watchProviders = null;
            try {
              const providersData = await tmdbService.getTVWatchProviders(show.id, 'US');
              watchProviders = providersData.results?.US || null;
            } catch (error) {
              console.warn(`Could not fetch watch providers for show ${show.id}:`, error.message);
            }

            // Get network information
            const network = tvDetails.networks && tvDetails.networks.length > 0 
              ? tvDetails.networks[0].name 
              : null;

            // Format air time
            const airDateTime = new Date(nextEpisode.air_date);
            const airTime = airDateTime.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit', 
              hour12: true 
            });

            whatsNext.push({
              tvId: show.id,
              showName: tvDetails.name || show.name || 'Unknown Show',
              showPoster: tvDetails.poster_path || show.poster_path,
              nextEpisode: nextEpisode,
              countdown: countdown,
              watchProviders: watchProviders,
              network: network,
              airTime: airTime,
              airDateTime: airDateTime,
            });
          }
        }
      } catch (error) {
        // Continue with other shows
      }
    }

    return whatsNext.sort((a, b) => {
      if (a.countdown.totalMinutes !== b.countdown.totalMinutes) {
        return a.countdown.totalMinutes - b.countdown.totalMinutes;
      }
      return a.airDateTime - b.airDateTime;
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Get all episodes that air in a given month (1st through last day).
 * Uses TMDb discover/tv with air_date.gte and air_date.lte, then for each show
 * fetches relevant season(s) and collects episodes with air_date in range.
 * No DB storage: computed on demand (can add in-memory cache keyed by year-month later).
 */
async function getEpisodesForMonth(year, month) {
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  if (Number.isNaN(y) || Number.isNaN(m) || m < 1 || m > 12) {
    return [];
  }
  const firstDay = new Date(y, m - 1, 1);
  const lastDay = new Date(y, m, 0);
  const airDateGte = firstDay.toISOString().split('T')[0];
  const airDateLte = lastDay.toISOString().split('T')[0];

  const allShows = [];
  for (let page = 1; page <= 2; page++) {
    try {
      const res = await tmdbService.discoverTV({
        airDateGte,
        airDateLte,
        page,
        language: 'en-US',
      });
      const results = res.results || [];
      allShows.push(...results);
      if (results.length < 20) break;
    } catch (err) {
      break;
    }
  }

  const seen = new Set();
  const byShowId = new Map();
  for (const show of allShows) {
    if (!show.id || byShowId.has(show.id)) continue;
    byShowId.set(show.id, show);
  }

  const episodesInRange = [];

  for (const show of byShowId.values()) {
    try {
      const tvDetails = await tmdbService.getTVDetails(show.id);
      const seasons = tvDetails.seasons || [];
      const nextEp = tvDetails.next_episode_to_air;
      const lastEp = tvDetails.last_episode_to_air;
      const seasonNumbersToFetch = new Set();
      if (nextEp && nextEp.season_number != null) seasonNumbersToFetch.add(nextEp.season_number);
      if (lastEp && lastEp.season_number != null) seasonNumbersToFetch.add(lastEp.season_number);
      if (seasonNumbersToFetch.size === 0 && seasons.length > 0) {
        const lastSeason = seasons[seasons.length - 1];
        if (lastSeason.season_number != null) seasonNumbersToFetch.add(lastSeason.season_number);
      }

      for (const sn of seasonNumbersToFetch) {
        const seasonData = await tmdbService.getTVSeason(show.id, sn);
        const episodes = seasonData.episodes || [];
        const network = tvDetails.networks && tvDetails.networks[0] ? tvDetails.networks[0].name : null;
        const showName = tvDetails.name || show.name || 'Unknown Show';
        const showPoster = tvDetails.poster_path || show.poster_path;

        for (const ep of episodes) {
          if (!ep.air_date) continue;
          const airDate = new Date(ep.air_date);
          if (airDate < firstDay || airDate > lastDay) continue;
          const key = `${show.id}-${ep.season_number}-${ep.episode_number}-${ep.air_date}`;
          if (seen.has(key)) continue;
          seen.add(key);

          const airTime = airDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          episodesInRange.push({
            tvId: show.id,
            showName,
            showPoster,
            episode: ep,
            nextEpisode: ep,
            airDateTime: airDate,
            airTime,
            network,
          });
        }
      }
    } catch (err) {
      // skip show
    }
  }

  episodesInRange.sort((a, b) => a.airDateTime - b.airDateTime);
  return episodesInRange;
}

module.exports = {
  getNextEpisodeForShow,
  getSeasonEpisodes,
  getUpcomingEpisodesForUser,
  getRecentEpisodesForUser,
  getWhatsNextEpisodes,
  getEpisodesForMonth,
  calculateCountdown,
};

