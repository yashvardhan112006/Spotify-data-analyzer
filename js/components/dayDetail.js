/**
 * Spotify Heatmap - Day Detail Inspector Component
 * Renders daily listening breakdowns, stream counts, track lists, and source transitions.
 */

window.SpotifyHeatmap = window.SpotifyHeatmap || {};
window.SpotifyHeatmap.UI = window.SpotifyHeatmap.UI || {};

(function () {
    const { Utils, State, Parser, Analytics } = window.SpotifyHeatmap;

    window.SpotifyHeatmap.UI.DayDetail = {
        /**
         * Renders the details for the currently active/selected day.
         */
        render(elements) {
            const selectedDay = State.selectedDateKey
                ? Analytics.getFilteredDay(State.selectedDateKey) || Analytics.createEmptyDay(new Date(State.selectedDateKey))
                : null;

            if (!selectedDay) {
                elements.detailTitle.textContent = "Select a day";
                elements.detailSummary.className = "detail-summary empty-state";
                elements.detailSummary.textContent = "Click any heatmap square to inspect tracks, artists, minutes, and source files.";
                elements.detailList.innerHTML = "";
                return;
            }

            elements.detailTitle.textContent = Utils.formatLongDate(selectedDay.date);
            elements.detailSummary.className = "detail-summary";
            elements.detailSummary.innerHTML = `
                <div class="detail-grid">
                    <div class="detail-pill"><strong>${Math.round(selectedDay.totalMinutes)}m</strong><span>Listening Time</span></div>
                    <div class="detail-pill"><strong>${selectedDay.playCount}</strong><span>Streams</span></div>
                    <div class="detail-pill"><strong>${selectedDay.tracks.size}</strong><span>Unique Tracks</span></div>
                    <div class="detail-pill"><strong>${selectedDay.files.size}</strong><span>Source Files</span></div>
                </div>
            `;

            const rows = Array.from(selectedDay.tracks.values())
                .flatMap(track => track.entries)
                .filter(entry => Analytics.matchesSearch(entry))
                .sort(Analytics.sortDayEntries.bind(Analytics));

            if (!rows.length) {
                elements.detailList.innerHTML = `<div class="empty-state">No tracks match the current search filter for this day.</div>`;
                return;
            }

            elements.detailList.innerHTML = "";
            rows.forEach(entry => {
                const row = document.createElement("div");
                row.className = "track-row";
                row.innerHTML = `
                    <div class="track-meta">
                        <div class="track-name">${Utils.formatTime(entry.date)} - ${Utils.escapeHtml(entry.trackName)}</div>
                        <div class="track-artist">${Utils.escapeHtml(entry.artistName)}${entry.albumName ? ` - ${Utils.escapeHtml(entry.albumName)}` : ""}</div>
                        <div class="track-artist">${Utils.escapeHtml(Parser.getSourceLabel(entry.sourceCategory))} - ${Utils.escapeHtml(entry.reasonStart || "unknown")} to ${Utils.escapeHtml(entry.reasonEnd || "unknown")}</div>
                    </div>
                    <div class="track-chip">${Utils.formatDuration(entry.msPlayed)}</div>
                    <div class="track-chip">${entry.skipped ? "skipped" : "played"}</div>
                `;
                elements.detailList.appendChild(row);
            });
        }
    };
})();
