/**
 * Spotify Heatmap - Heatmap Component
 * Renders the 52-week contribution grid, weekday axes, month labels, and intensity legend.
 */

window.SpotifyHeatmap = window.SpotifyHeatmap || {};
window.SpotifyHeatmap.UI = window.SpotifyHeatmap.UI || {};

(function () {
    const { Constants, Utils, State, Analytics } = window.SpotifyHeatmap;

    window.SpotifyHeatmap.UI.Heatmap = {
        /**
         * Renders the full calendar heatmap for the currently selected year.
         */
        render(elements, onDaySelect) {
            const year = State.selectedYear;
            const allDays = Analytics.buildCalendarDays(year);
            const visibleDays = Analytics.getFilteredDaysForYear({ includeMonthFilter: true });
            const visibleMap = new Map(visibleDays.map(day => [day.dateKey, day]));
            const activeDays = visibleDays.filter(day => day.totalMinutes > 0);
            const maxMinutes = activeDays.reduce((max, day) => Math.max(max, day.totalMinutes), 0);

            elements.monthLabels.innerHTML = "";
            elements.heatmapGrid.innerHTML = "";

            this.buildMonthLabels(elements, allDays);

            allDays.forEach(dayMeta => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "day-cell";

                if (!dayMeta.inYear) {
                    button.classList.add("empty");
                    button.disabled = true;
                    elements.heatmapGrid.appendChild(button);
                    return;
                }

                const day = visibleMap.get(dayMeta.dateKey) || Analytics.createEmptyDay(dayMeta.date);
                const visible = State.dayVisibility === "all" || day.totalMinutes > 0;
                const level = visible ? Analytics.getHeatLevel(day.totalMinutes, maxMinutes) : 0;

                button.style.background = visible ? Constants.COLORS.heatmap[level] : "transparent";
                button.style.opacity = visible ? "1" : "0.22";
                button.title = `${Utils.formatLongDate(day.date)}: ${Math.round(day.totalMinutes)} minutes`;
                button.setAttribute("aria-label", button.title);

                if (day.dateKey === State.selectedDateKey) {
                    button.classList.add("selected");
                }

                button.addEventListener("click", () => {
                    State.selectedDateKey = day.dateKey;
                    this.render(elements, onDaySelect);
                    if (onDaySelect) {
                        onDaySelect(day.dateKey);
                    }
                });

                elements.heatmapGrid.appendChild(button);
            });
        },

        /**
         * Aligns month abbreviation headers to corresponding calendar week columns.
         */
        buildMonthLabels(elements, calendarDays) {
            const starts = [];
            let lastMonth = null;

            calendarDays.forEach((day, index) => {
                if (day.inYear && day.date.getUTCMonth() !== lastMonth) {
                    starts.push({ month: day.date.getUTCMonth(), index });
                    lastMonth = day.date.getUTCMonth();
                }
            });

            const weekCount = Math.ceil(calendarDays.length / 7);
            for (let week = 0; week < weekCount; week += 1) {
                const label = document.createElement("span");
                const monthStart = starts.find(item => Math.floor(item.index / 7) === week);
                label.textContent = monthStart ? Constants.MONTH_NAMES[monthStart.month] : "";
                elements.monthLabels.appendChild(label);
            }
        },

        /**
         * Renders static weekday indicators on the left of the heatmap grid.
         */
        renderWeekdayLabels(elements) {
            elements.weekdayLabels.innerHTML = "";
            Constants.WEEKDAY_LABELS.forEach(label => {
                const span = document.createElement("span");
                span.textContent = label;
                elements.weekdayLabels.appendChild(span);
            });
        },

        /**
         * Renders the color swatch legend for listening intensity.
         */
        renderLegend(elements) {
            elements.legend.innerHTML = "";
            const less = document.createElement("span");
            less.textContent = "Less";
            elements.legend.appendChild(less);

            Constants.COLORS.heatmap.forEach(color => {
                const swatch = document.createElement("span");
                swatch.className = "legend-swatch";
                swatch.style.background = color;
                elements.legend.appendChild(swatch);
            });

            const more = document.createElement("span");
            more.textContent = "More";
            elements.legend.appendChild(more);
        }
    };
})();
