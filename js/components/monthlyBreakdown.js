/**
 * Spotify Heatmap - Monthly Breakdown & Source Manifest Component
 * Renders monthly listening volume distribution bars and imported file badges.
 */

window.SpotifyHeatmap = window.SpotifyHeatmap || {};
window.SpotifyHeatmap.UI = window.SpotifyHeatmap.UI || {};

(function () {
    const { Constants, State, Analytics } = window.SpotifyHeatmap;

    window.SpotifyHeatmap.UI.MonthlyBreakdown = {
        /**
         * Renders the 12-month listening distribution bar chart for the selected year.
         */
        render(elements) {
            const year = State.selectedYear;
            const monthTotals = Array.from({ length: 12 }, (_, month) => {
                const total = Analytics.getDaysByYear(year)
                    .filter(day => day.month === month)
                    .reduce((sum, day) => sum + day.totalMinutes, 0);
                return { month, total };
            });

            const maxTotal = monthTotals.reduce((max, item) => Math.max(max, item.total), 0);
            elements.monthlyBars.innerHTML = "";
            elements.breakdownTitle.textContent = `Listening Minutes - ${year}`;

            monthTotals.forEach(item => {
                const wrap = document.createElement("div");
                wrap.className = "month-bar-wrap";

                const value = document.createElement("div");
                value.className = "month-bar-value";
                value.textContent = item.total ? `${Math.round(item.total)}m` : "0";

                const bar = document.createElement("div");
                bar.className = "month-bar";
                bar.style.height = maxTotal ? `${Math.max(4, (item.total / maxTotal) * 160)}px` : "4px";

                const label = document.createElement("div");
                label.className = "month-bar-label";
                label.textContent = Constants.MONTH_NAMES[item.month];

                wrap.append(value, bar, label);
                elements.monthlyBars.appendChild(wrap);
            });
        },

        /**
         * Renders badge chips for all merged JSON history files currently loaded.
         */
        renderFileList(elements) {
            elements.fileList.innerHTML = "";
            State.files.forEach(file => {
                const chip = document.createElement("div");
                chip.className = "file-chip";
                chip.textContent = file.name;
                elements.fileList.appendChild(chip);
            });
        }
    };
})();
