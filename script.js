/* ==========================================================================
   Shreeji Real Estate - Interactive JavaScript
   ========================================================================== */

function initMobileNav() {
  // 1. Sticky Header & Mobile Slide-In Navigation Panel
  const header = document.getElementById('header');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.getElementById('navLinks');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      if (header) header.classList.add('scrolled');
    } else {
      if (header) header.classList.remove('scrolled');
    }
  });

  if (mobileMenuBtn && navLinks) {
    // 1. Dark Backdrop behind slide-in menu
    let backdrop = document.getElementById('navBackdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'navBackdrop';
      backdrop.className = 'nav-backdrop';
      document.body.appendChild(backdrop);
    }

    // 5. Show search inside hamburger menu when under 400px
    const headerSearchBtn = document.querySelector('.navbar .hud-btn');
    if (headerSearchBtn && !navLinks.querySelector('.mobile-search-item')) {
      const searchLi = document.createElement('li');
      searchLi.className = 'mobile-search-item';
      searchLi.innerHTML = '<a href="#properties-section" class="nav-link mobile-search-link"><i class="fa-solid fa-magnifying-glass"></i> Search Properties</a>';
      const consultLi = navLinks.querySelector('.mobile-only-link');
      if (consultLi) {
        navLinks.insertBefore(searchLi, consultLi);
      } else {
        navLinks.appendChild(searchLi);
      }
    }

    let menuOpenedTime = 0;

    const openMenu = () => {
      navLinks.classList.add('active');
      backdrop.classList.add('active');
      menuOpenedTime = Date.now();
      const icon = mobileMenuBtn.querySelector('i');
      if (icon) icon.className = 'fa-solid fa-xmark';
    };

    window.closeMenu = function(callback) {
      navLinks.classList.remove('active');
      backdrop.classList.remove('active');
      document.body.classList.remove('menu-open');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      const icon = mobileMenuBtn.querySelector('i');
      if (icon) icon.className = 'fa-solid fa-bars';
      if (typeof callback === 'function') {
        setTimeout(callback, 20);
      }
    };
    const closeMenu = window.closeMenu;

    // Toggle on hamburger button
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (navLinks.classList.contains('active')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Close on backdrop tap
    backdrop.addEventListener('click', () => closeMenu());

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('active')) {
        closeMenu();
      }
    });

    // Self-correcting scroll that re-measures until the section is actually at the top
    function goTo(id) {
      var t = document.getElementById(id);
      if (!t) {
        console.error('Menu target not found:', id);
        return;
      }
      if (typeof window.ScrollTrigger !== 'undefined' && typeof window.ScrollTrigger.refresh === 'function') {
        window.ScrollTrigger.refresh();
      }
      var h = (document.querySelector('.header') || {}).offsetHeight || 0;
      var tries = 0;
      (function step() {
        var delta = t.getBoundingClientRect().top - h;
        if (Math.abs(delta) > 2 && tries++ < 25) {
          window.scrollBy(0, delta);
          setTimeout(step, 60);
        } else {
          history.replaceState(null, '', '#' + id);
        }
      })();
    }
    window.goTo = goTo;

    // Capture-phase click listener for menu links: runs before anything else can block it
    document.addEventListener('click', function (e) {
      var a = e.target.closest('.nav-menu a[href], .mobile-menu a[href], nav a[href], .nav-links a[href]');
      if (!a || window.innerWidth > 1024) return;
      var href = a.getAttribute('href') || '';
      var hashIndex = href.indexOf('#');
      var isSamePage = href.startsWith('#') || (hashIndex > -1 && href.split('#')[0].replace(/^\.?\//, '') === (location.pathname.split('/').pop() || 'index.html'));
      if (!isSamePage) return; // other pages navigate normally
      e.preventDefault();
      e.stopImmediatePropagation();
      var id = href.slice(hashIndex + 1);
      closeMenu(); // existing close function; also remove body.menu-open and any scroll lock
      setTimeout(function () {
        goTo(id);
      }, 350);
    }, true);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileNav);
} else {
  initMobileNav();
}

