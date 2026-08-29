/**
 * Spotify Heatmap - Song History & Drilldown Component
 * Explores complete song lifecycle, stream timeline, platform usage, skip rates, and matching search queries.
 */

window.SpotifyHeatmap = window.SpotifyHeatmap || {};
window.SpotifyHeatmap.UI = window.SpotifyHeatmap.UI || {};

(function () {
    const { Utils, State, Parser, Analytics } = window.SpotifyHeatmap;

    window.SpotifyHeatmap.UI.SongHistory = {
        /**
         * Renders the complete song history panel based on current search input.
         */
        render(elements) {
            if (!State.searchTerm) {
                State.selectedSongKey = null;
                elements.songHistoryTitle.textContent = "Complete Song History";
                elements.songHistoryEmpty.classList.remove("hidden");
                elements.songHistoryContent.classList.add("hidden");
                elements.songHistoryEmpty.textContent = "Search a song or artist above to see its first listen, every play, duration, source, skips, platform, and matching search-query events.";
                return;
            }

            const matches = Array.from(State.songMap.values())
                .map(song => ({
                    ...song,
                    entries: song.entries.filter(Analytics.matchesSourceFilter.bind(Analytics))
                }))
                .filter(song => song.entries.length && Analytics.matchesSearch(song))
                .map(song => ({
                    ...song,
                    plays: song.entries.length,
                    totalMinutes: song.entries.reduce((sum, entry) => sum + entry.minutes, 0),
                    firstPlay: song.entries[0],
                    lastPlay: song.entries[song.entries.length - 1]
                }))
                .sort((a, b) => b.plays - a.plays || b.totalMinutes - a.totalMinutes || a.trackName.localeCompare(b.trackName));

            if (!matches.length) {
                State.selectedSongKey = null;
                elements.songHistoryTitle.textContent = "Complete Song History";
                elements.songHistoryEmpty.classList.remove("hidden");
                elements.songHistoryContent.classList.add("hidden");
                elements.songHistoryEmpty.textContent = "No matching song history for the current search and source filter.";
                return;
            }

            if (!State.selectedSongKey || !matches.some(song => song.songKey === State.selectedSongKey)) {
                State.selectedSongKey = matches[0].songKey;
            }

            const selected = matches.find(song => song.songKey === State.selectedSongKey);
            const matchingSearches = Analytics.getMatchingSearchEvents(selected);
            elements.songHistoryTitle.textContent = `${selected.trackName} - ${selected.artistName}`;
            elements.songHistoryEmpty.classList.add("hidden");
            elements.songHistoryContent.classList.remove("hidden");

            elements.songResults.innerHTML = "";
            matches.slice(0, 80).forEach(song => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = `song-result${song.songKey === State.selectedSongKey ? " active" : ""}`;
                button.innerHTML = `
                    <div class="song-title">${Utils.escapeHtml(song.trackName)}</div>
                    <div class="song-subtitle">${Utils.escapeHtml(song.artistName)} - ${song.plays} plays - ${Utils.formatDuration(song.totalMinutes * 60000)}</div>
                `;
                button.addEventListener("click", () => {
                    State.selectedSongKey = song.songKey;
                    this.render(elements);
                });
                elements.songResults.appendChild(button);
            });

            const first = selected.firstPlay;
            const last = selected.lastPlay;
            const skippedCount = selected.entries.filter(entry => entry.skipped).length;
            const sourceCounts = Utils.countBy(selected.entries, entry => Parser.getSourceLabel(entry.sourceCategory));
            const topSource = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0]?.join(" - ") || "Unknown";

            elements.songSummary.innerHTML = `
                <div class="song-summary-grid">
                    <div class="detail-pill"><strong>${Utils.formatDateTime(first.date)}</strong><span>First listened</span></div>
                    <div class="detail-pill"><strong>${Utils.formatDuration(first.msPlayed)}</strong><span>First play length</span></div>
                    <div class="detail-pill"><strong>${selected.plays}</strong><span>Total plays</span></div>
                    <div class="detail-pill"><strong>${Utils.formatDuration(selected.totalMinutes * 60000)}</strong><span>Total time</span></div>
                    <div class="detail-pill"><strong>${Utils.formatDateTime(last.date)}</strong><span>Last listened</span></div>
                    <div class="detail-pill"><strong>${skippedCount}</strong><span>Skipped plays</span></div>
                    <div class="detail-pill"><strong>${topSource}</strong><span>Top source</span></div>
                    <div class="detail-pill"><strong>${matchingSearches.length}</strong><span>Matching searches</span></div>
                </div>
            `;

            elements.songTimeline.innerHTML = "";
            selected.entries.forEach((entry, index) => {
                const row = document.createElement("div");
                row.className = "timeline-row";
                row.innerHTML = `
                    <div class="timeline-topline">
                        <span>#${index + 1} - ${Utils.formatDateTime(entry.date)}</span>
                        <span>${Utils.formatDuration(entry.msPlayed)}</span>
                    </div>
                    <div class="timeline-meta">${Utils.escapeHtml(entry.albumName || "Unknown album")} - ${Utils.escapeHtml(entry.platform || "Unknown platform")}</div>
                    <div class="timeline-chips">
                        <span class="source-chip">${Utils.escapeHtml(Parser.getSourceLabel(entry.sourceCategory))}</span>
                        <span class="source-chip">Started: ${Utils.escapeHtml(entry.reasonStart || "unknown")}</span>
                        <span class="source-chip">Ended: ${Utils.escapeHtml(entry.reasonEnd || "unknown")}</span>
                        <span class="source-chip">${entry.shuffle ? "Shuffle on" : "Shuffle off/unknown"}</span>
                        <span class="source-chip">${entry.skipped ? "Skipped" : "Not marked skipped"}</span>
                        <span class="source-chip">${entry.offline ? "Offline" : "Online/unknown"}</span>
                    </div>
                    <div class="timeline-notes">From ${Utils.escapeHtml(entry.fileName)}${entry.uri ? ` - ${Utils.escapeHtml(entry.uri)}` : ""}</div>
                `;
                elements.songTimeline.appendChild(row);
            });

            if (matchingSearches.length) {
                const searchHeader = document.createElement("div");
                searchHeader.className = "timeline-row";
                searchHeader.innerHTML = `<div class="timeline-topline"><span>Matching Search Queries</span><span>${matchingSearches.length}</span></div>`;
                elements.songTimeline.appendChild(searchHeader);

                matchingSearches.slice(0, 50).forEach(search => {
                    const row = document.createElement("div");
                    row.className = "timeline-row";
                    row.innerHTML = `
                        <div class="timeline-topline">
                            <span>${Utils.formatDateTime(search.date)}</span>
                            <span>Search</span>
                        </div>
                        <div class="timeline-meta">${Utils.escapeHtml(search.query)} - ${Utils.escapeHtml(search.platform || "Unknown platform")}</div>
                        <div class="timeline-notes">From ${Utils.escapeHtml(search.fileName)}</div>
                    `;
                    elements.songTimeline.appendChild(row);
                });
            }
        }
    };
})();
