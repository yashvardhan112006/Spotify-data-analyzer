/**
 * Spotify Heatmap - Analytics & Calculation Engine
 * Aggregations, calendar generation, heat level quantization, and search/sort filtering.
 */

window.SpotifyHeatmap = window.SpotifyHeatmap || {};

(function () {
    const { Utils, State } = window.SpotifyHeatmap;

    window.SpotifyHeatmap.Analytics = {
        /**
         * Creates an empty day structure with zero counts for unplayed calendar dates.
         */
        createEmptyDay(date) {
            return {
                date,
                dateKey: Utils.toDateKey(date),
                year: date.getUTCFullYear(),
                month: date.getUTCMonth(),
                totalMinutes: 0,
                playCount: 0,
                tracks: new Map(),
                files: new Set()
            };
        },

        /**
         * Builds a full 52-week calendar grid of dates for the selected year (including padding days).
         */
        buildCalendarDays(year) {
            const firstDay = new Date(Date.UTC(year, 0, 1));
            const lastDay = new Date(Date.UTC(year, 11, 31));
            const gridStart = new Date(firstDay);
            gridStart.setUTCDate(firstDay.getUTCDate() - firstDay.getUTCDay());

            const gridEnd = new Date(lastDay);
            gridEnd.setUTCDate(lastDay.getUTCDate() + (6 - lastDay.getUTCDay()));

            const days = [];
            const cursor = new Date(gridStart);

            while (cursor <= gridEnd) {
                days.push({
                    date: new Date(cursor),
                    dateKey: Utils.toDateKey(cursor),
                    inYear: cursor.getUTCFullYear() === year
                });
                cursor.setUTCDate(cursor.getUTCDate() + 1);
            }

            return days;
        },

        /**
         * Computes GitHub-style contribution heat level (0 to 4) based on listening minutes.
         */
        getHeatLevel(value, maxValue) {
            if (!value || !maxValue) {
                return 0;
            }
            const ratio = value / maxValue;
            if (ratio <= 0.25) {
                return 1;
            }
            if (ratio <= 0.5) {
                return 2;
            }
            if (ratio <= 0.75) {
                return 3;
            }
            return 4;
        },

        /**
         * Returns aggregated days for a given year applying current source filters.
         */
        getDaysByYear(year) {
            const daySummaries = new Map();

            State.rawEntries
                .filter(entry => entry.year === year && this.matchesSourceFilter(entry))
                .forEach(entry => {
                    if (!daySummaries.has(entry.dateKey)) {
                        daySummaries.set(entry.dateKey, this.createEmptyDay(entry.date));
                    }

                    const day = daySummaries.get(entry.dateKey);
                    day.totalMinutes += entry.minutes;
                    day.playCount += 1;
                    day.files.add(entry.fileName);

                    if (!day.tracks.has(entry.songKey)) {
                        day.tracks.set(entry.songKey, {
                            songKey: entry.songKey,
                            trackName: entry.trackName,
                            artistName: entry.artistName,
                            albumName: entry.albumName,
                            minutes: 0,
                            plays: 0,
                            entries: []
                        });
                    }

                    const track = day.tracks.get(entry.songKey);
                    track.minutes += entry.minutes;
                    track.plays += 1;
                    track.entries.push(entry);
                });

            return Array.from(daySummaries.values()).sort((a, b) => a.date - b.date);
        },

        /**
         * Retrieves a single day for the currently selected year.
         */
        getFilteredDay(dateKey) {
            return this.getDaysByYear(State.selectedYear).find(day => day.dateKey === dateKey) || null;
        },

        /**
         * Retrieves all days for the currently selected year with optional month filtering.
         */
        getFilteredDaysForYear({ includeMonthFilter }) {
            return this.getDaysByYear(State.selectedYear).filter(day => {
                if (!includeMonthFilter) {
                    return true;
                }
                return State.monthFilter === "all" || `${day.month}` === State.monthFilter;
            });
        },

        /**
         * Finds the first active day (or latest active day) to select by default.
         */
        getFirstInterestingDateKey() {
            const visibleDays = this.getFilteredDaysForYear({ includeMonthFilter: true }).filter(day => day.totalMinutes > 0);
            if (visibleDays.length) {
                return visibleDays[visibleDays.length - 1].dateKey;
            }
            const allYearDays = this.getDaysByYear(State.selectedYear);
            return allYearDays[0]?.dateKey ?? null;
        },

        /**
         * Checks whether a specific date key satisfies currently active filters.
         */
        isDateKeyVisible(dateKey) {
            const day = this.getFilteredDay(dateKey);
            if (!day || day.year !== State.selectedYear) {
                return false;
            }
            if (State.monthFilter !== "all" && `${day.month}` !== State.monthFilter) {
                return false;
            }
            if (State.dayVisibility === "active" && day.totalMinutes <= 0) {
                return false;
            }
            return true;
        },

        /**
         * Checks whether a track record matches the search query.
         */
        matchesSearch(track) {
            if (!State.searchTerm) {
                return true;
            }
            const haystack = `${track.trackName} ${track.artistName} ${track.albumName}`.toLowerCase();
            return haystack.includes(State.searchTerm);
        },

        /**
         * Checks whether an entry matches the active source filter.
         */
        matchesSourceFilter(entry) {
            return State.sourceFilter === "all" || entry.sourceCategory === State.sourceFilter;
        },

        /**
         * Finds search query events that relate to a specific song or artist.
         */
        getMatchingSearchEvents(song) {
            const track = Utils.normalizeText(song.trackName);
            const artist = Utils.normalizeText(song.artistName);
            const uri = song.entries.find(entry => entry.uri)?.uri;

            return State.searchEvents.filter(event => {
                const query = Utils.normalizeText(event.query);
                const uriMatch = uri && event.interactionUris.includes(uri);
                return uriMatch || (query && (track.includes(query) || query.includes(track) || artist.includes(query)));
            });
        },

        /**
         * Sorts tracks by duration, play count, or alphabetical title.
         */
        sortTracks(a, b) {
            switch (State.sortMode) {
                case "minutes-asc":
                    return a.minutes - b.minutes;
                case "plays-desc":
                    return b.plays - a.plays || b.minutes - a.minutes;
                case "plays-asc":
                    return a.plays - b.plays || a.minutes - b.minutes;
                case "track-asc":
                    return a.trackName.localeCompare(b.trackName);
                case "minutes-desc":
                default:
                    return b.minutes - a.minutes || b.plays - a.plays;
            }
        },

        /**
         * Sorts individual day entries by time of day, play duration, or title.
         */
        sortDayEntries(a, b) {
            switch (State.sortMode) {
                case "time-asc":
                    return Utils.getLocalTimeOfDay(a.date) - Utils.getLocalTimeOfDay(b.date) || a.date - b.date;
                case "minutes-asc":
                    return a.msPlayed - b.msPlayed || a.date - b.date;
                case "minutes-desc":
                    return b.msPlayed - a.msPlayed || a.date - b.date;
                case "track-asc":
                    return a.trackName.localeCompare(b.trackName) || a.date - b.date;
                default:
                    return Utils.getLocalTimeOfDay(a.date) - Utils.getLocalTimeOfDay(b.date) || a.date - b.date;
            }
        }
    };
})();
