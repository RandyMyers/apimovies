/**
 * TMDb API service - movies, TV, trending, search, etc.
 * Requires TMDB_API_KEY in environment.
 * @see https://developer.themoviedb.org/docs
 */
const axios = require('axios');

const BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';

function getApiKey() {
  return process.env.TMDB_API_KEY || '';
}

async function request(path, params = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('TMDB_API_KEY is not configured. Add it to your .env file.');
  }
  const { data } = await axios.get(`${BASE}${path}`, {
    params: { api_key: apiKey, ...params },
    timeout: 10000,
  });
  return data;
}

// --- Movies ---
async function getPopularMovies(page = 1, language = 'en-US') {
  return request('/movie/popular', { page, language });
}

async function getTopRatedMovies(page = 1, language = 'en-US') {
  return request('/movie/top_rated', { page, language });
}

async function getUpcomingMovies(page = 1, language = 'en-US') {
  return request('/movie/upcoming', { page, language });
}

async function getNowPlayingMovies(page = 1, language = 'en-US') {
  return request('/movie/now_playing', { page, language });
}

async function getTrending(mediaType, timeWindow = 'day', language = 'en-US') {
  return request(`/trending/${mediaType}/${timeWindow}`, { language });
}

async function searchMovies(query, options = {}) {
  const { page = 1, language = 'en-US', includeAdult = false, year } = options;
  const params = { query, page, language, include_adult: includeAdult };
  if (year) params.year = year;
  return request('/search/movie', params);
}

async function discoverMovies(filters = {}) {
  const params = {
    page: filters.page || 1,
    language: filters.language || 'en-US',
    sort_by: filters.sortBy,
    with_genres: filters.genres,
    year: filters.year,
    'vote_average.gte': filters.minRating,
    'vote_average.lte': filters.maxRating,
    with_watch_providers: filters.watchProviders,
    watch_region: filters.watchRegion || 'US',
  };
  Object.keys(params).forEach((k) => params[k] == null && delete params[k]);
  return request('/discover/movie', params);
}

async function getMovieDetails(movieId, options = {}) {
  const { appendToResponse, language = 'en-US' } = options;
  const params = { language };
  if (appendToResponse) params.append_to_response = appendToResponse;
  return request(`/movie/${movieId}`, params);
}

async function getMovieVideos(movieId, language = 'en-US') {
  return request(`/movie/${movieId}/videos`, { language });
}

async function getMovieImages(movieId, language = 'en-US') {
  return request(`/movie/${movieId}/images`, { language, include_image_language: 'en,null' });
}

async function getMovieCredits(movieId, language = 'en-US') {
  return request(`/movie/${movieId}/credits`, { language });
}

async function getSimilarMovies(movieId, page = 1, language = 'en-US') {
  return request(`/movie/${movieId}/similar`, { page, language });
}

async function getMovieRecommendations(movieId, page = 1, language = 'en-US') {
  return request(`/movie/${movieId}/recommendations`, { page, language });
}

async function getMovieWatchProviders(movieId, region = 'US') {
  return request(`/movie/${movieId}/watch/providers`, {});
}

async function getMovieReviews(movieId, page = 1, language = 'en-US') {
  return request(`/movie/${movieId}/reviews`, { page, language });
}

async function getMovieLatest() {
  return request('/movie/latest');
}

async function getMovieChanges(options = {}) {
  const params = { page: options.page || 1 };
  if (options.startDate) params.start_date = options.startDate;
  if (options.endDate) params.end_date = options.endDate;
  return request('/movie/changes', params);
}

async function getMovieAlternativeTitles(movieId, country) {
  const params = country ? { country } : {};
  return request(`/movie/${movieId}/alternative_titles`, params);
}

async function getMovieExternalIds(movieId) {
  return request(`/movie/${movieId}/external_ids`);
}

async function getMovieKeywords(movieId) {
  return request(`/movie/${movieId}/keywords`);
}

async function getMovieReleaseDates(movieId) {
  return request(`/movie/${movieId}/release_dates`);
}

async function getMovieTranslations(movieId) {
  return request(`/movie/${movieId}/translations`);
}

async function getMovieLists(movieId, page = 1, language = 'en-US') {
  return request(`/movie/${movieId}/lists`, { page, language });
}

async function getMovieGenres(language = 'en-US') {
  return request('/genre/movie/list', { language });
}

async function getTVGenres(language = 'en-US') {
  return request('/genre/tv/list', { language });
}

