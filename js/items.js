const ITEMS = [
  {
    id: 'big-drums',
    name: 'Big Drums',
    desc: 'Replaced heavy-duty oversized cable drums for high-cycle spring systems. Engineered for maximum durability and even cable distribution on larger door setups.',
  },
  {
    id: 'small-drums',
    name: 'Small Drums',
    desc: 'Replaced standard residential cable drums for smooth, balanced lifting. Precision-wound to eliminate cable slack and extend the life of your springs.',
  },
  {
    id: 'warranty',
    name: '1 Year Warranty for Labor',
    desc: 'All work performed today is backed by a full 12-month labor warranty. Any issue related to our service will be corrected at no additional charge.',
  },
  {
    id: 'cables',
    name: 'Cables',
    desc: 'Replaced galvanized steel lift cables with high-tensile construction rated to handle your door\'s full weight across thousands of cycles without stretching or fraying.',
  },
  {
    id: 'rollers',
    name: 'Rollers',
    desc: 'Installed 13-ball nylon rollers for quiet, smooth door travel. Significantly reduces noise and friction on every cycle.',
  },
  {
    id: 'premium-rollers',
    name: 'Premium Rollers',
    desc: 'Upgraded to sealed ball-bearing nylon rollers rated for 100,000+ cycles — the quietest, most durable roller upgrade available for residential systems.',
  },
  {
    id: 'hinge',
    name: 'Hinge Replacement',
    desc: 'Replaced worn or cracked hinges with commercial-grade galvanized steel. Restores proper panel articulation and protects tracks from uneven stress.',
  },
  {
    id: 'opener',
    name: 'Opener',
    desc: 'Installed a code-compliant garage door opener with auto-reverse safety sensors, rolling-code encryption, and smart-home connectivity ready to go.',
  },
  {
    id: 'sensors',
    name: 'Sensors',
    desc: 'Realigned and tested photoelectric safety sensors. Door now reliably detects any obstruction and reverses — fully compliant and safe for your family.',
  },
  {
    id: 'springs',
    name: 'Springs',
    desc: 'Replaced torsion springs with high-cycle units rated for 25,000+ cycles, precisely calibrated to your door weight for effortless, balanced operation.',
  },
  {
    id: 'remote',
    name: 'Remote',
    desc: 'Programmed a rolling-code remote transmitter for secure, reliable access. Compatible with all major opener brands — works every time.',
  },
  {
    id: 'tune-up',
    name: 'Free Tune Up',
    desc: 'Complimentary full-system service: all moving parts lubricated, hardware tightened, cables and springs inspected, and all safety features tested.',
  },
  {
    id: 'adjustments',
    name: 'Free Adjustments',
    desc: 'Travel limits and force sensitivity adjusted at no charge — door now opens, closes, and stops with precision every single time.',
  },
  {
    id: 'drums-retension',
    name: 'Drums Re-Tension',
    desc: 'Cable drums re-tensioned to eliminate uneven lifting and restore balanced travel on both sides. Eliminates drifting and protects the opener from overload.',
  },
  {
    id: 'spring-retension',
    name: 'Spring Re-Tension',
    desc: 'Torsion spring tension precisely adjusted to restore full door balance — reducing motor strain, extending opener life, and ensuring smooth daily operation.',
  },
  {
    id: 'installation',
    name: 'Garage System Installation',
    desc: 'Complete new garage door system installed: panels assembled, springs and cables rigged, opener mounted, sensors aligned, and all safety features verified and tested.',
  },
];

function renderItemsTab() {
  const grid = document.getElementById('itemsGrid');
  if (!grid) return;

  grid.innerHTML = ITEMS.map(item =>
    `<div class="item-card" data-item="${item.id}">
       <div class="item-name">${item.name}</div>
     </div>`
  ).join('');

  grid.querySelectorAll('.item-card').forEach(function(card) {
    card.addEventListener('click', function() {
      const item = ITEMS.find(i => i.id === card.getAttribute('data-item'));
      if (!item) return;
      navigator.clipboard.writeText(item.desc).then(
        function() {
          toast('✓ Copied: ' + item.name);
          card.classList.add('item-card--flash');
          setTimeout(function() { card.classList.remove('item-card--flash'); }, 500);
        },
        function() { toast('Copy failed', '#f97316'); }
      );
    });
  });
}