document.addEventListener('DOMContentLoaded', () => {

  // 2. Active Nav Link Highlighting based on current pathname
  const currentPath = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav-link[href], .dropdown-item[href]').forEach(link => {
    const href = link.getAttribute('href')?.toLowerCase().replace(/\/$/, '') || '/';
    if (href === currentPath || (currentPath === '' && href === '/') || (href !== '/' && currentPath !== '/' && currentPath.includes(href))) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Highlight dropdown toggle only if a child dropdown-item is active
  document.querySelectorAll('.dropdown').forEach(dropdown => {
    const toggle = dropdown.querySelector('.dropdown-toggle');
    const activeItem = dropdown.querySelector('.dropdown-item.active');
    if (toggle) {
      if (activeItem) {
        toggle.classList.add('active');
      } else {
        toggle.classList.remove('active');
      }
    }
  });

  // 3. Dropdown Toggle Handler
  const dropdowns = document.querySelectorAll('.dropdown');
  dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector('.dropdown-toggle');
    if (toggle) {
      toggle.addEventListener('click', (e) => {
        if (e.target.closest('.dropdown-menu')) return;
        e.stopPropagation();
        dropdown.classList.toggle('active');
      });
    }
  });

  document.addEventListener('click', (e) => {
    dropdowns.forEach(dropdown => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });
  });

  // 4. Scroll-Driven Reveal Animations (IntersectionObserver)
  const revealElements = document.querySelectorAll('.reveal');
  const observerOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  revealElements.forEach(el => revealObserver.observe(el));

  // 5. Process Roadmap Progress Line Fill
  const processSection = document.getElementById('processSection');
  const processLineFill = document.getElementById('processLineFill');

  if (processSection && processLineFill) {
    window.addEventListener('scroll', () => {
      const rect = processSection.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      if (rect.top < windowHeight && rect.bottom > 0) {
        const totalHeight = rect.height;
        const progress = Math.min(100, Math.max(0, ((windowHeight - rect.top) / (totalHeight + windowHeight / 2)) * 100));
        processLineFill.style.width = `${progress}%`;
      }
    });
  }

  // 6. Animated Stat Counters
  const statNumbers = document.querySelectorAll('.stat-number');
  let counted = false;

  const statsSection = document.getElementById('statsBanner');
  if (statsSection) {
    const statsObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !counted) {
        counted = true;
        statNumbers.forEach(stat => {
          const target = parseInt(stat.getAttribute('data-target'));
          const suffix = stat.getAttribute('data-suffix') || '';
          let count = 0;

          const updateCount = () => {
            const increment = Math.ceil(target / 40);
            if (count < target) {
              count = Math.min(target, count + increment);
              stat.innerText = count + suffix;
              setTimeout(updateCount, 40);
            } else {
              stat.innerText = target + suffix;
            }
          };
          updateCount();
        });
      }
    }, { threshold: 0.3 });
    statsObserver.observe(statsSection);
  }

  // 7. FAQ Accordion Toggle
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach(i => i.classList.remove('active'));
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  // 8. Dual-Lead Funnel Modal Logic (Buy vs Sell)
  const modalOverlay = document.getElementById('leadModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalSub = document.getElementById('modalSub');
  const buyTab = document.getElementById('buyTab');
  const sellTab = document.getElementById('sellTab');
  const buyerForm = document.getElementById('buyerForm');
  const sellerForm = document.getElementById('sellerForm');
  const formSuccess = document.getElementById('formSuccess');
  const closeModalBtn = document.getElementById('closeModalBtn');

  function closeModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
  window.closeModal = closeModal;

  function openModal(type) {
    if (!modalOverlay) return;
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (formSuccess) formSuccess.style.display = 'none';
    
    if (type === 'sell') {
      switchTab('sell');
    } else {
      switchTab('buy');
    }
  }
  window.openModal = openModal;

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  function switchTab(mode) {
    if (mode === 'sell') {
      if (sellTab) sellTab.classList.add('active');
      if (buyTab) buyTab.classList.remove('active');
      if (sellerForm) sellerForm.style.display = 'grid';
      if (buyerForm) buyerForm.style.display = 'none';
      if (modalTitle) modalTitle.innerText = 'Looking to Sell Land in Kutch?';
      if (modalSub) modalSub.innerText = 'Get a free valuation and connect with serious commercial buyers.';
    } else {
      if (buyTab) buyTab.classList.add('active');
      if (sellTab) sellTab.classList.remove('active');
      if (buyerForm) buyerForm.style.display = 'grid';
      if (sellerForm) sellerForm.style.display = 'none';
      if (modalTitle) modalTitle.innerText = 'Looking to Buy Land in Kutch?';
      if (modalSub) modalSub.innerText = 'Access verified GIDC, NA, and Port-adjacent commercial plots.';
    }
  }

  if (buyTab) buyTab.addEventListener('click', () => switchTab('buy'));
  if (sellTab) sellTab.addEventListener('click', () => switchTab('sell'));

  // Quick Open Modal with pre-filled property details
  window.openModalWithDetails = function(propertyName, location, price) {
    openModal('buy');
    const areaInput = buyerForm ? buyerForm.querySelector('input[placeholder*="Acres"]') : null;
    if (areaInput) {
      areaInput.value = `${propertyName} (${location})`;
    }
    const budgetInput = buyerForm ? buyerForm.querySelector('input[placeholder*="Budget"]') : null;
    if (budgetInput && price) {
      budgetInput.value = price;
    }
  };

  // Property Category Filter Pills
  const filterPills = document.querySelectorAll('.filter-pill');
  const propertyCards = document.querySelectorAll('.property-card');

  if (filterPills.length > 0) {
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const filter = pill.getAttribute('data-filter');

        propertyCards.forEach(card => {
          if (filter === 'all' || card.getAttribute('data-category') === filter) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  // Centralized Backend Server Integration Helper
  const API_BASE = window.SHREEJI_API_BASE || (
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000/api/v1'
      : (window.location.origin.includes('github.io') ? 'https://shreeji-server.onrender.com/api/v1' : '/api/v1')
  );

  async function postInquiryToServer(payload) {
    try {
      const realEstatePayload = {
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        role: payload.role || (payload.subject?.includes('BUY') ? 'buyer' : 'seller'),
        propertyCategory: payload.propertyCategory || payload.landType || 'Commercial',
        preferredLocation: payload.preferredLocation || payload.location || 'Gandhidham',
        builtupArea: payload.builtupArea || payload.area || '',
        message: payload.message || payload.subject,
        source: 'shreeji_web_portal'
      };

      const res = await fetch(`${API_BASE}/property-inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Platform': 'web'
        },
        body: JSON.stringify(realEstatePayload)
      });
      const data = await res.json();
      console.log('✅ Real estate lead synced with Shreeji API:', data);
    } catch (err) {
      console.warn('ℹ️ Backend server offline, stored inquiry locally in localStorage:', err);
    }
  }

  if (buyerForm) {
    buyerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = buyerForm.querySelector('input[placeholder="Your Name"]').value;
      const phone = buyerForm.querySelector('input[placeholder="+91 XXXXX XXXXX"]').value;
      const location = buyerForm.querySelector('select.form-select').value;
      const landType = buyerForm.querySelectorAll('select.form-select')[1].value;
      const area = buyerForm.querySelector('input[placeholder*="Acres"]').value;

      const newInquiry = {
        type: 'buy',
        date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        name,
        phone,
        location,
        landType,
        area
      };

      const inquiries = JSON.parse(localStorage.getItem('lead_inquiries')) || [];
      inquiries.push(newInquiry);
      localStorage.setItem('lead_inquiries', JSON.stringify(inquiries));

      // Asynchronously sync with Shreeji Node.js backend server
      postInquiryToServer({
        name,
        email: `${name.toLowerCase().replace(/\s+/g, '')}@client.shreejirealestate.com`,
        phone,
        subject: `[BUY/RENT INQUIRY] ${landType.toUpperCase()} in ${location.toUpperCase()}`,
        message: `Customer Inquiry: Interested in ${landType} in ${location}. Area/Property: ${area}. Phone: ${phone}. Submitted via Shreeji Web Portal.`
      });

      buyerForm.style.display = 'none';
      formSuccess.style.display = 'block';
    });
  }

  if (sellerForm) {
    sellerForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = sellerForm.querySelector('input[placeholder="Your Full Name"]').value;
      const phone = sellerForm.querySelector('input[placeholder="+91 XXXXX XXXXX"]').value;
      const location = sellerForm.querySelector('input[placeholder*="Kandla Port"]').value;
      const landType = sellerForm.querySelector('select.form-select').value;
      const area = sellerForm.querySelector('input[placeholder*="12 Acres"]').value;

      const newInquiry = {
        type: 'sell',
        date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        name,
        phone,
        location,
        landType,
        area
      };

      const inquiries = JSON.parse(localStorage.getItem('lead_inquiries')) || [];
      inquiries.push(newInquiry);
      localStorage.setItem('lead_inquiries', JSON.stringify(inquiries));

      // Asynchronously sync with Shreeji Node.js backend server
      postInquiryToServer({
        name,
        email: `${name.toLowerCase().replace(/\s+/g, '')}@seller.shreejirealestate.com`,
        phone,
        subject: `[PROPERTY LISTING & VALUATION] ${landType.toUpperCase()} in ${location.toUpperCase()}`,
        message: `Owner Property Listing: Location: ${location}, Title Status: ${landType}, Total Area: ${area}. Owner: ${name}, Phone: ${phone}.`
      });

      sellerForm.style.display = 'none';
      formSuccess.style.display = 'block';
    });
  }

  // 8b. 3D Interactive Map Modal Logic (Adipur Wards - Full Screen)
  const view3dMapBtn = document.getElementById('view-3d-map-btn');
  const modal3DMap = document.getElementById('modal3DMap');
  const close3DModalBtn = document.getElementById('close3DModalBtn');
  const dismiss3DModalBtn = document.getElementById('dismiss3DModalBtn');

  function open3DModal() {
    if (!modal3DMap) return;
    modal3DMap.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Request native fullscreen mode if supported
    try {
      if (modal3DMap.requestFullscreen) {
        modal3DMap.requestFullscreen().catch(() => {});
      } else if (modal3DMap.webkitRequestFullscreen) {
        modal3DMap.webkitRequestFullscreen();
      } else if (modal3DMap.msRequestFullscreen) {
        modal3DMap.msRequestFullscreen();
      }
    } catch (e) {
      console.log('Fullscreen API fallback to 100vw/100vh CSS mode');
    }
  }

  function close3DModal() {
    if (!modal3DMap) return;
    modal3DMap.classList.remove('active');
    document.body.style.overflow = 'auto';

    if (document.fullscreenElement || document.webkitFullscreenElement) {
      try {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      } catch (e) {}
    }
  }

  if (view3dMapBtn) {
    view3dMapBtn.addEventListener('click', open3DModal);
  }

  if (close3DModalBtn) {
    close3DModalBtn.addEventListener('click', close3DModal);
  }

  if (dismiss3DModalBtn) {
    dismiss3DModalBtn.addEventListener('click', close3DModal);
  }

  if (modal3DMap) {
    modal3DMap.addEventListener('click', (e) => {
      if (e.target === modal3DMap) close3DModal();
    });
  }

  // 9. Language Switcher (Shared js/i18n.js)
  // Handled centrally by js/i18n.js for instant switching and persistence across all pages

  const defaultSiteContent = {
    home: {
      heroTitle: "Your Premier Partner for <span>Rental Commercial Properties</span> in Gandhidham & Adipur",
      heroSubtitle: "Expert guidance for renting, leasing, buying, and listing commercial shops, corporate offices, showrooms, and commercial plots across Gandhidham & Adipur, Gujarat.",
      contactPhone: "+91 98257 99754",
      contactEmail: "shreejirealestate@gmail.com",
      storyHeadline: "Swastik by Shreeji Infotech",
      storyParagraph: "Swastik by Shreeji Infotech is your dedicated commercial property & rental consultancy headquartered in Gandhidham, Kutch, Gujarat. With 10+ years of local market leadership, we connect business owners, retail brands, and corporate tenants with top commercial rental spaces, offices, and plots in Gandhidham and Adipur.",
      statYears: "10+",
      statAcres: "250+",
      statClients: "100+"
    },
    gandhidham: {
      heroBadge: "Commercial Hub",
      heroTitle: "Rental Commercial Space in <span>Gandhidham Market</span>",
      heroSubtitle: "Shops, showrooms, office space, and commercial plots available on rent/lease across Tagore Road, Sector 1-12, and Main Market.",
      adv1Title: "Tagore Road Frontage",
      adv1Desc: "High footfall retail shops & corporate offices on Gandhidham's central arterial business road.",
      adv2Title: "Sector Market Locations",
      adv2Desc: "Prime corner shops and commercial floors in Sector 1 to Sector 12 markets.",
      adv3Title: "100% Lease Clearances",
      adv3Desc: "Clean title 11-month lease deeds, clear revenue status, and commercial municipal clearance.",
      adv4Title: "High Rental Yields",
      adv4Desc: "Strong capital appreciation and high return on investment for commercial property owners."
    },
    adipur: {
      heroBadge: "Retail & Residential Belt",
      heroTitle: "Commercial Properties in <span>Adipur Retail Hub</span>",
      heroSubtitle: "Prime retail market shops, showroom spaces, and office suites on Station Road and key commercial avenues in Adipur.",
      adv1Title: "Station Road High Street",
      adv1Desc: "High customer density market locations ideal for apparel, electronics, and retail branch offices.",
      adv2Title: "Flexible Lease Terms",
      adv2Desc: "Short-term 11-month agreements or long-term 5-year to 9-year corporate lease deeds.",
      adv3Title: "Ready Move-In Units",
      adv3Desc: "Bare-shell and furnished shops & offices ready for immediate business setup.",
      adv4Title: "Transparent Brokerage",
      adv4Desc: "Fair market valuations, clear fee structure, and end-to-end lease agreement support."
    }
  };

  let siteContent = defaultSiteContent;
  try {
    const stored = localStorage.getItem('site_content');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed) siteContent = parsed;
    }
  } catch (e) {
    siteContent = defaultSiteContent;
  }

  // 11. Determine Current Page Key & Apply Overrides
  const path = window.location.pathname.toLowerCase();
  let currentPageKey = null;
  if (path.includes('gandhidham')) currentPageKey = 'gandhidham';
  else if (path.includes('adipur')) currentPageKey = 'adipur';

  if (currentPageKey && siteContent[currentPageKey]) {
    const pageData = siteContent[currentPageKey];
    
    // Override Hero details for subpages
    const heroBadge = document.querySelector('.hero-badge');
    const heroTitle = document.querySelector('.hero-title');
    const heroSub = document.querySelector('.hero-subtitle');
    
    if (heroBadge && pageData.heroBadge) heroBadge.innerHTML = `<i class="fa-solid fa-anchor"></i> ${pageData.heroBadge}`;
    if (heroTitle && pageData.heroTitle) heroTitle.innerHTML = pageData.heroTitle;
    if (heroSub && pageData.heroSubtitle) heroSub.textContent = pageData.heroSubtitle;

    // Override Advantages list cards
    const advCards = document.querySelectorAll('.industries-grid .industry-card');
    if (advCards && advCards.length >= 4) {
      if (pageData.adv1Title && advCards[0].querySelector('.industry-title')) {
        advCards[0].querySelector('.industry-title').textContent = pageData.adv1Title;
      }
      if (pageData.adv1Desc && advCards[0].querySelector('.industry-desc')) {
        advCards[0].querySelector('.industry-desc').textContent = pageData.adv1Desc;
      }
      if (pageData.adv2Title && advCards[1].querySelector('.industry-title')) {
        advCards[1].querySelector('.industry-title').textContent = pageData.adv2Title;
      }
      if (pageData.adv2Desc && advCards[1].querySelector('.industry-desc')) {
        advCards[1].querySelector('.industry-desc').textContent = pageData.adv2Desc;
      }
      if (pageData.adv3Title && advCards[2].querySelector('.industry-title')) {
        advCards[2].querySelector('.industry-title').textContent = pageData.adv3Title;
      }
      if (pageData.adv3Desc && advCards[2].querySelector('.industry-desc')) {
        advCards[2].querySelector('.industry-desc').textContent = pageData.adv3Desc;
      }
      if (pageData.adv4Title && advCards[3].querySelector('.industry-title')) {
        advCards[3].querySelector('.industry-title').textContent = pageData.adv4Title;
      }
      if (pageData.adv4Desc && advCards[3].querySelector('.industry-desc')) {
        advCards[3].querySelector('.industry-desc').textContent = pageData.adv4Desc;
      }
    }
  } else {
    // Only apply custom admin overrides if non-default custom content exists in localStorage
    const hasCustomHomeData = localStorage.getItem('site_content') !== null;
    if (hasCustomHomeData) {
      const homeData = siteContent.home || defaultSiteContent.home;
      const heroTitleEl = document.querySelector('.hero-title');
      const heroSubEl = document.querySelector('.hero-subtitle');
      if (heroTitleEl && homeData.heroTitle) {
        heroTitleEl.innerHTML = homeData.heroTitle;
      }
      if (heroSubEl && homeData.heroSubtitle) {
        heroSubEl.textContent = homeData.heroSubtitle;
      }

      const storyHeadlineEl = document.getElementById('storyHeadlineDisplay');
      const storyParagraphEl = document.getElementById('storyParagraphDisplay');
      if (storyHeadlineEl && homeData.storyHeadline) storyHeadlineEl.textContent = homeData.storyHeadline;
      if (storyParagraphEl && homeData.storyParagraph) storyParagraphEl.textContent = homeData.storyParagraph;
    }

    // Apply Stats banner dynamic numbers
    const homeData = siteContent.home || defaultSiteContent.home;
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers && statNumbers.length >= 3) {
      if (homeData.statYears) {
        statNumbers[0].setAttribute('data-target', homeData.statYears.replace(/\D/g, '') || "10");
        statNumbers[0].setAttribute('data-suffix', homeData.statYears.replace(/\d/g, '') || "+");
      }
      if (homeData.statAcres) {
        statNumbers[1].setAttribute('data-target', homeData.statAcres.replace(/\D/g, '') || "500");
        statNumbers[1].setAttribute('data-suffix', homeData.statAcres.replace(/\d/g, '') || "+");
      }
      if (homeData.statClients) {
        statNumbers[2].setAttribute('data-target', homeData.statClients.replace(/\D/g, '') || "100");
        statNumbers[2].setAttribute('data-suffix', homeData.statClients.replace(/\d/g, '') || "+");
      }
    }

    // Apply contact details overrides
    const footerPhoneEl = document.querySelector('.footer-links i.fa-phone');
    const footerEmailEl = document.querySelector('.footer-links i.fa-envelope');
    if (footerPhoneEl && homeData.contactPhone && footerPhoneEl.parentElement) {
      footerPhoneEl.parentElement.innerHTML = `<i class="fa-solid fa-phone" style="color: var(--accent-gold); margin-right: 0.5rem;"></i> ${homeData.contactPhone}`;
    }
    if (footerEmailEl && homeData.contactEmail && footerEmailEl.parentElement) {
      footerEmailEl.parentElement.innerHTML = `<i class="fa-solid fa-envelope" style="color: var(--accent-gold); margin-right: 0.5rem;"></i> ${homeData.contactEmail}`;
    }
  }

  // Admin access validation for floating badge and PDF downloads vault
  const isAdmin = sessionStorage.getItem('admin_logged') === 'true';
  if (isAdmin) {
    const floatingBtn = document.getElementById('floatingAdminBtn');
    if (floatingBtn) floatingBtn.style.display = 'flex';

    const adminPdfVault = document.getElementById('adminPdfVault');
    const vaultPdfContainer = document.getElementById('vaultPdfContainer');

    if (adminPdfVault && vaultPdfContainer) {
      adminPdfVault.style.display = 'block';
      vaultPdfContainer.innerHTML = '';

      if (!siteContent.pdfs || siteContent.pdfs.length === 0) {
        vaultPdfContainer.innerHTML = `<p style="color: rgba(255,255,255,0.7); grid-column: span 3; text-align: center; padding: 2rem;">No documents uploaded in the vault yet.</p>`;
      } else {
        siteContent.pdfs.forEach(pdf => {
          const card = document.createElement('div');
          card.className = 'service-card active';
          card.style.background = 'rgba(255, 255, 255, 0.08)';
          card.style.border = '1px solid rgba(255, 255, 255, 0.15)';
          card.style.color = 'white';
          card.innerHTML = `
            <div style="font-size: 2.5rem; color: #EF4444; margin-bottom: 1rem;"><i class="fa-solid fa-file-pdf"></i></div>
            <h3 style="color: white; font-size: 1.2rem; margin-bottom: 0.5rem;">${pdf.name}</h3>
            <p style="color: rgba(255,255,255,0.6); font-size: 0.8rem; margin-bottom: 1.5rem;">Size: ${pdf.size} | Uploaded: ${pdf.date}</p>
            <a href="${pdf.data}" download="${pdf.name}" class="btn btn-secondary" style="width: 100%; text-decoration: none;"><i class="fa-solid fa-download"></i> Download PDF</a>
          `;
          vaultPdfContainer.appendChild(card);
        });
      }
    }
  }

  // FAQ Page Category Filter & Real-Time Search Handler
  const faqSearchInput = document.getElementById('faqSearchInput');
  const faqCategoryBtns = document.querySelectorAll('.faq-cat-btn');
  const faqPageItems = document.querySelectorAll('.faq-item');

  function filterFaqs() {
    const query = faqSearchInput ? faqSearchInput.value.toLowerCase().trim() : '';
    const activeCategoryBtn = document.querySelector('.faq-cat-btn.active');
    const category = activeCategoryBtn ? activeCategoryBtn.getAttribute('data-category') : 'all';

    faqPageItems.forEach(item => {
      const itemCategory = item.getAttribute('data-category');
      const questionText = item.querySelector('.faq-question')?.textContent.toLowerCase() || '';
      const answerText = item.querySelector('.faq-answer')?.textContent.toLowerCase() || '';
      
      const matchesCategory = category === 'all' || itemCategory === category;
      const matchesQuery = !query || questionText.includes(query) || answerText.includes(query);

      if (matchesCategory && matchesQuery) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  }

  if (faqSearchInput) {
    faqSearchInput.addEventListener('input', filterFaqs);
  }

  // ==========================================================================
  // Target Areas Cascading Filter Logic (Gujarat AnyRoR Model)
  // ==========================================================================
  const kutchVillagesData = {
    "Bhuj": ["Bhuj City", "Madhapar", "Kukma", "Sukhpar", "Mirzapar", "Khavda", "Reha"],
    "Anjar": ["Anjar City", "Meghpar-Borichi", "Sinugra", "Varsamedi", "Nagalpar", "Dudhai"],
    "Gandhidham": ["Gandhidham", "Adipur", "Sector 1-12", "Shinay", "Kidana", "Galpadar"],
    "Bhachau": ["Bhachau City", "Chobari", "Samakhiali", "Vondh", "Kadol", "Manfara"],
    "Rapar": ["Rapar City", "Gagodar", "Chitrod", "Bela", "Adesar", "Palanswa"],
    "Mundra": ["Mundra Port Area", "Baroi", "Pragpar", "Zarpara", "Dhrub", "Tunda Wandh"],
    "Mandvi": ["Mandvi Beach Town", "Salaya", "Gadhsisa", "Koda", "Maska", "Bada"],
    "Nakhatrana": ["Nakhatrana", "Manjal", "Desalpar", "Ravapar", "Virani", "Dahisara"],
    "Abdasa": ["Naliya", "Kothara", "Bitez", "Jakhau", "Tera", "Votharo"],
    "Lakhpat": ["Dayapar", "Narayan Sarovar", "Koteshwar", "Lakhpat Town", "Panandhro", "Ghaduli"]
  };

  document.querySelectorAll('.cascading-filter-section').forEach(section => {
    const talukaSelect = section.querySelector('.taluka-select') || section.querySelector('#talukaSelect');
    const villageSelect = section.querySelector('.village-select') || section.querySelector('#villageSelect');
    const searchBtn = section.querySelector('.search-btn') || section.querySelector('#targetAreaSearchBtn');
    const resetBtn = section.querySelector('.reset-btn') || section.querySelector('#targetAreaResetBtn');
    const resultsContainer = section.querySelector('.results-container') || section.querySelector('#targetAreaResults');

    const cardStep3 = section.querySelector('.card-step-3') || section.querySelector('#cardStep3');
    const cardStep4 = section.querySelector('.card-step-4') || section.querySelector('#cardStep4');
    const badgeStep3 = section.querySelector('.badge-step-3') || section.querySelector('#badgeStep3');
    const badgeStep4 = section.querySelector('.badge-step-4') || section.querySelector('#badgeStep4');
    const hintStep4 = section.querySelector('.hint-step-4') || section.querySelector('#hintStep4');
    const stepIndicator3 = section.querySelector('.step-indicator-3') || section.querySelector('#stepIndicator3');
    const stepIndicator4 = section.querySelector('.step-indicator-4') || section.querySelector('#stepIndicator4');
    const stepperProgressFill = section.querySelector('.stepper-progress-fill') || section.querySelector('#stepperProgressFill');

    const resultTitle = section.querySelector('.result-title') || section.querySelector('#resultTitle');
    const resultDetails = section.querySelector('.result-details') || section.querySelector('#resultDetails');
    const resultTalukaTag = section.querySelector('.result-taluka-tag') || section.querySelector('#resultTalukaTag');
    const resultVillageTag = section.querySelector('.result-village-tag') || section.querySelector('#resultVillageTag');

    function updateState() {
      const selectedTaluka = talukaSelect ? talukaSelect.value : '';
      const selectedVillage = villageSelect ? villageSelect.value : '';

      if (selectedTaluka) {
        if (cardStep3) cardStep3.className = 'filter-card step-completed card-step-3';
        if (badgeStep3) {
          badgeStep3.className = 'card-status-badge completed badge-step-3';
          badgeStep3.innerHTML = '<i class="fa-solid fa-circle-check"></i> Selected';
        }
        if (stepIndicator3) {
          stepIndicator3.className = 'stepper-step completed step-indicator-3';
          const badge = stepIndicator3.querySelector('.step-badge');
          if (badge) badge.innerHTML = '<i class="fa-solid fa-check"></i>';
        }

        if (villageSelect) villageSelect.disabled = false;
        if (cardStep4) cardStep4.className = 'filter-card step-active card-step-4';
        if (badgeStep4) {
          badgeStep4.className = 'card-status-badge active badge-step-4';
          badgeStep4.innerHTML = '<i class="fa-solid fa-circle-dot"></i> Active';
        }
        if (hintStep4) hintStep4.textContent = `Choose an area in ${selectedTaluka} Taluka`;
        if (stepIndicator4 && !selectedVillage) {
          stepIndicator4.className = 'stepper-step active step-indicator-4';
          const badge = stepIndicator4.querySelector('.step-badge');
          if (badge) badge.textContent = '4';
        }

        if (villageSelect) {
          const prevVal = villageSelect.value;
          villageSelect.innerHTML = '<option value="">-- Select City / Village --</option>';
          const villages = kutchVillagesData[selectedTaluka] || [];
          villages.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v;
            opt.textContent = v;
            if (v === prevVal) opt.selected = true;
            villageSelect.appendChild(opt);
          });
        }
        if (stepperProgressFill) stepperProgressFill.style.width = '75%';
      } else {
        if (cardStep3) cardStep3.className = 'filter-card step-active card-step-3';
        if (badgeStep3) {
          badgeStep3.className = 'card-status-badge active badge-step-3';
          badgeStep3.innerHTML = '<i class="fa-solid fa-circle-dot"></i> Active';
        }
        if (stepIndicator3) {
          stepIndicator3.className = 'stepper-step active step-indicator-3';
          const badge = stepIndicator3.querySelector('.step-badge');
          if (badge) badge.textContent = '3';
        }

        if (villageSelect) {
          villageSelect.disabled = true;
          villageSelect.innerHTML = '<option value="">-- Select City / Village --</option>';
        }
        if (cardStep4) cardStep4.className = 'filter-card step-disabled card-step-4';
        if (badgeStep4) {
          badgeStep4.className = 'card-status-badge disabled badge-step-4';
          badgeStep4.innerHTML = '<i class="fa-solid fa-lock"></i> Disabled';
        }
        if (hintStep4) hintStep4.textContent = 'Select a Taluka in Step 3 first';
        if (stepIndicator4) {
          stepIndicator4.className = 'stepper-step disabled step-indicator-4';
          const badge = stepIndicator4.querySelector('.step-badge');
          if (badge) badge.textContent = '4';
        }
        if (stepperProgressFill) stepperProgressFill.style.width = '50%';
      }

      if (selectedTaluka && selectedVillage) {
        if (cardStep4) cardStep4.className = 'filter-card step-completed card-step-4';
        if (badgeStep4) {
          badgeStep4.className = 'card-status-badge completed badge-step-4';
          badgeStep4.innerHTML = '<i class="fa-solid fa-circle-check"></i> Selected';
        }
        if (stepIndicator4) {
          stepIndicator4.className = 'stepper-step completed step-indicator-4';
          const badge = stepIndicator4.querySelector('.step-badge');
          if (badge) badge.innerHTML = '<i class="fa-solid fa-check"></i>';
        }
        if (searchBtn) searchBtn.disabled = false;
        if (stepperProgressFill) stepperProgressFill.style.width = '100%';
      } else {
        if (searchBtn) searchBtn.disabled = true;
      }
    }

    if (talukaSelect) {
      talukaSelect.addEventListener('change', () => {
        if (villageSelect) villageSelect.value = '';
        if (resultsContainer) resultsContainer.style.display = 'none';
        updateState();
      });
    }

    if (villageSelect) {
      villageSelect.addEventListener('change', () => {
        if (resultsContainer) resultsContainer.style.display = 'none';
        updateState();
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const state = 'Gujarat';
        const district = 'Kutch';
        const taluka = talukaSelect ? talukaSelect.value : '';
        const village = villageSelect ? villageSelect.value : '';

        console.log('Target Area Search Executed:', { state, district, taluka, village });

        // Redirect to /adipur if Taluka is "Gandhidham" and City/Village is "Adipur"
        if (taluka === 'Gandhidham' && village === 'Adipur') {
          window.location.href = '/adipur';
          return;
        }

        if (resultsContainer && resultTitle && resultDetails && resultTalukaTag && resultVillageTag) {
          resultTitle.textContent = `Showing results for ${village}, ${taluka}`;
          resultDetails.textContent = `Verified property listings, sector plots, and commercial land records in ${village}, ${taluka} Taluka, Kutch District, Gujarat.`;
          resultTalukaTag.textContent = `Taluka: ${taluka}`;
          resultVillageTag.textContent = `Village: ${village}`;
          resultsContainer.style.display = 'block';
          resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (talukaSelect) talukaSelect.value = '';
        if (villageSelect) villageSelect.value = '';
        if (resultsContainer) resultsContainer.style.display = 'none';
        updateState();
      });
    }

    if (talukaSelect && villageSelect) {
      updateState();
    }
  });

  // Ensure current language is applied after all dynamic rendering
  if (window.applyLanguage) window.applyLanguage(localStorage.getItem('preferred_language') || 'en');
});

// ==========================================================================
// Concept 1: Regal Corporate Navy & Champagne Gold Interactive Handlers
// ==========================================================================

// Modal Dialog Management
window.openModal = function(type = 'buy') {
  const modal = document.getElementById('leadModal');
  if (!modal) return;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  switchModalTab(type);
  const successBox = document.getElementById('formSuccess');
  if (successBox) successBox.style.display = 'none';
};

window.closeModal = function() {
  const modal = document.getElementById('leadModal');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
};

window.switchModalTab = function(type) {
  const buyTab = document.getElementById('buyTab');
  const sellTab = document.getElementById('sellTab');
  const buyerForm = document.getElementById('buyerForm');
  const sellerForm = document.getElementById('sellerForm');
  const modalTitle = document.getElementById('modalTitle');
  const modalSub = document.getElementById('modalSub');

  if (type === 'sell') {
    if (buyTab) buyTab.classList.remove('active');
    if (sellTab) sellTab.classList.add('active');
    if (buyerForm) buyerForm.style.display = 'none';
    if (sellerForm) sellerForm.style.display = 'grid';
    if (modalTitle) modalTitle.textContent = 'List Your Commercial Property';
    if (modalSub) modalSub.textContent = 'Partner with Swastik by Shreeji Infotech to lease or sell to verified corporate & retail tenants.';
  } else {
    if (buyTab) buyTab.classList.add('active');
    if (sellTab) sellTab.classList.remove('active');
    if (buyerForm) buyerForm.style.display = 'grid';
    if (sellerForm) sellerForm.style.display = 'none';
    if (modalTitle) modalTitle.textContent = 'Commercial Property Inquiry';
    if (modalSub) modalSub.textContent = 'Direct advisory for commercial spaces & land parcels in Gandhidham & Adipur.';
  }
};

window.openModalWithDetails = function(title, price, location) {
  window.openModal('buy');
  const locInput = document.getElementById('buyerLoc');
  const notesInput = document.getElementById('buyerNotes');
  if (locInput) locInput.value = location || 'Gandhidham / Adipur';
  if (notesInput) {
    notesInput.value = `Inquiring about: "${title}" (${price}). Please share verified documents, floor plan, and arrange site visit.`;
  }
};

// Quick Hero Search
let currentQuickSearchMode = 'rent';
window.setSearchMode = function(mode, btn) {
  currentQuickSearchMode = mode;
  document.querySelectorAll('.search-tab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
};

window.executeQuickSearch = function() {
  const typeSelect = document.getElementById('quickTypeSelect');
  const category = typeSelect ? typeSelect.value : 'all';

  // Trigger pill filter
  const pill = document.querySelector(`.filter-pill[data-filter="${category}"]`);
  if (pill) {
    pill.click();
  } else {
    const allPill = document.querySelector(`.filter-pill[data-filter="all"]`);
    if (allPill) allPill.click();
  }

  // Smooth scroll to listings
  const listingsSection = document.getElementById('properties-section') || document.querySelector('.properties-showcase');
  if (listingsSection) {
    listingsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

// Inquiry Submission & Backend API Integration
window.handleInquirySubmit = async function(e, role) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const originalBtnText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
  }

  const nameVal = role === 'landlord'
    ? (document.getElementById('sellerName')?.value || '').trim()
    : (document.getElementById('buyerName')?.value || '').trim();
  const phoneVal = role === 'landlord'
    ? (document.getElementById('sellerPhone')?.value || '').trim()
    : (document.getElementById('buyerPhone')?.value || '').trim();
  const locVal = role === 'landlord'
    ? (document.getElementById('sellerLoc')?.value || '').trim()
    : (document.getElementById('buyerLoc')?.value || '').trim();

  if (!nameVal || !phoneVal) {
    alert('Please enter your full name and a valid contact phone number.');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalBtnText;
    }
    return;
  }

  const realEstatePayload = {
    name: nameVal,
    phone: phoneVal,
    role: role === 'landlord' ? 'seller' : 'buyer',
    propertyCategory: role === 'landlord' ? 'Commercial Land Listing' : (document.getElementById('buyerCategory')?.value || 'Commercial Plot'),
    preferredLocation: locVal || 'Gandhidham Belt',
    builtupArea: role === 'landlord' ? (document.getElementById('sellerArea')?.value || '') : '',
    message: role === 'landlord'
      ? `Landlord Listing in ${locVal}. Expected Value: ${document.getElementById('sellerExpected')?.value || 'Market Valuation'}`
      : `Commercial Space Inquiry: ${document.getElementById('buyerCategory')?.value || 'Plot'} in ${locVal}. Notes: ${document.getElementById('buyerNotes')?.value || 'Site visit request'}`,
    source: 'shreeji_web_modal'
  };

  const API_TARGET = window.SHREEJI_API_BASE || (
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000/api/v1'
      : (window.location.origin.includes('github.io') ? 'https://shreeji-server.onrender.com/api/v1' : '/api/v1')
  );

  let isSuccess = false;

  try {
    const response = await fetch(`${API_TARGET}/property-inquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Platform': 'web'
      },
      body: JSON.stringify(realEstatePayload)
    });

    if (response.ok) {
      isSuccess = true;
      const resJson = await response.json();
      console.log('✅ Lead synced with server:', resJson);

      // Save local backup marked synced
      try {
        const existing = JSON.parse(localStorage.getItem('shreeji_inquiries') || '[]');
        existing.push({ ...realEstatePayload, synced: true, timestamp: new Date().toISOString() });
        localStorage.setItem('shreeji_inquiries', JSON.stringify(existing));
      } catch (e) {}

      // If WhatsApp dispatch info returned, update direct contact button
      if (resJson.whatsAppDispatch && resJson.whatsAppDispatch.directUrl) {
        const waLink = document.getElementById('successWaLink');
        if (waLink) {
          waLink.href = resJson.whatsAppDispatch.directUrl;
        }
      }
    } else {
      const errData = await response.json().catch(() => ({}));
      alert(errData.error || 'Unable to register inquiry. Please try again or contact us via WhatsApp.');
    }
  } catch (networkErr) {
    console.warn('Backend currently unreachable, saving inquiry locally for retry:', networkErr);
    // Offline local queue
    try {
      const existing = JSON.parse(localStorage.getItem('shreeji_inquiries') || '[]');
      existing.push({ ...realEstatePayload, synced: false, timestamp: new Date().toISOString() });
      localStorage.setItem('shreeji_inquiries', JSON.stringify(existing));
      isSuccess = true; // Allow offline grace for user
    } catch (e) {}
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalBtnText;
    }
  }

  if (isSuccess) {
    const buyerForm = document.getElementById('buyerForm');
    const sellerForm = document.getElementById('sellerForm');
    const successBox = document.getElementById('formSuccess');

    if (buyerForm) buyerForm.style.display = 'none';
    if (sellerForm) sellerForm.style.display = 'none';
    if (successBox) successBox.style.display = 'block';
  }
};

// Close modal if user clicks on backdrop
document.addEventListener('click', (e) => {
  const modal = document.getElementById('leadModal');
  if (modal && e.target === modal) {
    window.closeModal();
  }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.closeModal();
  }
});

