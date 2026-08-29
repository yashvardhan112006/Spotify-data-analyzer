/**
 * Spotify Heatmap - Application Coordinator
 * Handles DOM bootstrapping, drag-and-drop file upload, filter interactions, and UI updates.
 */

window.SpotifyHeatmap = window.SpotifyHeatmap || {};

(function () {
    const { State, Parser, Analytics, UI } = window.SpotifyHeatmap;

    let elements = {};

    function initElements() {
        elements = {
            dropZone: document.getElementById("drop-zone"),
            fileInput: document.getElementById("file-input"),
            selectFilesBtn: document.getElementById("select-files-btn"),
            dashboard: document.getElementById("dashboard"),
            rangeLabel: document.getElementById("range-label"),
            yearTabs: document.getElementById("year-tabs"),
            stats: document.getElementById("stats"),
            monthFilter: document.getElementById("month-filter"),
            sortSelect: document.getElementById("sort-select"),
            sourceFilter: document.getElementById("source-filter"),
            dayVisibility: document.getElementById("day-visibility"),
            searchInput: document.getElementById("search-input"),
            heatmapGrid: document.getElementById("heatmap-grid"),
            monthLabels: document.getElementById("month-labels"),
            weekdayLabels: document.getElementById("weekday-labels"),
            legend: document.getElementById("legend"),
            detailTitle: document.getElementById("detail-title"),
            detailSummary: document.getElementById("detail-summary"),
            detailList: document.getElementById("detail-list"),
            songHistoryTitle: document.getElementById("song-history-title"),
            songHistoryEmpty: document.getElementById("song-history-empty"),
            songHistoryContent: document.getElementById("song-history-content"),
            songResults: document.getElementById("song-results"),
            songSummary: document.getElementById("song-summary"),
            songTimeline: document.getElementById("song-timeline"),
            monthlyBars: document.getElementById("monthly-bars"),
            breakdownTitle: document.getElementById("breakdown-title"),
            fileList: document.getElementById("file-list")
        };
    }

    function bindEvents() {
        elements.selectFilesBtn.addEventListener("click", () => elements.fileInput.click());
        elements.fileInput.addEventListener("change", event => handleFiles(event.target.files));

        ["dragenter", "dragover"].forEach(eventName => {
            elements.dropZone.addEventListener(eventName, event => {
                event.preventDefault();
                elements.dropZone.classList.add("dragover");
            });
        });

        ["dragleave", "dragend"].forEach(eventName => {
            elements.dropZone.addEventListener(eventName, () => {
                elements.dropZone.classList.remove("dragover");
            });
        });

        elements.dropZone.addEventListener("drop", event => {
            event.preventDefault();
            elements.dropZone.classList.remove("dragover");
            handleFiles(event.dataTransfer.files);
        });

        elements.dropZone.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                elements.fileInput.click();
            }
        });

        elements.monthFilter.addEventListener("change", event => {
            State.monthFilter = event.target.value;
            refreshDashboard();
        });

        elements.sortSelect.addEventListener("change", event => {
            State.sortMode = event.target.value;
            UI.DayDetail.render(elements);
        });

        elements.sourceFilter.addEventListener("change", event => {
            State.sourceFilter = event.target.value;
            refreshDashboard();
        });

        elements.dayVisibility.addEventListener("change", event => {
            State.dayVisibility = event.target.value;
            refreshDashboard();
        });

        elements.searchInput.addEventListener("input", event => {
            State.searchTerm = event.target.value.trim().toLowerCase();
            UI.DayDetail.render(elements);
            UI.SongHistory.render(elements);
        });
    }

    async function handleFiles(fileList) {
        const files = Array.from(fileList).filter(file => file.name.toLowerCase().endsWith(".json"));
        if (!files.length) {
            return;
        }

        const parsedFiles = await Promise.all(files.map(file => Parser.readJsonFile(file)));
        const validFiles = parsedFiles.filter(Boolean);
        if (!validFiles.length) {
            alert("No valid Spotify streaming history JSON files were loaded.");
            return;
        }

        State.files = Parser.dedupeFiles([...State.files, ...validFiles]);
        Parser.rebuildDataset();
        refreshDashboard(true);
    }

    function refreshDashboard(selectBestDay = false) {
        const hasData = State.years.length > 0;
        elements.dashboard.classList.toggle("hidden", !hasData);
        if (!hasData) {
            return;
        }

        UI.Stats.renderTopBar(elements, () => {
            refreshDashboard(true);
        });
        UI.Stats.renderMonthFilter(elements);
        UI.Stats.renderStats(elements);
        UI.Heatmap.render(elements, () => {
            UI.DayDetail.render(elements);
        });
        UI.MonthlyBreakdown.render(elements);
        UI.MonthlyBreakdown.renderFileList(elements);
        UI.SongHistory.render(elements);

        if (selectBestDay) {
            State.selectedDateKey = Analytics.getFirstInterestingDateKey();
        }

        if (!State.selectedDateKey || !Analytics.isDateKeyVisible(State.selectedDateKey)) {
            State.selectedDateKey = Analytics.getFirstInterestingDateKey();
        }

        UI.DayDetail.render(elements);
    }

    function initialize() {
        initElements();
        UI.Heatmap.renderWeekdayLabels(elements);
        UI.Heatmap.renderLegend(elements);
        UI.Stats.renderMonthFilter(elements);
        bindEvents();
    }

    // Auto-bootstrap once DOM content is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initialize);
    } else {
        initialize();
    }

    window.SpotifyHeatmap.App = {
        refreshDashboard,
        handleFiles
    };
})();
