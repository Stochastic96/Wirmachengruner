/**
 * Common utilities for all pages
 */

document.addEventListener('DOMContentLoaded', () => {
  // Mark active nav link
  const currentPath = window.location.pathname;
  document.querySelectorAll('.sidebar nav a').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });

  // Initialize stats and CO2 badge on every page
  updateCO2Badge();
});

async function updateCO2Badge() {
  try {
    const response = await fetch('/api/stats');
    if (response.ok) {
      const stats = await response.json();
      const badge = document.getElementById('co2-badge-text');
      if (badge) {
        badge.textContent = '🌍 ' + stats.total_co2.toFixed(1) + ' kg CO2';
      }
    }
  } catch (e) {
    console.log('Could not update CO2 badge');
  }
}

// Update CO2 badge every minute
setInterval(updateCO2Badge, 60000);