// Category Filter Pills Handling
document.addEventListener('DOMContentLoaded', () => {
  const filterPills = document.querySelectorAll('.filter-pill');
  const propertyCards = document.querySelectorAll('.property-card');

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const filterValue = pill.getAttribute('data-filter');

      propertyCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        if (filterValue === 'all' || cardCategory === filterValue) {
          card.style.display = 'flex';
          card.style.opacity = '1';
        } else {
          card.style.display = 'none';
          card.style.opacity = '0';
        }
      });
    });
  });
});

/* ==========================================================================
   SPATIAL INTELLIGENCE PLATFORM 3D & HUD CONTROLS
   ========================================================================== */

let currentSpatialScale = 1;
let currentCompassAngle = 0;

window.switchSpatialMode = function(mode, btnEl) {
  const switcher = document.getElementById('spatialViewSwitcher');
  const mainImg = document.getElementById('spatialMainImg');
  const badgeText = document.getElementById('spatialViewBadgeText');
  const stage = document.getElementById('spatialVisualStage');
  
  if (switcher && btnEl) {
    switcher.querySelectorAll('.segmented-btn').forEach(btn => btn.classList.remove('active'));
    btnEl.classList.add('active');
  }

  const hotspots = stage ? stage.querySelectorAll('.spatial-hotspot') : [];

  if (mode === 'estate' || mode === 'luxury') {
    if (mainImg) mainImg.src = 'images/hero-luxury-estate.jpg';
    if (badgeText) badgeText.innerText = 'Swastik Prime Estate View';
    hotspots.forEach(h => h.style.display = 'flex');
  } else if (mode === '3d') {
    if (mainImg) mainImg.src = 'images/shreeji-3d-spatial-masterplan.jpg';
    if (badgeText) badgeText.innerText = '3D Model Masterplan View';
    hotspots.forEach(h => h.style.display = 'flex');
  } else if (mode === 'map') {
    if (mainImg) mainImg.src = 'images/hero-bg.png';
    if (badgeText) badgeText.innerText = 'Town Planning Vector Map (Gandhidham & Adipur)';
    hotspots.forEach(h => h.style.display = 'none');
  } else if (mode === 'satellite') {
    if (mainImg) mainImg.src = 'images/commercial-plot.jpg';
    if (badgeText) badgeText.innerText = 'High-Resolution Satellite Survey';
    hotspots.forEach(h => h.style.display = 'flex');
  }
};

