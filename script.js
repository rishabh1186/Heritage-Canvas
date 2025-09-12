// This is a safety wrapper. It ensures that the JavaScript code runs only
// after all the HTML content has been loaded. This prevents "Cannot read...null" errors.
document.addEventListener('DOMContentLoaded', function() {

    // Initialize the map
    const map = L.map("map-container").setView([20.5937, 78.9629], 5);

    // Add the base tile layer
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors, © CARTO',
    }).addTo(map);

    // App state variables
    let culturalData = [];
    let markerGroup = L.layerGroup().addTo(map);
    let activeYear = 2025;
    let activeTheme = "all";

    // --- LOGIC FOR THE MENU BUTTON ---
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.querySelector('.menu-toggle');

    // This is the event listener that will now work correctly
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });
    // ------------------------------------

    // Function to fetch data from JSON
    async function fetchData() {
      try {
        const response = await fetch("data.json");
        culturalData = await response.json();
        filterAndDisplayMarkers(); 
      } catch (error) {
        console.error("Could not fetch data:", error);
      }
    }

    // Function to update the year label
    function updateYearLabel(year) {
      document.querySelector(".year-label").textContent = year;
    }

    // Function to filter and display markers
    function filterAndDisplayMarkers() {
      markerGroup.clearLayers();
      culturalData.forEach((item) => {
        const matchesTheme = activeTheme === "all" || item.category === activeTheme;
        const matchesYear = item.year <= activeYear;

        if (matchesTheme && matchesYear) {
          const marker = L.marker(item.coords); // Using default markers for now
          
          const popupContent = `
            <div style="width: 220px; font-family: 'Poppins', sans-serif;">
                ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}" style="width:100%; height:auto; border-radius: 8px; margin-bottom: 10px;">` : ''}
                <h4 style="margin:0 0 5px 0;">${item.name}</h4>
                <p style="margin:0; font-size: 14px;">${item.info}</p>
            </div>
          `;
          marker.bindPopup(popupContent);
          markerGroup.addLayer(marker);
        }
      });
    }

    // Event listener for theme filter buttons
    document.querySelectorAll(".filter-btn").forEach((button) => {
      button.addEventListener("click", () => {
        activeTheme = button.dataset.theme;
        document.querySelectorAll(".filter-btn").forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");
        filterAndDisplayMarkers();
      });
    });

    // Event listener for the timeline slider
    document.querySelector(".timeline-slider").addEventListener("input", (event) => {
        activeYear = event.target.value;
        updateYearLabel(activeYear);
        filterAndDisplayMarkers();
    });

    // Initial data fetch
    fetchData();

}); // End of the safety wrapper