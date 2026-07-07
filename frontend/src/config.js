const API_URL = process.env.NODE_ENV === 'production'
  ? process.env.REACT_APP_API_URL || 'https://grant-trader-api.onrender.com'
  : '';

export default API_URL;
