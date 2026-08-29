/**
 * Spotify Heatmap - Data Ingestion & Normalization Engine
 * Handles JSON streaming history parsing, search event extraction, source classification, and deduplication.
 */

window.SpotifyHeatmap = window.SpotifyHeatmap || {};

(function () {
    const { Utils, State } = window.SpotifyHeatmap;

    window.SpotifyHeatmap.Parser = {
        /**
         * Asynchronously reads a File object as JSON.
         */
        readJsonFile(file) {
            return new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = event => {
                    try {
                        const payload = JSON.parse(event.target.result);
                        resolve({ name: file.name, payload });
                    } catch (error) {
                        alert(`Could not parse ${file.name}: ${error.message}`);
                        resolve(null);
                    }
                };
                reader.onerror = () => {
                    alert(`Could not read ${file.name}.`);
                    resolve(null);
                };
                reader.readAsText(file);
            });
        },

        /**
         * Deduplicates files by name and sorts them alphabetically.
         */
        dedupeFiles(files) {
            const byName = new Map();
            files.forEach(file => byName.set(file.name, file));
            return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
        },

        /**
         * Normalizes raw Spotify JSON play items from both Extended and Basic histories.
         */
        normalizePlayEntry(item, fileName) {
            const rawTimestamp = item.ts || item.endTime;
            const rawMsPlayed = typeof item.ms_played === "number" ? item.ms_played : item.msPlayed;
            if (!rawTimestamp || typeof rawMsPlayed !== "number") {
                return null;
            }

            const date = Utils.parseSpotifyDate(rawTimestamp);
            if (!date) {
                return null;
            }

            const trackName = item.master_metadata_track_name || item.trackName || item.episode_name || item.audiobook_title || "Unknown title";
            const artistName = item.master_metadata_album_artist_name || item.artistName || item.episode_show_name || "Unknown artist";
            const albumName = item.master_metadata_album_album_name || "";
            const reasonStart = item.reason_start || "";
            const reasonEnd = item.reason_end || "";
            const uri = item.spotify_track_uri || item.spotify_episode_uri || item.audiobook_uri || "";

            return {
                date,
                dateKey: Utils.toDateKey(date),
                year: date.getUTCFullYear(),
                month: date.getUTCMonth(),
                msPlayed: rawMsPlayed,
                minutes: rawMsPlayed / 60000,
                fileName,
                trackName,
                artistName,
                albumName,
                songKey: this.makeSongKey(trackName, artistName, uri),
                uri,
                platform: item.platform || "",
                country: item.conn_country || "",
                reasonStart,
                reasonEnd,
                sourceCategory: this.classifySource(reasonStart),
                shuffle: item.shuffle === true,
                skipped: item.skipped === true,
                offline: item.offline === true,
                incognito: item.incognito_mode === true
            };
        },

        /**
         * Parses and normalizes search query events from SearchQueries.json or search logs.
         */
        normalizeSearchEvent(item, fileName) {
            if (!item || !item.searchTime || typeof item.searchQuery !== "string") {
                return null;
            }

            const date = Utils.parseSpotifyDate(item.searchTime);
            if (!date) {
                return null;
            }

            return {
                date,
                query: item.searchQuery,
                platform: item.platform || "",
                interactionUris: Array.isArray(item.searchInteractionURIs) ? item.searchInteractionURIs : [],
                fileName
            };
        },

        /**
         * Generates a unique key for grouping song records. Prefers Spotify URI when present.
         */
        makeSongKey(trackName, artistName, uri) {
            if (uri) {
                return uri;
            }
            return `${Utils.normalizeText(trackName)}__${Utils.normalizeText(artistName)}`;
        },

        /**
         * Maps Spotify reason_start signals to human-friendly source categories.
         */
        classifySource(reasonStart) {
            const value = String(reasonStart || "").toLowerCase();
            if (["clickrow", "search"].includes(value) || value.includes("search")) {
                return "searched";
            }
            if (["trackdone", "playbtn", "backbtn"].includes(value)) {
                return "playlist";
            }
            if (["fwdbtn", "remote", "popup", "clickside"].includes(value)) {
                return "manual";
            }
            if (["appload", "login"].includes(value)) {
                return "app";
            }
            return "unknown";
        },

        /**
         * Translates source category codes into readable descriptive labels.
         */
        getSourceLabel(category) {
            switch (category) {
                case "searched":
                    return "Searched / clicked";
                case "playlist":
                    return "Playlist / autoplay";
                case "manual":
                    return "Manual control";
                case "app":
                    return "App opened / resumed";
                case "unknown":
                default:
                    return "Unknown source";
            }
        },

        /**
         * Rebuilds all maps, arrays, and aggregations from loaded files.
         */
        rebuildDataset() {
            State.rawEntries = [];
            State.searchEvents = [];
            State.dayMap = new Map();
            State.songMap = new Map();

            State.files.forEach(file => {
                const rows = Array.isArray(file.payload) ? file.payload : [];
                rows.forEach(item => {
                    const searchEvent = this.normalizeSearchEvent(item, file.name);
                    if (searchEvent) {
                        State.searchEvents.push(searchEvent);
                        return;
                    }

                    const entry = this.normalizePlayEntry(item, file.name);
                    if (!entry) {
                        return;
                    }

                    State.rawEntries.push(entry);

                    if (!State.dayMap.has(entry.dateKey)) {
                        State.dayMap.set(entry.dateKey, {
                            date: entry.date,
                            dateKey: entry.dateKey,
                            year: entry.year,
                            month: entry.month,
                            totalMinutes: 0,
                            playCount: 0,
                            tracks: new Map(),
                            files: new Set()
                        });
                    }

                    const day = State.dayMap.get(entry.dateKey);
                    day.totalMinutes += entry.minutes;
                    day.playCount += 1;
                    day.files.add(entry.fileName);

                    if (!day.tracks.has(entry.songKey)) {
                        day.tracks.set(entry.songKey, {
                            trackName: entry.trackName,
                            artistName: entry.artistName,
                            albumName: entry.albumName,
                            songKey: entry.songKey,
                            minutes: 0,
                            plays: 0,
                            entries: []
                        });
                    }

                    const track = day.tracks.get(entry.songKey);
                    track.minutes += entry.minutes;
                    track.plays += 1;
                    track.entries.push(entry);

                    if (!State.songMap.has(entry.songKey)) {
                        State.songMap.set(entry.songKey, {
                            songKey: entry.songKey,
                            trackName: entry.trackName,
                            artistName: entry.artistName,
                            albumName: entry.albumName,
                            entries: [],
                            totalMinutes: 0,
                            plays: 0
                        });
                    }

                    const song = State.songMap.get(entry.songKey);
                    song.entries.push(entry);
                    song.totalMinutes += entry.minutes;
                    song.plays += 1;
                });
            });

            State.rawEntries.sort((a, b) => a.date - b.date);
            State.searchEvents.sort((a, b) => a.date - b.date);
            State.songMap.forEach(song => song.entries.sort((a, b) => a.date - b.date));

            State.years = Array.from(new Set(State.rawEntries.map(entry => entry.year))).sort((a, b) => a - b);
            if (!State.years.includes(State.selectedYear)) {
                State.selectedYear = State.years[0] ?? null;
            }
            if (State.selectedDateKey && !State.dayMap.has(State.selectedDateKey)) {
                State.selectedDateKey = null;
            }
            if (State.selectedSongKey && !State.songMap.has(State.selectedSongKey)) {
                State.selectedSongKey = null;
            }
        }
    };
})();