window.zoomSpatialView = function(factor) {
  const mainImg = document.getElementById('spatialMainImg');
  if (!mainImg) return;
  currentSpatialScale = Math.min(Math.max(currentSpatialScale * factor, 0.9), 1.8);
  mainImg.style.transform = `scale(${currentSpatialScale})`;
};

window.resetSpatialView = function() {
  const mainImg = document.getElementById('spatialMainImg');
  if (!mainImg) return;
  currentSpatialScale = 1;
  mainImg.style.transform = `scale(1)`;
};

window.rotateSpatialCompass = function() {
  const compass = document.querySelector('.compass-dial');
  if (!compass) return;
  currentCompassAngle += 90;
  compass.style.transform = `rotate(${currentCompassAngle}deg)`;
};

/* ==========================================================================
   SHREEJI OFFICIAL CINEMA THEATER & AMBIENT MUSIC ENGINE
   ========================================================================== */

const SHREEJI_VIDEOS = [
  {
    src: 'videos/shreeji-corporate-highrise.mp4',
    poster: 'images/commercial-tower.jpg',
    badge: 'Swastik by Shreeji Infotech Verified Asset • Gandhidham Corporate Highrise',
    headline: 'Swastik Corporate Highrise & Executive Plaza',
    desc: 'Live aerial footage of prime commercial towers and Grade-A office suites along Tagore Road, Gandhidham. Exclusive Swastik by Shreeji Infotech listing with direct developer advisory.'
  },
  {
    src: 'videos/shreeji-retail-showroom.mp4',
    poster: 'images/retail-showroom.jpg',
    badge: 'Swastik Commercial Showroom • Station Road, Adipur',
    headline: 'Swastik Corner Retail Showroom & Market Hub',
    desc: 'High-footfall double-height showroom with 35-ft glass frontage opposite central commercial hub in Adipur. Directly listed by Swastik by Shreeji Infotech.'
  },
  {
    src: 'videos/shreeji-logistics-warehouse.mp4',
    poster: 'images/industrial-logistics.jpg',
    badge: 'Swastik Industrial Portfolio • Kandla Port Corridor',
    headline: 'Swastik PEB Logistics Warehouse Park',
    desc: 'Heavy-duty 25,000 sq.ft engineered warehouse with automated dock levelers and container trailer aprons near Kandla Port. Certified title-clear Swastik by Shreeji Infotech listing.'
  }
];