// --- TV ---
async function getPopularTV(page = 1, language = 'en-US') {
  return request('/tv/popular', { page, language });
}

async function getTopRatedTV(page = 1, language = 'en-US') {
  return request('/tv/top_rated', { page, language });
}

async function getOnTheAirTV(page = 1, language = 'en-US') {
  return request('/tv/on_the_air', { page, language });
}

async function getAiringTodayTV(page = 1, language = 'en-US') {
  return request('/tv/airing_today', { page, language });
}

async function searchTV(query, options = {}) {
  const { page = 1, language = 'en-US', includeAdult = false, firstAirDateYear } = options;
  const params = { query, page, language, include_adult: includeAdult };
  if (firstAirDateYear) params.first_air_date_year = firstAirDateYear;
  return request('/search/tv', params);
}

async function searchMulti(query, options = {}) {
  const { page = 1, language = 'en-US', includeAdult = false } = options;
  return request('/search/multi', {
    query,
    page,
    language,
    include_adult: includeAdult,
  });
}

async function discoverTV(filters = {}) {
  const params = {
    page: filters.page || 1,
    language: filters.language || 'en-US',
    sort_by: filters.sortBy,
    with_genres: filters.genres,
    first_air_date_year: filters.year,
    'vote_average.gte': filters.minRating,
    'vote_average.lte': filters.maxRating,
    with_watch_providers: filters.watchProviders,
    watch_region: filters.watchRegion || 'US',
  };
  Object.keys(params).forEach((k) => params[k] == null && delete params[k]);
  return request('/discover/tv', params);
}

async function getTVDetails(tvId, options = {}) {
  const { appendToResponse, language = 'en-US' } = options;
  const params = { language };
  if (appendToResponse) params.append_to_response = appendToResponse;
  return request(`/tv/${tvId}`, params);
}

async function getTVSeason(tvId, seasonNumber, language = 'en-US') {
  return request(`/tv/${tvId}/season/${seasonNumber}`, { language });
}

async function getTVVideos(tvId, language = 'en-US') {
  return request(`/tv/${tvId}/videos`, { language });
}

async function getTVImages(tvId, language = 'en-US') {
  return request(`/tv/${tvId}/images`, { language, include_image_language: 'en,null' });
}

async function getTVCredits(tvId, language = 'en-US') {
  return request(`/tv/${tvId}/credits`, { language });
}

async function getTVAggregateCredits(tvId, language = 'en-US') {
  return request(`/tv/${tvId}/aggregate_credits`, { language });
}

async function getSimilarTV(tvId, page = 1, language = 'en-US') {
  return request(`/tv/${tvId}/similar`, { page, language });
}

async function getTVRecommendations(tvId, page = 1, language = 'en-US') {
  return request(`/tv/${tvId}/recommendations`, { page, language });
}

async function getTVWatchProviders(tvId, region = 'US') {
  return request(`/tv/${tvId}/watch/providers`, {});
}

async function getTVReviews(tvId, page = 1, language = 'en-US') {
  return request(`/tv/${tvId}/reviews`, { page, language });
}

async function getTVLatest() {
  return request('/tv/latest');
}

async function getTVChanges(options = {}) {
  const params = { page: options.page || 1 };
  if (options.startDate) params.start_date = options.startDate;
  if (options.endDate) params.end_date = options.endDate;
  return request('/tv/changes', params);
}

async function getTVEpisodeGroup(episodeGroupId, language = 'en-US') {
  return request(`/tv/episode_group/${episodeGroupId}`, { language });
}

async function getTVAlternativeTitles(tvId) {
  return request(`/tv/${tvId}/alternative_titles`);
}

async function getTVContentRatings(tvId) {
  return request(`/tv/${tvId}/content_ratings`);
}

async function getTVKeywords(tvId) {
  return request(`/tv/${tvId}/keywords`);
}

async function getTVTranslations(tvId) {
  return request(`/tv/${tvId}/translations`);
}

async function getTVLists(tvId, page = 1, language = 'en-US') {
  return request(`/tv/${tvId}/lists`, { page, language });
}

async function getTVEpisodeGroups(tvId) {
  return request(`/tv/${tvId}/episode_groups`);
}

async function getTVScreenedTheatrically(tvId) {
  return request(`/tv/${tvId}/screened_theatrically`);
}

