/**
 * Spotify Heatmap - Utility Helpers
 * Formatting, date parsing, sanitization, and mathematical utilities.
 */

window.SpotifyHeatmap = window.SpotifyHeatmap || {};

window.SpotifyHeatmap.Utils = {
    /**
     * Parses various Spotify timestamp formats into valid Date objects.
     * Supports:
     * - ISO 8601 with UTC suffix ("2023-01-15T12:00:00Z[UTC]" or "2023-01-15T12:00:00[UTC]")
     * - Legacy format ("2023-01-15 12:00")
     * - Standard ISO ("2023-01-15T12:00:00Z")
     */
    parseSpotifyDate(value) {
        if (typeof value !== "string") {
            return null;
        }

        const normalized = value
            .replace("Z[UTC]", "Z")
            .replace(/\[UTC\]$/, "Z")
            .replace(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})$/, "$1T$2:00Z");
        const date = new Date(normalized);
        return Number.isNaN(date.getTime()) ? null : date;
    },

    /**
     * Generates a standard YYYY-MM-DD UTC date key for hash-map lookups.
     */
    toDateKey(date) {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, "0");
        const day = String(date.getUTCDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    },

    /**
     * Formats a date into a full human-readable string (e.g. "Sunday, October 15, 2023").
     */
    formatLongDate(date) {
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: "UTC"
        });
    },

    /**
     * Formats a timestamp into date & time (e.g. "Oct 15, 2023, 02:45 PM").
     */
    formatDateTime(date) {
        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    },

    /**
     * Formats a time string (e.g. "02:45 PM").
     */
    formatTime(date) {
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit"
        });
    },

    /**
     * Formats total minutes into hours with 'k' abbreviation for large values.
     */
    formatHours(totalMinutes) {
        const hours = totalMinutes / 60;
        return hours >= 1000 ? `${(hours / 1000).toFixed(1)}k` : hours.toFixed(1);
    },

    /**
     * Formats millisecond duration into clean hours, minutes, and seconds.
     */
    formatDuration(ms) {
        const totalSeconds = Math.max(0, Math.round(ms / 1000));
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours) {
            return `${hours}h ${minutes}m`;
        }
        if (minutes) {
            return `${minutes}m ${seconds}s`;
        }
        return `${seconds}s`;
    },

    /**
     * Normalizes text for case-insensitive and whitespace-tolerant searches.
     */
    normalizeText(value) {
        return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
    },

    /**
     * Groups and counts items in an array by a key generator function.
     */
    countBy(items, getKey) {
        return items.reduce((counts, item) => {
            const key = getKey(item);
            counts[key] = (counts[key] || 0) + 1;
            return counts;
        }, {});
    },

    /**
     * Calculates local seconds elapsed from start of the day.
     */
    getLocalTimeOfDay(date) {
        return (date.getHours() * 60 * 60) + (date.getMinutes() * 60) + date.getSeconds();
    },

    /**
     * Sanitizes strings for safe HTML rendering.
     */
    escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }
};