let activeVideoIndex = 0;
let isBgmPlaying = false;

window.shreejiSelectVideo = function(index) {
  if (index < 0 || index >= SHREEJI_VIDEOS.length) return;
  activeVideoIndex = index;
  const vidData = SHREEJI_VIDEOS[index];
  const videoEl = document.getElementById('spotlightVideo');
  const headlineEl = document.getElementById('cinemaActiveHeadline');
  const badgeEl = document.getElementById('cinemaLiveBadgeText');
  const descEl = document.getElementById('cinemaActiveDesc');
  const theaterBox = document.getElementById('cinemaTheaterBox');

  document.querySelectorAll('.video-card-item').forEach((card, i) => {
    card.classList.toggle('active', i === index);
  });

  if (headlineEl) headlineEl.textContent = vidData.headline;
  if (badgeEl) badgeEl.textContent = vidData.badge;
  if (descEl) descEl.textContent = vidData.desc;

  if (videoEl) {
    videoEl.pause();
    videoEl.poster = vidData.poster;
    videoEl.src = vidData.src;
    videoEl.load();
    const playPromise = videoEl.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        theaterBox?.classList.add('is-playing');
        updatePlayIcons(true);
      }).catch(() => {
        videoEl.muted = true;
        videoEl.play().then(() => {
          theaterBox?.classList.add('is-playing');
          updatePlayIcons(true);
        }).catch(() => {
          updatePlayIcons(false);
        });
      });
    }
  }
};