async function getTVSeasonCredits(tvId, seasonNumber, language = 'en-US') {
  return request(`/tv/${tvId}/season/${seasonNumber}/credits`, { language });
}

async function getTVSeasonImages(tvId, seasonNumber, language = 'en-US') {
  return request(`/tv/${tvId}/season/${seasonNumber}/images`, { language });
}

async function getTVSeasonVideos(tvId, seasonNumber, language = 'en-US') {
  return request(`/tv/${tvId}/season/${seasonNumber}/videos`, { language });
}

async function getTVEpisodeCredits(tvId, seasonNumber, episodeNumber, language = 'en-US') {
  return request(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}/credits`, { language });
}

async function getTVEpisodeImages(tvId, seasonNumber, episodeNumber, language = 'en-US') {
  return request(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}/images`, { language });
}

async function getTVEpisodeVideos(tvId, seasonNumber, episodeNumber, language = 'en-US') {
  return request(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}/videos`, { language });
}

// --- Content enrichment (for analytics) ---
async function fetchMovie(id) {
  const apiKey = getApiKey();
  if (!apiKey) return { title: null, posterUrl: null };
  try {
    const data = await request(`/movie/${id}`);
    return {
      title: data.title || null,
      posterUrl: data.poster_path ? `https://image.tmdb.org/t/p/w92${data.poster_path}` : null,
    };
  } catch {
    return { title: null, posterUrl: null };
  }
}

async function fetchTV(id) {
  const apiKey = getApiKey();
  if (!apiKey) return { title: null, posterUrl: null };
  try {
    const data = await request(`/tv/${id}`);
    return {
      title: data.name || null,
      posterUrl: data.poster_path ? `https://image.tmdb.org/t/p/w92${data.poster_path}` : null,
    };
  } catch {
    return { title: null, posterUrl: null };
  }
}

async function enrichMovies(movies, limit = 20) {
  const apiKey = getApiKey();
  if (!apiKey || !movies?.length) return movies;
  const toEnrich = movies.slice(0, limit);
  const results = await Promise.all(
    toEnrich.map(async (m) => {
      const meta = await fetchMovie(m.tmdbMovieId);
      return { ...m, title: meta.title, posterUrl: meta.posterUrl };
    })
  );
  return [...results, ...movies.slice(limit)];
}

async function enrichTVShows(tvShows, limit = 20) {
  const apiKey = getApiKey();
  if (!apiKey || !tvShows?.length) return tvShows;
  const toEnrich = tvShows.slice(0, limit);
  const results = await Promise.all(
    toEnrich.map(async (t) => {
      const meta = await fetchTV(t.tmdbTvId);
      return { ...t, title: meta.title, posterUrl: meta.posterUrl };
    })
  );
  return [...results, ...tvShows.slice(limit)];
}

module.exports = {
  getPopularMovies,
  getTopRatedMovies,
  getUpcomingMovies,
  getNowPlayingMovies,
  getTrending,
  searchMovies,
  searchMulti,
  discoverMovies,
  getMovieDetails,
  getMovieVideos,
  getMovieImages,
  getMovieCredits,
  getSimilarMovies,
  getMovieRecommendations,
  getMovieWatchProviders,
  getMovieReviews,
  getMovieLatest,
  getMovieChanges,
  getMovieAlternativeTitles,
  getMovieExternalIds,
  getMovieKeywords,
  getMovieReleaseDates,
  getMovieTranslations,
  getMovieLists,
  getMovieGenres,
  getTVGenres,
  getPopularTV,
  getTopRatedTV,
  getOnTheAirTV,
  getAiringTodayTV,
  searchTV,
  discoverTV,
  getTVDetails,
  getTVSeason,
  getTVVideos,
  getTVImages,
  getTVCredits,
  getTVAggregateCredits,
  getSimilarTV,
  getTVRecommendations,
  getTVWatchProviders,
  getTVReviews,
  getTVLatest,
  getTVChanges,
  getTVEpisodeGroup,
  getTVAlternativeTitles,
  getTVContentRatings,
  getTVKeywords,
  getTVTranslations,
  getTVLists,
  getTVEpisodeGroups,
  getTVScreenedTheatrically,
  getTVSeasonCredits,
  getTVSeasonImages,
  getTVSeasonVideos,
  getTVEpisodeCredits,
  getTVEpisodeImages,
  getTVEpisodeVideos,
  fetchMovie,
  fetchTV,
  enrichMovies,
  enrichTVShows,
};
