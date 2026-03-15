// Locale detection middleware
// Attaches req.locale = { language, region }

const parseLanguageHeader = (header) => {
  if (!header) return null;
  // Example: "en-US,en;q=0.9,fr;q=0.8"
  const first = header.split(',')[0];
  const [langPart] = first.split(';');
  const [language, region] = langPart.trim().split('-');
  return {
    language: language ? language.toLowerCase() : null,
    region: region ? region.toUpperCase() : null,
  };
};

module.exports = (req, res, next) => {
  const defaultLanguage = 'en';
  const defaultRegion = 'US';

  let language = defaultLanguage;
  let region = defaultRegion;

  // Query params override
  if (req.query.lang) {
    language = String(req.query.lang).toLowerCase();
  }
  if (req.query.region) {
    region = String(req.query.region).toUpperCase();
  }

  // Accept-Language header as fallback
  if (!req.query.lang) {
    const parsed = parseLanguageHeader(req.headers['accept-language']);
    if (parsed?.language) {
      language = parsed.language;
    }
    if (parsed?.region && !req.query.region) {
      region = parsed.region;
    }
  }

  // User preferences (if available)
  if (req.user && req.user.preferences) {
    if (req.user.preferences.language) {
      language = req.user.preferences.language.toLowerCase();
    }
    if (req.user.preferences.region) {
      region = req.user.preferences.region.toUpperCase();
    }
  }

  req.locale = { language, region };
  next();
};