window.shreejiToggleVideoPlayback = function() {
  const videoEl = document.getElementById('spotlightVideo');
  const theaterBox = document.getElementById('cinemaTheaterBox');
  if (!videoEl) return;

  if (videoEl.paused) {
    videoEl.play().then(() => {
      theaterBox?.classList.add('is-playing');
      updatePlayIcons(true);
    }).catch(() => {
      updatePlayIcons(false);
    });
  } else {
    videoEl.pause();
    theaterBox?.classList.remove('is-playing');
    updatePlayIcons(false);
  }
};

function updatePlayIcons(isPlaying) {
  const playTri = document.getElementById('iconPlayTriangle');
  const pauseBars = document.getElementById('iconPauseBars');
  if (playTri) playTri.style.display = isPlaying ? 'none' : 'block';
  if (pauseBars) pauseBars.style.display = isPlaying ? 'block' : 'none';
}

window.shreejiToggleVideoAudio = function() {
  const videoEl = document.getElementById('spotlightVideo');
  const btnSound = document.getElementById('btnVideoSound');
  const iconMuted = document.getElementById('iconSoundMuted');
  const iconActive = document.getElementById('iconSoundActive');
  const lblSound = document.getElementById('lblSoundStatus');

  if (!videoEl) return;
  videoEl.muted = !videoEl.muted;

  if (videoEl.muted) {
    btnSound?.classList.remove('unmuted');
    if (iconMuted) iconMuted.style.display = 'inline-block';
    if (iconActive) iconActive.style.display = 'none';
    if (lblSound) lblSound.textContent = 'Unmute Video';
  } else {
    btnSound?.classList.add('unmuted');
    if (iconMuted) iconMuted.style.display = 'none';
    if (iconActive) iconActive.style.display = 'inline-block';
    if (lblSound) lblSound.textContent = 'Video Audio ON';
  }
};

window.shreejiToggleBgm = function(forceState) {
  const audio = document.getElementById('cinemaBgmAudio');
  const btnBgm = document.getElementById('btnBgmMusic');
  const lblBgm = document.getElementById('lblBgmStatus');
  if (!audio) return;

  const targetPlay = typeof forceState === 'boolean' ? forceState : !isBgmPlaying;

  if (targetPlay) {
    audio.volume = 0.55;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        isBgmPlaying = true;
        btnBgm?.classList.add('playing');
        if (lblBgm) lblBgm.textContent = 'Cinematic Music: ON ♪';
      }).catch(() => {
        isBgmPlaying = false;
        btnBgm?.classList.remove('playing');
        if (lblBgm) lblBgm.textContent = 'Cinematic Music: Tap to Play';
      });
    }
  } else {
    audio.pause();
    isBgmPlaying = false;
    btnBgm?.classList.remove('playing');
    if (lblBgm) lblBgm.textContent = 'Cinematic Music: OFF';
  }
};

// Automatic sequential video loop & unlock gesture
document.addEventListener('DOMContentLoaded', () => {
  const videoEl = document.getElementById('spotlightVideo');
  if (videoEl) {
    // When video ends, automatically advance to next video in continuous loop!
    videoEl.addEventListener('ended', () => {
      const nextIndex = (activeVideoIndex + 1) % SHREEJI_VIDEOS.length;
      window.shreejiSelectVideo(nextIndex);
    });

    // Auto-play muted on load
    videoEl.play().catch(() => {});
  }

  // Gracefully attempt cinematic audio unlock on first user click or interaction
  const unlockAudioOnGesture = () => {
    const audio = document.getElementById('cinemaBgmAudio');
    if (audio && !isBgmPlaying) {
      audio.volume = 0.55;
      audio.play().then(() => {
        isBgmPlaying = true;
        document.getElementById('btnBgmMusic')?.classList.add('playing');
        const lbl = document.getElementById('lblBgmStatus');
        if (lbl) lbl.textContent = 'Cinematic Music: ON ♪';
      }).catch(() => {});
    }
    ['click', 'touchstart', 'scroll'].forEach(evt => {
      window.removeEventListener(evt, unlockAudioOnGesture);
    });
  };

  ['click', 'touchstart', 'scroll'].forEach(evt => {
    window.addEventListener(evt, unlockAudioOnGesture, { passive: true, once: true });
  });
});

