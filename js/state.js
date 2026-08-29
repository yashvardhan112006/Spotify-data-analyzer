/**
 * Spotify Heatmap - Application State Store
 * Central state management for loaded streaming records, active selections, and filters.
 */

window.SpotifyHeatmap = window.SpotifyHeatmap || {};

(function () {
    const initialState = {
        files: [],
        rawEntries: [],
        searchEvents: [],
        dayMap: new Map(),
        songMap: new Map(),
        years: [],
        selectedYear: null,
        selectedDateKey: null,
        selectedSongKey: null,
        monthFilter: "all",
        searchTerm: "",
        sourceFilter: "all",
        sortMode: "time-asc",
        dayVisibility: "all"
    };

    window.SpotifyHeatmap.State = {
        ...initialState,

        /**
         * Resets the entire application state back to pristine empty values.
         */
        reset() {
            Object.assign(this, {
                files: [],
                rawEntries: [],
                searchEvents: [],
                dayMap: new Map(),
                songMap: new Map(),
                years: [],
                selectedYear: null,
                selectedDateKey: null,
                selectedSongKey: null,
                monthFilter: "all",
                searchTerm: "",
                sourceFilter: "all",
                sortMode: "time-asc",
                dayVisibility: "all"
            });
        },

        /**
         * Checks whether any parsed data is currently loaded.
         */
        hasData() {
            return this.years.length > 0 && this.rawEntries.length > 0;
        }
    };
})();
