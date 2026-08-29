/**
 * Spotify Heatmap - Application Constants & Configuration
 * Provides color schemes, calendar labels, and default configurations.
 */

window.SpotifyHeatmap = window.SpotifyHeatmap || {};

window.SpotifyHeatmap.Constants = {
    COLORS: {
        black: "#191414",
        green: "#1db954",
        heatmap: [
            "#262629", // Level 0: Inactive / no listening
            "#0f4d25", // Level 1: Low activity (<= 25% of peak)
            "#167536", // Level 2: Moderate activity (<= 50% of peak)
            "#1db954", // Level 3: High activity (<= 75% of peak)
            "#5fe37f"  // Level 4: Peak activity (> 75% of peak)
        ]
    },

    MONTH_NAMES: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ],

    WEEKDAY_LABELS: ["Sun", "", "Tue", "", "Thu", "", "Sat"],

    SORT_OPTIONS: {
        TIME_ASC: "time-asc",
        MINUTES_DESC: "minutes-desc",
        MINUTES_ASC: "minutes-asc",
        TRACK_ASC: "track-asc"
    },

    SOURCE_CATEGORIES: {
        ALL: "all",
        SEARCHED: "searched",
        PLAYLIST: "playlist",
        MANUAL: "manual",
        APP: "app",
        UNKNOWN: "unknown"
    }
};