/* ==========================================================================
   AUTO-NEXT IN LOOP PHOTO CAROUSEL / SLIDESHOW ENGINE
   ========================================================================== */

let currentSlideIndex = 0;
const totalSlides = 4;
let slideInterval = null;

window.goToSlide = function(index) {
  currentSlideIndex = (index + totalSlides) % totalSlides;
  const wrap = document.getElementById('carouselSlidesWrap');
  const dots = document.querySelectorAll('#carouselIndicators .indicator-dot');
  
  if (wrap) {
    wrap.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
  }
  
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === currentSlideIndex);
  });
};

window.nextSlide = function() {
  window.goToSlide(currentSlideIndex + 1);
};

window.prevSlide = function() {
  window.goToSlide(currentSlideIndex - 1);
};

window.startAutoSlideshow = function() {
  if (slideInterval) clearInterval(slideInterval);
  slideInterval = setInterval(() => {
    window.nextSlide();
  }, 4000); // Auto-advance every 4 seconds in continuous loop!
};

window.pauseAutoSlideshow = function() {
  if (slideInterval) clearInterval(slideInterval);
};

window.resumeAutoSlideshow = function() {
  window.startAutoSlideshow();
};

document.addEventListener('DOMContentLoaded', () => {
  window.startAutoSlideshow();
});

/* ==========================================================================
   CINEMATIC 3D MAP PORTAL ENGINE (REGAL FARMS)
   ========================================================================== */

let portalActiveTargetUrl = 'https://regalfarms.vercel.app/';
let portalAnimationTimer = null;
let portalStepInterval = null;

function playSpatialChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.16);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.32);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.43);
  } catch (err) {
    // Autoplay restrictions fallback
  }
}

window.launch3DMapPortal = function(url = 'https://regalfarms.vercel.app/') {
  portalActiveTargetUrl = 'https://regalfarms.vercel.app/';
  const overlay = document.getElementById('spatialPortalOverlay');
  const core = document.getElementById('portalCoreWrapper');
  const fill = document.getElementById('portalProgressFill');
  const percent = document.getElementById('portalProgressPercent');
  const headline = document.getElementById('portalHeadline');
  const statusMsg = document.getElementById('portalStatusMsg');
  const targetBadge = document.querySelector('.portal-badge-target');

  // Close mobile nav if open
  const navLinks = document.getElementById('navLinks');
  if (navLinks && navLinks.classList.contains('active')) {
    navLinks.classList.remove('active');
  }

  if (!overlay) {
    window.location.href = 'https://regalfarms.vercel.app/';
    return;
  }

  // Update target badge
  if (targetBadge) {
    targetBadge.innerHTML = '<i class="fa-solid fa-compass"></i> TARGET: REGAL FARMS 3D SPATIAL TWIN';
  }

  // Reset animations
  if (core) core.classList.remove('warping');
  if (fill) fill.style.width = '0%';
  if (percent) percent.textContent = '0%';
  if (headline) headline.textContent = 'CALIBRATING 3D SATELLITE ENGINE';
  if (statusMsg) statusMsg.textContent = 'Initializing AutoCAD vector parcels & 3D WebGL engine...';

  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden', 'false');
  playSpatialChime();

  const steps = [
    { progress: 28, status: 'Connecting to Mapbox Satellite 3D Basemap...', time: 260 },
    { progress: 62, status: 'Streaming AutoCAD Vector Parcels & 3D Extrusion Mesh...', time: 580 },
    { progress: 88, status: 'Syncing Real-Time Inventory (Available, Sold, Builder)...', time: 880 },
    { progress: 100, status: 'Entering 3D Digital Twin...', time: 1120 }
  ];

  let currentStep = 0;
  clearInterval(portalStepInterval);
  clearTimeout(portalAnimationTimer);

  portalStepInterval = setInterval(() => {
    if (currentStep < steps.length) {
      const step = steps[currentStep];
      if (fill) fill.style.width = `${step.progress}%`;
      if (percent) percent.textContent = `${step.progress}%`;
      if (statusMsg) statusMsg.textContent = step.status;

      if (step.progress === 100) {
        if (headline) headline.innerHTML = 'PORTAL ALIGNED &bull; WARPING';
        if (core) core.classList.add('warping');

        // Automatically open Regal Farms site when reaching 100%
        clearInterval(portalStepInterval);
        portalAnimationTimer = setTimeout(() => {
          window.executePortalRedirect('https://regalfarms.vercel.app/');
        }, 300);
        return;
      }
      currentStep++;
    } else {
      clearInterval(portalStepInterval);
    }
  }, 280);
};

window.executePortalRedirect = function(targetOverride) {
  clearTimeout(portalAnimationTimer);
  clearInterval(portalStepInterval);
  const target = 'https://regalfarms.vercel.app/';
  window.location.href = target;
};

window.closePortalOverlay = function() {
  clearTimeout(portalAnimationTimer);
  clearInterval(portalStepInterval);
  const overlay = document.getElementById('spatialPortalOverlay');
  const core = document.getElementById('portalCoreWrapper');
  if (overlay) {
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
  }
  if (core) core.classList.remove('warping');
};

// Wire up global nav map links
document.addEventListener('DOMContentLoaded', () => {
  const mapLinks = document.querySelectorAll('#navMapLink, .nav-map-trigger, a[href*="3d-map"], a[href*="regalfarms.vercel.app"]');
  mapLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      // Don't intercept if ctrl/cmd key or middle click is used (allow new tab)
      if (e.metaKey || e.ctrlKey || e.button === 1) return;
      e.preventDefault();
      window.launch3DMapPortal('https://regalfarms.vercel.app/');
    });
  });
});

