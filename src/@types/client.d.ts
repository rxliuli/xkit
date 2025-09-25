declare global {
  interface Window {
    __TWITTER_WEB_API__: import('./twitter-web-api').TwitterWebAPI
  }
}
export {}
