document.addEventListener('DOMContentLoaded', () => {
  const map = L.map('map', { preferCanvas: true }).setView([20.5937,78.9629],5);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{
    maxZoom:18, attribution: '© OpenStreetMap contributors, © CARTO'
  }).addTo(map);

  // Move default zoom control to bottom right and style it
  map.zoomControl.setPosition('bottomright');

  // Add custom styles to zoom control buttons
  const zoomControlEl = document.querySelector('.leaflet-control-zoom');
  if (zoomControlEl) {
    zoomControlEl.style.borderRadius = '50%';
    zoomControlEl.style.overflow = 'hidden';
    zoomControlEl.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)';
    zoomControlEl.style.background = 'white';
  }

  const markerLayer = L.layerGroup().addTo(map);
  let sites = [];
  let activeTheme = 'all';
  let activeYear = 2025;

  const catColor = { monuments:'#e74c3c', arts:'#8e44ad', dance:'#f39c12', cuisine:'#27ae60', default:'#2c3e50' };

  function createMarker(item){
    // Use custom icon images for each category from filters folder
    const iconUrls = {
      monuments_and_architecture: 'filters/monuments_and_architecture.png',
      folk_arts_and_handcrafts: 'filters/folk_arts_and_handcrafts.png',
      music_and_dance: 'filters/music_and_dance.png',
      cuisine: 'filters/cuisine.png',
      festivals_and_traditions: 'filters/festivals_and_traditions.png',
      spiritual_and_pilgriange: 'filters/spiritual_and_pilgriange.png',
      nature_and_wildlife: 'filters/nature_and_wildlife.png',
      default: 'filters/monuments_and_architecture.png'
    };
    const iconUrl = iconUrls[item.category] || iconUrls.default;


    console.log('Using icon URL:', iconUrl);
    const customIcon = L.icon({
      iconUrl: iconUrl,
      iconSize: [32, 37], // adjusted size of the icon
      iconAnchor: [16, 37], // adjusted anchor point
      popupAnchor: [0, -28] // adjusted popup anchor
    });

    return L.marker(item.coords, { icon: customIcon });
  }

  function showMarkers(){
    markerLayer.clearLayers();
    (sites||[]).forEach(item=>{
      const matchesTheme = activeTheme === 'all' || item.category === activeTheme;
      const matchesYear = Number(item.year) <= Number(activeYear);
      if(matchesTheme && matchesYear){
        const m = createMarker(item);
        const content = `
          <div style="width:240px;font-family:'Poppins',sans-serif">
            ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}" style="width:100%;height:auto;border-radius:8px;margin-bottom:8px">` : ''}
            <h4 style="margin:0 0 6px 0">${item.name}</h4>
            <div style="font-size:13px;color:#333">${item.info}</div>
            <div style="margin-top:8px;font-size:12px;color:#666">Year: ${item.year}</div>
          </div>
        `;
        m.bindPopup(content, {minWidth:220});
        markerLayer.addLayer(m);
      }
    });
  }

  // fetch from data.json
  fetch('data.json', {cache:'no-cache'})
    .then(resp => {
      if(!resp.ok) throw new Error('data.json not found or failed to load');
      return resp.json();
    })
    .then(data => { 
      sites = data; 
      showMarkers(); 
      // Animate markers on load
      markerLayer.eachLayer(marker => {
        marker.setStyle({ radius: 0 });
        let radius = 0;
        const maxRadius = 8;
        const step = 0.5;
        const interval = setInterval(() => {
          radius += step;
          if (radius > maxRadius) {
            clearInterval(interval);
            radius = maxRadius;
          }
          marker.setRadius(radius);
        }, 20);
      });
    })
    .catch(err => console.error('Error loading data.json:', err));

  const hamburger = document.getElementById('hamburger');
  const sidebarEl = document.getElementById('sidebar');
  const yearRange = document.getElementById('yearRange');
  const yearLabel = document.getElementById('yearLabel');
  const zoomIn = document.getElementById('zoomIn');
  const zoomOut = document.getElementById('zoomOut');

  function updateMapMargin(){
    const expanded = sidebarEl.classList.contains('expanded');
    const leftMargin = expanded ? getComputedStyle(document.documentElement).getPropertyValue('--sidebar-expanded-width').trim() : getComputedStyle(document.documentElement).getPropertyValue('--sidebar-collapsed-width').trim();
    const pxVal = leftMargin.includes('px') ? leftMargin : leftMargin + 'px';
    document.getElementById('map').style.marginLeft = pxVal;
    setTimeout(()=>map.invalidateSize(), 260);
  }
  updateMapMargin();

  hamburger.addEventListener('click', () => {
    const willExpand = !sidebarEl.classList.contains('expanded');
    if(willExpand){ sidebarEl.classList.add('expanded'); hamburger.classList.add('open'); }
    else{ sidebarEl.classList.remove('expanded'); hamburger.classList.remove('open'); }
    updateMapMargin();
  });

  document.querySelectorAll('.filter-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      activeTheme = btn.dataset.theme;
      showMarkers();
    });
  });

  yearRange.addEventListener('input', e=>{
    activeYear = e.target.value;
    yearLabel.textContent = activeYear;
    showMarkers();
  });

  // Custom zoom buttons event listeners
  zoomIn.addEventListener('click', () => map.zoomIn());
  zoomOut.addEventListener('click', () => map.zoomOut());

  window.addEventListener('resize', () => { setTimeout(() => map.invalidateSize(), 200); });

  // Fix for map container size issue on load
  setTimeout(() => {
    map.invalidateSize();
  }, 500);
});