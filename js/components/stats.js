/**
 * Spotify Heatmap - Metrics & Header Controls Component
 * Renders summary metrics (Total Hours, Active Days, Peak Day), year tabs, and month selectors.
 */

window.SpotifyHeatmap = window.SpotifyHeatmap || {};
window.SpotifyHeatmap.UI = window.SpotifyHeatmap.UI || {};

(function () {
    const { Constants, Utils, State, Analytics } = window.SpotifyHeatmap;

    window.SpotifyHeatmap.UI.Stats = {
        /**
         * Renders the top year selection tabs and date range label.
         */
        renderTopBar(elements, onYearSelect) {
            const minYear = State.years[0];
            const maxYear = State.years[State.years.length - 1];
            const totalYears = State.years.length;
            elements.rangeLabel.textContent = `${minYear} - ${maxYear} - ${totalYears} year${totalYears === 1 ? "" : "s"}`;

            elements.yearTabs.innerHTML = "";
            State.years.forEach(year => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = `year-tab${year === State.selectedYear ? " active" : ""}`;
                button.textContent = year;
                button.addEventListener("click", () => {
                    State.selectedYear = year;
                    State.selectedDateKey = null;
                    if (onYearSelect) {
                        onYearSelect(year);
                    }
                });
                elements.yearTabs.appendChild(button);
            });
        },

        /**
         * Computes and renders high-level KPI cards for the filtered dataset.
         */
        renderStats(elements) {
            const days = Analytics.getFilteredDaysForYear({ includeMonthFilter: true });
            const totalMinutes = days.reduce((sum, day) => sum + day.totalMinutes, 0);
            const activeDays = days.filter(day => day.totalMinutes > 0).length;
            const peakDay = days.reduce((best, day) => (!best || day.totalMinutes > best.totalMinutes ? day : best), null);

            const stats = [
                { label: "Total Hours", value: Utils.formatHours(totalMinutes) },
                { label: "Active Days", value: `${activeDays}` },
                { label: "Peak Day", value: peakDay ? `${Math.round(peakDay.totalMinutes)}m` : "0m" }
            ];

            elements.stats.innerHTML = "";
            stats.forEach(stat => {
                const card = document.createElement("div");
                card.className = "stat-card";
                card.innerHTML = `<div class="stat-value">${stat.value}</div><div class="stat-label">${stat.label}</div>`;
                elements.stats.appendChild(card);
            });
        },

        /**
         * Populates the month dropdown filter with all months while preserving current selection.
         */
        renderMonthFilter(elements) {
            const previous = State.monthFilter;
            elements.monthFilter.innerHTML = "";

            const allOption = document.createElement("option");
            allOption.value = "all";
            allOption.textContent = "All months";
            elements.monthFilter.appendChild(allOption);

            Constants.MONTH_NAMES.forEach((month, index) => {
                const option = document.createElement("option");
                option.value = `${index}`;
                option.textContent = month;
                elements.monthFilter.appendChild(option);
            });

            State.monthFilter = previous;
            elements.monthFilter.value = previous;
        }
    };
})();