// Dynamic Category Filtering for Kutch Infrastructure Corridors
window.filterCorridors = function(category, btnEl) {
  const pills = document.querySelectorAll('.corridor-filter-pill');
  pills.forEach(p => p.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');

  const cards = document.querySelectorAll('.corridor-card');
  cards.forEach(card => {
    const cardCat = card.getAttribute('data-category');
    if (category === 'all' || cardCat === category) {
      card.classList.remove('hidden');
    } else {
      card.classList.add('hidden');
    }
  });
};

/* ==========================================================================
   3D PERSPECTIVE TUNNEL ENGINE (SHREEJI SPATIAL WARP)
   Matches Framer-Motion Golden-Angle 3D Z-Space Corridor
   ========================================================================== */

const SHREEJI_TUNNEL_DATA = [
  { 
    title: "Luxury Commercial Villa & Pavilion", 
    tag: "Prime Estate Development",
    src: "images/hero-luxury-estate.jpg",
    action: () => openModalWithDetails('Luxury Commercial Villa & Pavilion', 'Survey 374, Gandhidham & Adipur', 'Available for Lease & Investment')
  },
  { 
    title: "Gandhidham–Adipur Twin City Axis", 
    tag: "Commercial Core & Metro Corridor",
    src: "images/Gandhidham Adipur Golden-Hour Cityscape.png",
    action: () => openModalWithDetails('Gandhidham-Adipur Commercial Axis', 'Sectors 1-12 & Wards 1A-5B', 'Commercial Lease & Sale')
  },
  { 
    title: "Kandla Major Port Terminal", 
    tag: "Deendayal Port Authority CFS",
    src: "images/Golden Hour at Kandla Port.png",
    action: () => openModalWithDetails('Kandla Port Logistics Hub', 'Deendayal Port Corridor, Kandla', 'Logistics & Warehousing')
  },
  { 
    title: "Mega Container Logistics Zone", 
    tag: "Intermodal Supply Chain Gateway",
    src: "images/Panoramic Container Port at Sunset.png",
    action: () => openModalWithDetails('Mega Container Freight Zone', 'Kutch Maritime Corridor', 'Industrial / Freight')
  },
  { 
    title: "Mundra–Anjar Heavy Industrial SEZ", 
    tag: "Private Port & Multi-Product SEZ",
    src: "images/Mundra-Anjar Industrial Port at Sunset.png",
    action: () => openModalWithDetails('Mundra-Anjar Industrial Belt', 'Mundra-Anjar Highway', 'Industrial Plots & Warehousing')
  },
  { 
    title: "NH-41 Dedicated Freight Expressway", 
    tag: "Multi-Lane National Logistics Arterial",
    src: "images/Golden Highway to the Horizon.png",
    action: () => openModalWithDetails('NH-41 Highway Logistics Frontage', 'National Highway 41 Corridor', 'Highway Commercial Land')
  },
  { 
    title: "Bhuj–Gandhidham Rail Freight Line", 
    tag: "Electrified Broad-Gauge Trunk",
    src: "images/Sunset Express Beside Bhuj Sign.png",
    action: () => openModalWithDetails('Bhuj-Gandhidham Rail Corridor Properties', 'Railway Junction Corridor', 'Industrial & Commercial')
  },
  { 
    title: "Khavda 30GW Hybrid Renewable Park", 
    tag: "Clean Solar-Wind Mega Energy Belt",
    src: "images/Solar Panels and Wind Turbines at Sunset.png",
    action: () => openModalWithDetails('Khavda Renewable Energy Zone', 'Khavda Mega Park, Kutch', 'Green Energy Industrial Land')
  },
  { 
    title: "Smart Kutch Next-Gen Business Hub", 
    tag: "Grade-A Corporate Architecture",
    src: "images/Kutch Future-Ready Urban Vision.png",
    action: () => openModalWithDetails('Smart Kutch Commercial Center', 'Tagore Road Ext., Gandhidham', 'Corporate Floors')
  },
  { 
    title: "Bhuj Heritage & District Civic Hub", 
    tag: "District Capital Commercial Zone",
    src: "images/Golden-Hour Panorama of Bhuj and Fort.png",
    action: () => openModalWithDetails('Bhuj Administrative Epicenter Land', 'Bhuj Hub, Kutch', 'Prime Land & Commercial')
  },
  { 
    title: "Mandvi Coastal Tourism & Resort Strip", 
    tag: "Arabian Sea Luxury Hospitality",
    src: "images/Mandvi Sunset Beach and Heritage Pier.png",
    action: () => openModalWithDetails('Mandvi Coastal Tourism Land', 'Mandvi Beach Road', 'Hospitality & Resort Land')
  }
];

class PerspectiveTunnelEngine {
  constructor() {
    this.container = document.getElementById('tunnelContainer');
    this.stage = document.getElementById('tunnelCardsStage');
    this.anchor = document.getElementById('tunnelAnchorText');

    if (!this.container || !this.stage) return;

    // Automatic continuous animation state
    this.autoProgress = 0;
    this.baseSpeed = 0.00075; // Cinematic flight speed
    this.currentSpeed = 0.00075;
    this.isHovered = false;

    this.rawPointerX = 0;
    this.rawPointerY = 0;
    this.pointerX = 0;
    this.pointerY = 0;

    this.stageWidth = window.innerWidth;
    this.stageHeight = window.innerHeight;
    this.isMobile = window.innerWidth < 768;

    this.cards = [];
    this.lastTime = performance.now();

    this.initCards();
    this.initEvents();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initCards() {
    this.stage.innerHTML = '';
    const total = SHREEJI_TUNNEL_DATA.length;

    this.cards = SHREEJI_TUNNEL_DATA.map((item, i) => {
      const goldenAngle = i * 137.5 * (Math.PI / 180);
      const radiusFactorX = 0.28 + (i % 3) * 0.08;
      const radiusFactorY = 0.26 + (i % 2) * 0.09;
      const rotationZ = (i % 2 === 0 ? 1 : -1) * (3 + (i % 5) * 2);

      const cardEl = document.createElement('div');
      cardEl.className = 'tunnel-card';
      cardEl.innerHTML = `
        <img src="${item.src}" alt="${item.title}" class="tunnel-card-img" draggable="false" loading="lazy">
        <div class="tunnel-card-overlay">
          <span class="tunnel-card-tag">${item.tag}</span>
          <span class="tunnel-card-title">${item.title}</span>
        </div>
      `;

      cardEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof item.action === 'function') {
          item.action();
        }
      });

      this.stage.appendChild(cardEl);

      return {
        el: cardEl,
        item,
        angleCos: Math.cos(goldenAngle),
        angleSin: Math.sin(goldenAngle),
        radiusFactorX,
        radiusFactorY,
        rotationZ,
        index: i,
        total
      };
    });
  }

  initEvents() {
    window.addEventListener('resize', () => {
      this.stageWidth = this.container.clientWidth || window.innerWidth;
      this.stageHeight = this.container.clientHeight || window.innerHeight;
      this.isMobile = window.innerWidth < 768;
    });

    // Pointer move camera parallax tilt
    window.addEventListener('pointermove', (e) => {
      this.rawPointerX = (e.clientX / window.innerWidth - 0.5) * 2;
      this.rawPointerY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    // Smooth hover deceleration so user can easily inspect and click on any flying card
    this.container.addEventListener('mouseenter', () => {
      this.isHovered = true;
    });

    this.container.addEventListener('mouseleave', () => {
      this.isHovered = false;
      this.rawPointerX = 0;
      this.rawPointerY = 0;
    });

    // Gentle scroll assist (does not block native page scrolling)
    this.container.addEventListener('wheel', (e) => {
      this.autoProgress = (this.autoProgress + e.deltaY * 0.0003) % 1;
      if (this.autoProgress < 0) this.autoProgress += 1;
    }, { passive: true });
  }

  animate(now = performance.now()) {
    const dt = Math.min(50, Math.max(1, now - this.lastTime));
    this.lastTime = now;

    // Smooth speed transition on hover
    const targetSpeed = this.isHovered ? 0.00018 : this.baseSpeed;
    this.currentSpeed += (targetSpeed - this.currentSpeed) * 0.08;

    // Advance continuous depth progress seamlessly
    this.autoProgress = (this.autoProgress + this.currentSpeed * (dt / 16.67)) % 1;
    if (this.autoProgress < 0) this.autoProgress += 1;

    // Smooth pointer parallax easing
    this.pointerX += (this.rawPointerX - this.pointerX) * 0.08;
    this.pointerY += (this.rawPointerY - this.pointerY) * 0.08;

    const stageWidth = this.stageWidth;
    const stageHeight = this.stageHeight;
    const isMobile = this.isMobile;

    const farZ = isMobile ? -1400 : -1900;
    const nearZ = isMobile ? 380 : 540;
    const panStrength = isMobile ? 24 : 48;

    const cardWidth = isMobile
      ? Math.max(130, Math.min(180, stageWidth * 0.38))
      : Math.max(180, Math.min(270, stageWidth * 0.18));

    const total = this.cards.length;

    // Distribute all cards along the infinite looping corridor
    for (let i = 0; i < total; i++) {
      const card = this.cards[i];

      // Normalized depth progress for this card [0, 1)
      let cardProgress = (this.autoProgress + (i / total)) % 1;
      if (cardProgress < 0) cardProgress += 1;

      // Z-depth interpolation
      const z = farZ + cardProgress * (nearZ - farZ);

      // Opacity envelope for seamless looping:
      // Emerges at farZ (0 -> 1 over 0.16)
      // Fully visible mid-flight (1.0 between 0.16 and 0.82)
      // Glides smoothly past camera (1 -> 0 between 0.82 and 0.98)
      // Completely invisible at wrap boundary (0 between 0.98 and 1.0)
      let opacity = 0;
      if (cardProgress < 0.16) {
        opacity = cardProgress / 0.16;
      } else if (cardProgress <= 0.82) {
        opacity = 1;
      } else if (cardProgress <= 0.98) {
        opacity = 1 - (cardProgress - 0.82) / (0.98 - 0.82);
      } else {
        opacity = 0;
      }

      // Golden-angle spiral radial coordinates
      const baseX = card.angleCos * (stageWidth * card.radiusFactorX);
      const baseY = card.angleSin * (stageHeight * card.radiusFactorY);

      const offsetX = baseX - this.pointerX * panStrength;
      const offsetY = baseY - this.pointerY * panStrength;

      const rotZ = card.rotationZ * (1 - cardProgress * 0.3);

      card.el.style.width = `${Math.round(cardWidth)}px`;
      card.el.style.transform = `translate3d(calc(-50% + ${offsetX.toFixed(1)}px), calc(-50% + ${offsetY.toFixed(1)}px), ${z.toFixed(1)}px) rotateZ(${rotZ.toFixed(1)}deg)`;
      card.el.style.opacity = opacity.toFixed(3);
      card.el.style.zIndex = Math.round(cardProgress * 100);
      card.el.style.pointerEvents = opacity > 0.4 ? 'auto' : 'none';
    }

    // Anchor title remains elegantly centered in the corridor
    if (this.anchor) {
      this.anchor.style.opacity = '1';
      this.anchor.style.transform = 'scale(1)';
    }

    requestAnimationFrame(this.animate);
  }
}

let tunnelEngineInstance = null;

window.stepTunnelProgress = function() {};

document.addEventListener('DOMContentLoaded', () => {
  tunnelEngineInstance = new PerspectiveTunnelEngine();
});




