/* ==========================================================================
   Shreeji Real Estate - Interactive JavaScript
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Sticky Header & Mobile Menu
  const header = document.getElementById('header');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.getElementById('navLinks');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const icon = mobileMenuBtn.querySelector('i');
      if (icon) {
        if (navLinks.classList.contains('active')) {
          icon.className = 'fa-solid fa-xmark';
        } else {
          icon.className = 'fa-solid fa-bars';
        }
      }
    });

    document.querySelectorAll('.nav-link:not(.dropdown-toggle)').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        const icon = mobileMenuBtn.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-bars';
      });
    });
  }

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
      sellTab.classList.add('active');
      buyTab.classList.remove('active');
      sellerForm.style.display = 'grid';
      buyerForm.style.display = 'none';
      modalTitle.innerText = 'Looking to Sell Land in Kutch?';
      modalSub.innerText = 'Get a free valuation and connect with serious commercial buyers.';
    } else {
      buyTab.classList.add('active');
      sellTab.classList.remove('active');
      buyerForm.style.display = 'grid';
      sellerForm.style.display = 'none';
      modalTitle.innerText = 'Looking to Buy Land in Kutch?';
      modalSub.innerText = 'Access verified GIDC, NA, and Port-adjacent commercial plots.';
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

  // Backend Server Integration Helper (http://localhost:5000/api/v1/inquiries)
  const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api/v1'
    : 'https://founder-svg.github.io/Shreeji/api/v1';

  async function postInquiryToServer(payload) {
    try {
      const res = await fetch(`${API_BASE}/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Platform': 'web'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log('✅ Inquiry synced with backend server:', data);
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

  // 9. Language Switcher (EN, GUJ, HI)
  const langBtns = document.querySelectorAll('.lang-btn');

  const dictionary = {
    en: {
      nav_home: 'Home',
      nav_overview: 'Overview',
      nav_target_areas: 'Target Areas',
      nav_services: 'Services',
      nav_process: 'Process',
      nav_faq: 'FAQ',
      nav_contact: 'Contact Us',
      hero_badge: '<i class="fa-solid fa-building"></i> Premier Commercial Rental & Property Leasing',
      hero_title: 'Your Premier Partner for <span>Rental Commercial Properties</span> in Gandhidham & Adipur',
      hero_sub: 'Expert guidance for renting, leasing, buying, and listing commercial shops, corporate offices, showrooms, and commercial plots across Gandhidham & Adipur, Gujarat.',
      buy_btn: '<i class="fa-solid fa-magnifying-glass-location"></i> Looking for Rental Commercial Space?',
      sell_btn: '<i class="fa-solid fa-key"></i> Rent Out / List Your Property',
      stat_exp_val: '10+ Years',
      stat_exp_lbl: 'Commercial Experience',
      stat_leased_val: '250+ Spaces',
      stat_leased_lbl: 'Commercial Leased',
      stat_clients_val: '100+ Clients',
      stat_clients_lbl: 'Satisfied Businesses',
      overview_shops_title: 'Rental Shops & Showrooms',
      overview_shops_desc: 'High-footfall retail spaces and market showrooms in Gandhidham & Adipur.',
      overview_offices_title: 'Corporate Office Spaces',
      overview_offices_desc: 'Furnished and bare-shell office suites in commercial business complexes.',
      overview_legal_title: 'Verified Lease & Title',
      overview_legal_desc: '100% legally clear lease agreements, revenue validation, and hassle-free documentation.',
      story_tag: 'Who We Are',
      story_headline: 'Shreeji Real Estate Consultancy',
      story_paragraph: 'Shreeji Real Estate is your dedicated commercial property & rental consultancy headquartered in Gandhidham, Kutch, Gujarat. With 10+ years of local market leadership, we connect business owners, retail brands, and corporate tenants with top commercial rental spaces, offices, and plots in Gandhidham and Adipur.',
      areas_tag: 'Target Areas & Sector Maps',
      areas_title: 'Gandhidham & Adipur Sector Maps',
      areas_desc: 'Click below to open and view the official Master Plan PDF for Gandhidham and Adipur.',
      gandhidham_desc: 'Click to view the official Gandhidham Master Plan PDF with Tagore Road, Sector layouts, and commercial market zones.',
      adipur_desc: 'Click to view the official Adipur Master Plan PDF with Station Road commercial plot grid and retail market maps.',
      open_pdf_btn: 'Open Master Plan PDF ↗',
      listings_tag: 'Verified Opportunities',
      listings_title: 'Available Land & Property Listings',
      listings_subtitle: 'Real-time verified commercial shops, offices, and plots in Gandhidham & Adipur.',
      citymaps_tag: 'City Planning & Sector Maps',
      citymaps_title: 'Gandhidham & Adipur Commercial Maps (PDF)',
      citymaps_subtitle: 'Download and view official town planning maps, sector layouts, and commercial market zones.',
      gandhidham_map_title: 'Gandhidham Commercial Master Map',
      adipur_map_title: 'Adipur Commercial Market Map',
      services_tag: 'Commercial Solutions',
      services_title: 'Our Commercial Real Estate Services',
      services_subtitle: 'Tailored services designed for commercial space tenants, property owners, and business investors in Gandhidham & Adipur.',
      tenant_title: 'For Commercial Tenants',
      tenant_desc: 'Finding high-performing retail shops, office suites, and commercial spaces on rent.',
      landlord_title: 'For Commercial Landlords',
      landlord_desc: 'Rent out your commercial shops, offices, or plots to corporate tenants with high rental yields.',
      legal_title: 'Lease & Legal Compliance',
      legal_desc: 'Navigating commercial municipal registrations, 11-month lease deeds, and property verification.',
      process_tag: 'Structured Execution',
      process_title: 'Our 5-Step Leasing & Buying Process',
      process_subtitle: 'A seamless journey from site selection to contract registration and move-in execution.',
      step1_title: '1. Requirement Audit',
      step1_desc: 'Defining budget, footfall requirements, and layout space.',
      step2_title: '2. Site Shortlisting',
      step2_desc: 'Inspecting verified commercial shops & offices in Gandhidham & Adipur.',
      step3_title: '3. Rent Negotiation',
      step3_desc: 'Securing competitive lease rates and flexible security deposits.',
      step4_title: '4. Legal Verification',
      step4_desc: 'Title check, tax compliance, and 11-month Lease Deed registration.',
      step5_title: '5. Handover & Move-In',
      step5_desc: 'Key handover and utility setup support for immediate business operations.',
      faq_tag: 'Clarifications',
      faq_title: 'Commercial Property FAQ',
      faq_subtitle: 'Frequently asked questions regarding commercial renting, lease terms, and documentation in Gandhidham & Adipur.',
      faq_q1: 'What types of commercial rental properties do you offer in Gandhidham & Adipur?',
      faq_a1: 'We specialize in high-footfall retail market shops, fully furnished & bare-shell corporate office space, high-visibility main market showrooms, and roadside commercial lease plots across Tagore Road, Main Market, Sector 1-12 in Gandhidham, and Station Road in Adipur.',
      faq_q2: 'What is the standard lease deed duration and rental agreement process in Gandhidham?',
      faq_a2: 'Commercial properties in Gandhidham & Adipur are typically leased under 11-month registered lease agreements or long-term 3-to-9 year corporate lease deeds with renewable escalation terms.',
      faq_q3: 'How do you assist commercial tenants and landlords with legal due diligence?',
      faq_a3: 'We handle 100% of title verification, property ownership checks, municipal tax clearance, tenant background verification, and formal registered lease deed drafting for smooth operations.',
      faq_q4: 'What are the typical security deposit and brokerage terms for renting commercial spaces?',
      faq_a4: 'Security deposits usually range from 3 to 6 months of rent depending on the location and property type, with flexible rent negotiation and transparent fee structures for both tenants and landlords.',
      target_hero_badge: '<i class="fa-solid fa-map-location-dot"></i> Land Record Search',
      target_hero_title: 'Target Areas & <span>Land Record Search</span>',
      target_hero_sub: 'Step-by-step cascading land record search across Kutch District (Gujarat AnyRoR Model). Select a Taluka to unlock village and sector property filters.'
    },
    guj: {
      nav_home: 'હોમ',
      nav_overview: 'ઝાંખી',
      nav_target_areas: 'લક્ષ્ય વિસ્તારો',
      nav_services: 'સેવાઓ',
      nav_process: 'પ્રક્રિયા',
      nav_faq: 'પ્રશ્નોત્તરી',
      nav_contact: 'સંપર્ક કરો',
      hero_badge: '<i class="fa-solid fa-building"></i> પ્રીમિયર કોમર્શિયલ રેન્ટલ અને પ્રોપર્ટી લીઝિંગ',
      hero_title: 'ગાંધીધામ અને આદિપુરમાં <span>કોમર્શિયલ પ્રોપર્ટી ભાડે આપવા અને લેવા</span> માટે વિશ્વાસપાત્ર પાર્ટનર',
      hero_sub: 'ગાંધીધામ અને આદિપુરમાં તમામ કોમર્શિયલ દુકાનો, કોર્પોરેટ ઓફિસો, શોરૂમ અને કોમર્શિયલ પ્લોટ ભાડે લેવા-આપવા માટે નિષ્ણાત માર્ગદર્શન.',
      buy_btn: '<i class="fa-solid fa-magnifying-glass-location"></i> કોમર્શિયલ જગ્યા ભાડે જોઈએ છે?',
      sell_btn: '<i class="fa-solid fa-key"></i> તમારી પ્રોપર્ટી ભાડે મૂકો / યાદી કરો',
      stat_exp_val: '૧૦+ વર્ષ',
      stat_exp_lbl: 'કોમર્શિયલ અનુભવ',
      stat_leased_val: '૨૫૦+ જગ્યાઓ',
      stat_leased_lbl: 'લીઝ પર આપેલી પ્રોપર્ટી',
      stat_clients_val: '૧૦૦+ ગ્રાહકો',
      stat_clients_lbl: 'સંતુષ્ટ વ્યવસાયો',
      overview_shops_title: 'ભાડાની દુકાનો અને શોરૂમ',
      overview_shops_desc: 'ગાંધીધામ અને આદિપુરના મુખ્ય બજારોમાં વધુ ગ્રાહકો ધરાવતી જગ્યાઓ.',
      overview_offices_title: 'કોર્પોરેટ ઓફિસ સ્પેસ',
      overview_offices_desc: 'વ્યાપારી સંકુલમાં સુસજ્જ અને ખુલ્લી ઓફિસો.',
      overview_legal_title: 'ચકાસાયેલ લીઝ અને દસ્તાવેજ',
      overview_legal_desc: '૧૦૦% કાયદાકીય રીતે સ્પષ્ટ લીઝ કરાર અને સરળ દસ્તાવેજીકરણ.',
      story_tag: 'અમારા વિશે',
      story_headline: 'શ્રીજી રિયલ એસ્ટેટ કન્સલ્ટન્સી',
      story_paragraph: 'શ્રીજી રિયલ એસ્ટેટ ગાંધીધામ, કચ્છમાં મુખ્ય મથક ધરાવતી તમારી સમર્પિત કોમર્શિયલ પ્રોપર્ટી અને રેન્ટલ કન્સલ્ટન્સી છે. ૧૦+ વર્ષથી વધુના સ્થાનિક અનુભવ સાથે, અમે વેપારીઓ, રિટેલ બ્રાન્ડ્સ અને કોર્પોરેટ ભાડૂઆતોને ગાંધીધામ અને આદિપુરમાં ઉત્કૃષ્ટ ભાડાની જગ્યાઓ પૂરી પાડીએ છીએ.',
      areas_tag: 'લક્ષ્ય વિસ્તારો અને સેક્ટર નકશા',
      areas_title: 'ગાંધીધામ અને આદિપુર સેક્ટર નકશા',
      areas_desc: 'ગાંધીધામ અને આદિપુર માટે સત્તાવાર માસ્ટર પ્લાન પીડીએફ જોવા માટે નીચે ક્લિક કરો.',
      gandhidham_desc: 'ટાગોર રોડ, સેક્ટર લેઆઉટ અને વ્યાપારી વિસ્તારો સાથે સત્તાવાર ગાંધીધામ માસ્ટર પ્લાન પીડીએફ જોવા માટે ક્લિક કરો.',
      adipur_desc: 'સ્ટેશન રોડ કોમર્શિયલ પ્લોટ ગ્રીડ અને માર્કેટ નકશા સાથે સત્તાવાર આદિપુર પીડીએફ જોવા માટે ક્લિક કરો.',
      open_pdf_btn: 'માસ્ટર પ્લાન પીડીએફ ખોલો ↗',
      listings_tag: 'ચકાસાયેલ તકો',
      listings_title: 'ઉપલબ્ધ ભાડાની પ્રોપર્ટી યાદીઓ',
      listings_subtitle: 'ગાંધીધામ અને આદિપુરમાં ઉપલબ્ધ ચકાસાયેલ દુકાનો, ઓફિસો અને પ્લોટ.',
      citymaps_tag: 'સિટી પ્લાનિંગ અને સેક્ટર નકશા',
      citymaps_title: 'ગાંધીધામ અને આદિપુર કોમર્શિયલ નકશા (PDF)',
      citymaps_subtitle: 'સત્તાવાર નગર યોજના નકશા, સેક્ટર લેઆઉટ અને વ્યાપારી વિસ્તારો ડાઉનલોડ કરો.',
      gandhidham_map_title: 'ગાંધીધામ કોમર્શિયલ માસ્ટર મેપ',
      adipur_map_title: 'આદિપુર કોમર્શિયલ માર્કેટ મેપ',
      services_tag: 'કોમર્શિયલ સોલ્યુશન્સ',
      services_title: 'અમારી કોમર્શિયલ રિયલ એસ્ટેટ સેવાઓ',
      services_subtitle: 'ગાંધીધામ અને આદિપુરમાં વ્યાપારી ભાડૂઆતો, માલિકો અને રોકાણકારો માટે વિશિષ્ટ સેવાઓ.',
      tenant_title: 'વ્યાપારી ભાડૂઆતો માટે',
      tenant_desc: 'ભાડેથી ઉત્કૃષ્ટ રિટેલ દુકાનો, ઓફિસો અને જગ્યાઓ શોધવી.',
      landlord_title: 'કોમર્શિયલ માલિકો માટે',
      landlord_desc: 'તમારી દુકાનો, ઓફિસો અથવા પ્લોટ કોર્પોરેટ ભાડૂઆતોને ભાડે આપો.',
      legal_title: 'લીઝ અને કાનૂની સલાહ',
      legal_desc: '૧૧ મહિનાના લીઝ ડીડ્સ, મ્યુનિસિપલ રજીસ્ટ્રેશન અને મિલકત ચકાસણી.',
      process_tag: 'સુવ્યવસ્થિત પ્રક્રિયા',
      process_title: 'અમારી ૫-પગલાની લીઝિંગ પ્રક્રિયા',
      process_subtitle: 'પ્લોટ પસંદગીથી કરાર નોંધણી અને મુવ-ઇન સુધીની સરળ સફર.',
      step1_title: '૧. જરૂરિયાત ઓડિટ',
      step1_desc: 'બજેટ, ગ્રાહકોની આવનજાવન અને લેઆઉટ સ્પેસ નક્કી કરવી.',
      step2_title: '૨. સાઇટ પસંદગી',
      step2_desc: 'ગાંધીધામ અને આદિપુરમાં ચકાસાયેલ દુકાનો અને ઓફિસોનું નિરીક્ષણ.',
      step3_title: '૩. ભાડા અંગે વાટાઘાટો',
      step3_desc: 'ઉત્તમ લીઝ દર અને અનુકૂળ સિક્યોરિટી ડિપોઝિટ સુનિશ્ચિત કરવી.',
      step4_title: '૪. કાનૂની ચકાસણી',
      step4_desc: 'ટાઇટલ ચેક, ટેક્સ ચકાસણી અને ૧૧ મહિનાના લીઝ ડીડની નોંધણી.',
      step5_title: '૫. કબજો અને મુવ-ઇન',
      step5_desc: 'વ્યવસાય શરૂ કરવા માટે ચાવી સોંપણી અને સુવિધાઓનું સેટઅપ.',
      faq_tag: 'સામાન્ય પ્રશ્નો',
      faq_title: 'કોમર્શિયલ પ્રોપર્ટી પ્રશ્નોત્તરી',
      faq_subtitle: 'ગાંધીધામ અને આદિપુરમાં ભાડાના કરાર અને દસ્તાવેજો અંગે વારંવાર પૂછાતા પ્રશ્નો.',
      faq_q1: 'ગાંધીધામ અને આદિપુરમાં તમે કયા પ્રકારની ભાડાની કોમર્શિયલ પ્રોપર્ટી પૂરી પાડો છો?',
      faq_a1: 'અમે ગાંધીધામમાં ટાગોર રોડ, સેક્ટર ૧-૧૨, મેઇન માર્કેટ અને આદિપુરમાં સ્ટેશન રોડ પર વધુ ગ્રાહકો ધરાવતી રિટેલ દુકાનો, સુસજ્જ કોર્પોરેટ ઓફિસો, માર્કેટ શોરૂમ અને કોમર્શિયલ પ્લોટ પૂરા પાડીએ છીએ.',
      faq_q2: 'ગાંધીધામમાં ભાડાના કરાર અને લીઝ ડીડની સમયમર્યાદા શું હોય છે?',
      faq_a2: 'ગાંધીધામ અને આદિપુરમાં કોમર્શિયલ પ્રોપર્ટી સામાન્ય રીતે ૧૧ મહિનાના નોંધાયેલા લીઝ કરાર અથવા ૩ થી ૯ વર્ષના કોર્પોરેટ લીઝ ડીડ હેઠળ ભાડે આપવામાં આવે છે.',
      faq_q3: 'તમે ભાડૂઆતો અને માલિકોને કાનૂની ચકાસણીમાં કેવી રીતે મદદ કરો છો?',
      faq_a3: 'અમે મિલકતની માલિકી ચકાસણી, ટાઇટલ ચેક, મ્યુનિસિપલ ટેક્સ ક્લિયરન્સ અને ૧૦૦% કાયદાકીય રજીસ્ટર્ડ લીઝ ડીડ તૈયાર કરીએ છીએ.',
      faq_q4: 'કોમર્શિયલ જગ્યા ભાડે લેવા માટે સિક્યોરિટી ડિપોઝિટની શરતો શું હોય છે?',
      faq_a4: 'સ્થળ અને પ્રોપર્ટીના પ્રકાર આધારે સામાન્ય રીતે ૩ થી ૬ મહિનાની સિક્યોરિટી ડિપોઝિટ હોય છે, જેમાં સરળ વાટાઘાટો અને પારદર્શક શરતો પૂરી પાડવામાં આવે છે.',
      target_hero_badge: '<i class="fa-solid fa-map-location-dot"></i> જમીન રેકોર્ડ શોધો',
      target_hero_title: 'લક્ષ્ય વિસ્તારો અને <span>જમીન શોધી બતાવો</span>',
      target_hero_sub: 'કચ્છ જિલ્લામાં સ્ટેપ-બાય-સ્ટેપ કેસ્કેડિંગ લેન્ડ રેકોર્ડ સર્ચ (ગુજરાત AnyRoR મોડેલ). સરહદી તાલુકો પસંદ કરો અને ગામ અને ક્ષેત્ર ફિલ્ટર અનલૉક કરો.'
    },
    hi: {
      nav_home: 'होम',
      nav_overview: 'अवलोकन',
      nav_target_areas: 'लक्षित क्षेत्र',
      nav_services: 'सेवाएं',
      nav_process: 'प्रक्रिया',
      nav_faq: 'अक्सर पूछे जाने वाले सवाल',
      nav_contact: 'संपर्क करें',
      hero_badge: '<i class="fa-solid fa-building"></i> प्रमुख कमर्शियल रेंटल और लीजिंग कंसल्टेंसी',
      hero_title: 'गांधीधाम और आदिपुर में <span>कमर्शियल प्रॉपर्टी किराए पर लेने व देने</span> हेतु आपका प्रमुख पार्टनर',
      hero_sub: 'गांधीधाम और आदिपुर, गुजरात में कमर्शियल दुकानों, कॉर्पोरेट कार्यालयों, शोरूम और कमर्शियल प्लॉटों को किराए पर लेने व देने के लिए विशेषज्ञ मार्गदर्शन।',
      buy_btn: '<i class="fa-solid fa-magnifying-glass-location"></i> क्या आपको कमर्शियल स्थान किराए पर चाहिए?',
      sell_btn: '<i class="fa-solid fa-key"></i> अपनी प्रॉपर्टी किराए पर दें / लिस्ट करें',
      stat_exp_val: '10+ वर्ष',
      stat_exp_lbl: 'कमर्शियल अनुभव',
      stat_leased_val: '250+ स्थान',
      stat_leased_lbl: 'लीज पर दी गई प्रॉपर्टी',
      stat_clients_val: '100+ ग्राहक',
      stat_clients_lbl: 'संतुष्ट व्यवसाय',
      overview_shops_title: 'किराए की दुकानें और शोरूम',
      overview_shops_desc: 'गांधीधाम और आदिपुर के प्रमुख बाजारों में उच्च फुटफॉल वाले रेंटल रिटेल स्थान।',
      overview_offices_title: 'कॉर्पोरेट ऑफिस स्पेस',
      overview_offices_desc: 'कमर्शियल कॉम्प्लेक्स में पूरी तरह से सुसज्जित और खुली ऑफिस जगहें।',
      overview_legal_title: 'सत्यापित लीज और दस्तावेज',
      overview_legal_desc: '100% कानूनी रूप से स्पष्ट लीज समझौते और परेशानी मुक्त दस्तावेजीकरण।',
      story_tag: 'हमारे बारे में',
      story_headline: 'श्रीजी रियल एस्टेट कंसल्टेंसी',
      story_paragraph: 'श्रीजी रियल एस्टेट गांधीधाम, कच्छ में मुख्यालय वाली आपकी समर्पित कमर्शियल प्रॉपर्टी और रेंटल कंसल्टेंसी है। 10+ वर्षों के स्थानीय अनुभव के साथ, हम व्यापारियों, रिटेल ब्रांडों और कॉर्पोरेट किरायेदारों को गांधीधाम व आदिपुर में बेहतरीन किराए के स्थान प्रदान करते हैं।',
      areas_tag: 'लक्षित क्षेत्र और नक्शे',
      areas_title: 'गांधीधाम और आदिपुर सेक्टर नक्शे',
      areas_desc: 'गांधीधाम और आदिपुर के लिए आधिकारिक मास्टर प्लान पीडीएफ देखने के लिए नीचे क्लिक करें।',
      gandhidham_desc: 'टैगोर रोड, सेक्टर लेआउट और कमर्शियल मार्केट जोन के साथ आधिकारिक गांधीधाम मास्टर प्लान पीडीएफ देखें।',
      adipur_desc: 'स्टेशन रोड कमर्शियल प्लॉट ग्रिड और मार्केट मैप के साथ आधिकारिक आदिपुर पीडीएफ देखें।',
      open_pdf_btn: 'मास्टर प्लान पीडीएफ खोलें ↗',
      listings_tag: 'सत्यापित अवसर',
      listings_title: 'उपलब्ध प्रॉपर्टी सूचियां',
      listings_subtitle: 'गांधीधाम और आदिपुर में उपलब्ध सत्यापित कमर्शियल दुकानें, ऑफिस और प्लॉट।',
      citymaps_tag: 'सिटी प्लानिंग और सेक्टर नक्शे',
      citymaps_title: 'गांधीधाम और आदिपुर कमर्शियल नक्शे (PDF)',
      citymaps_subtitle: 'आधिकारिक नगर योजना नक्शे, सेक्टर लेआउट और कमर्शियल क्षेत्र डाउनलोड करें।',
      gandhidham_map_title: 'गांधीधाम कमर्शियल मास्टर मैप',
      adipur_map_title: 'आदिपुर कमर्शियल मार्केट मैप',
      services_tag: 'कमर्शियल समाधान',
      services_title: 'हमारी कमर्शियल रियल एस्टेट सेवाएं',
      services_subtitle: 'गांधीधाम और आदिपुर में किरायेदारों, मालिकों और निवेशकों के लिए विशेष सेवाएं।',
      tenant_title: 'कमर्शियल किरायेदारों के लिए',
      tenant_desc: 'किराए पर बेहतरीन रिटेल दुकानें, ऑफिस और कमर्शियल स्थान खोजना।',
      landlord_title: 'कमर्शियल मालिकों के लिए',
      landlord_desc: 'अपनी दुकानें, ऑफिस या प्लॉट कॉर्पोरेट किरायेदारों को किराए पर दें।',
      legal_title: 'लीज और कानूनी अनुपालन',
      legal_desc: '11 महीने के लीज डीड, नगर निगम पंजीकरण और संपत्ति सत्यापन।',
      process_tag: 'व्यवस्थित प्रक्रिया',
      process_title: 'हमारी 5-चरण लीजिंग प्रक्रिया',
      process_subtitle: 'साइट चयन से लेकर अनुबंध पंजीकरण और कब्जे तक की आसान यात्रा।',
      step1_title: '1. आवश्यकता ऑडिट',
      step1_desc: 'बजट, फुटफॉल आवश्यकता और लेआउट स्पेस निर्धारित करना।',
      step2_title: '2. साइट चयन',
      step2_desc: 'गांधीधाम और आदिपुर में सत्यापित कमर्शियल दुकानों व ऑफिसों का निरीक्षण।',
      step3_title: '3. किराया बातचीत',
      step3_desc: 'प्रतिस्पर्धी लीज दरें और लचीली सुरक्षा जमा राशि सुरक्षित करना।',
      step4_title: '4. कानूनी सत्यापन',
      step4_desc: 'टाइटल जांच, टैक्स अनुपालन और 11 महीने का लीज डीड पंजीकरण।',
      step5_title: '5. कब्जा और मूव-इन',
      step5_desc: 'तत्काल व्यवसाय संचालन हेतु चाबी सौंपना और सेटअप सहायता।',
      faq_tag: 'सामान्य प्रश्न',
      faq_title: 'कमर्शियल प्रॉपर्टी प्रश्नोत्तरी',
      faq_subtitle: 'गांधीधाम और आदिपुर में रेंटल एग्रीमेंट और दस्तावेजों के संबंध में अक्सर पूछे जाने वाले प्रश्न।',
      faq_q1: 'गांधीधाम और आदिपुर में आप किस प्रकार की किराए की कमर्शियल प्रॉपर्टी प्रदान करते हैं?',
      faq_a1: 'हम गांधीधाम में टैगोर रोड, मेन मार्केट, सेक्टर 1-12 और आदिपुर में स्टेशन रोड पर भारी फुटफॉल वाली रिटेल दुकानें, पूरी तरह सुसज्जित कॉर्पोरेट ऑफिस, शोरूम और कमर्शियल प्लॉट प्रदान करते हैं।',
      faq_q2: 'गांधीधाम में रेंटल एग्रीमेंट और लीज डीड की अवधि क्या होती है?',
      faq_a2: 'गांधीधाम और आदिपुर में कमर्शियल प्रॉपर्टी आमतौर पर 11 महीने के पंजीकृत लीज समझौते या 3 से 9 साल के कॉर्पोरेट लीज डीड के तहत किराए पर दी जाती हैं।',
      faq_q3: 'आप किरायेदारों और मकान मालिकों को कानूनी सत्यापन में कैसे सहायता करते हैं?',
      faq_a3: 'हम संपत्ति के स्वामित्व की जांच, टाइटल सत्यापन, नगर निगम टैक्स क्लीयरेंस और 100% कानूनी रूप से पंजीकृत लीज डीड तैयार करते हैं।',
      faq_q4: 'कमर्शियल स्पेस किराए पर लेने हेतु सिक्योरिटी डिपॉजिट और शर्तें क्या हैं?',
      faq_a4: 'स्थान और संपत्ति के प्रकार के आधार पर आमतौर पर 3 से 6 महीने का सिक्योरिटी डिपॉजिट होता है, जिसमें पारदर्शी बातचीत और आसान शर्तें शामिल हैं।',
      target_hero_badge: '<i class="fa-solid fa-map-location-dot"></i> भूमि रिकॉर्ड खोज',
      target_hero_title: 'टारगेट एरिया एवं <span>भूमि रिकॉर्ड खोज</span>',
      target_hero_sub: 'कच्छ जिले में चरण-दर-चरण कैस्केडिंग भूमि रिकॉर्ड खोज (गुजरात AnyRoR मॉडल)। तालुका चुनें और ग्राम एवं क्षेत्र फ़िल्टर अनलॉक करें।'
    }
  };

  // Multi-lingual dynamic land & commercial listings
  const translatedListings = {
    en: [
      { id: 1, title: "1,200 Sq.Ft Furnished Office Space", location: "Tagor Road Commercial Complex, Gandhidham", tag: "Corporate Office", details: ["Air-conditioned with 15 workstations", "Private cabin, conference room & pantry", "100% power backup & elevator access"], btn: "Inquire Details & Rent" },
      { id: 2, title: "850 Sq.Ft Ground Floor Market Shop", location: "Main Market Road, Sector 8, Gandhidham", tag: "Retail Shop", details: ["Heavy customer footfall area", "20-foot glass frontage for high brand visibility", "Suitable for retail brands, banks & cafes"], btn: "Inquire Details & Rent" },
      { id: 3, title: "1,500 Sq.Ft Main Market Showroom", location: "Station Road Market, Adipur", tag: "Showroom", details: ["Prime corner shop location with top visibility", "Mezzanine floor for extra storage or office", "Ready for retail, apparel & electronics"], btn: "Inquire Details & Rent" },
      { id: 4, title: "2,500 Sq.Ft Commercial Lease Plot", location: "Gandhidham Highway Junction", tag: "Commercial Plot", details: ["Wide road frontage for commercial display", "Available on long-term 5-year to 10-year lease", "Clear commercial municipal zoning"], btn: "Inquire Details & Rent" }
    ],
    guj: [
      { id: 1, title: "૧,૨૦૦ સ્ક્વેર ફીટ સુસજ્જ ઓફિસ સ્પેસ", location: "ટાગોર રોડ કોમર્શિયલ કોમ્પ્લેક્સ, ગાંધીધામ", tag: "કોર્પોરેટ ઓફિસ", details: ["૧૫ વર્કસ્ટેશન સાથે એર-કન્ડિશન્ડ", "પ્રાઈવેટ કેબિન, કોન્ફરન્સ રૂમ અને પેન્ટ્રી", "૧૦૦% પાવર બેકઅપ અને લિફ્ટ સુવિધા"], btn: "વિગતો અને ભાડું મેળવો" },
      { id: 2, title: "૮૫૦ સ્ક્વેર ફીટ ગ્રાઉન્ડ ફ્લોર માર્કેટ શોપ", location: "મેઇન માર્કેટ રોડ, સેક્ટર ૮, ગાંધીધામ", tag: "રિટેલ દુકાન", details: ["વધુ ગ્રાહકો ધરાવતો મુખ્ય વિસ્તાર", "ઉત્તમ દ્રશ્યતા માટે ૨૦-ફૂટ કાચનું ફ્રન્ટેજ", "રિટેલ બ્રાન્ડ્સ, બેંકો અને કેફે માટે યોગ્ય"], btn: "વિગતો અને ભાડું મેળવો" },
      { id: 3, title: "૧,૫૦૦ સ્ક્વેર ફીટ માર્કેટ શોરૂમ", location: "સ્ટેશન રોડ માર્કેટ, આદિપુર", tag: "શોરૂમ", details: ["ઉત્કૃષ્ટ લોકેશન સાથે પ્રાઇમ કોર્નર દુકાન", "સ્ટોરેજ અથવા ઓફિસ માટે મેઝઝાનિન ફ્લોર", "રિટેલ અને ઈલેક્ટ્રોનિક્સ માટે તૈયાર"], btn: "વિગતો અને ભાડું મેળવો" },
      { id: 4, title: "૨,૫૦૦ સ્ક્વેર ફીટ કોમર્શિયલ લીઝ પ્લોટ", location: "ગાંધીધામ હાઇવે જંકશન", tag: "કોમર્શિયલ પ્લોટ", details: ["વ્યાપારી પ્રદર્શન માટે પહોળો રોડ ફ્રન્ટેજ", "૫ થી ૧૦ વર્ષના લાંબા ગાળાના લીઝ પર ઉપલબ્ધ", "સ્પષ્ટ કોમર્શિયલ મ્યુનિસિપલ મંજૂરી"], btn: "વિગતો અને ભાડું મેળવો" }
    ],
    hi: [
      { id: 1, title: "1,200 वर्ग फुट सुसज्जित ऑफिस स्पेस", location: "टैगोर रोड कमर्शियल कॉम्प्लेक्स, गांधीधाम", tag: "कॉर्पोरेट ऑफिस", details: ["15 वर्कस्टेशन के साथ पूरी तरह एसी", "निजी केबिन, कॉन्फ्रेंस रूम और पेंट्री", "100% पावर बैकअप और लिफ्ट सुविधा"], btn: "विवरण और किराया जानें" },
      { id: 2, title: "850 वर्ग फुट ग्राउंड floor मार्केट शॉप", location: "मेन मार्केट रोड, सेक्टर 8, गांधीधाम", tag: "रिटेल दुकान", details: ["भारी ग्राहक फुटफॉल वाला मुख्य क्षेत्र", "बेहतर दृश्यता के लिए 20-फीट ग्लास फ्रंट", "रिटेल ब्रांड्स, बैंकों और कैफे के लिए उपयुक्त"], btn: "विवरण और किराया जानें" },
      { id: 3, title: "1,500 वर्ग फुट मेन मार्केट शोरूम", location: "स्टेशन रोड मार्केट, आदिपुर", tag: "शोरूम", details: ["उत्कृष्ट दृश्यता वाली प्राइम कॉर्नर दुकान", "अतिरिक्त स्टोरेज या ऑफिस हेतु मेजेनाइन फ्लोर", "कपड़ों व इलेक्ट्रॉनिक्स रिटेल के लिए तैयार"], btn: "विवरण और किराया जानें" },
      { id: 4, title: "2,500 वर्ग फुट कमर्शियल लीज प्लॉट", location: "गांधीधाम हाईवे जंक्शन", tag: "कमर्शियल प्लॉट", details: ["कमर्शियल प्रदर्शन के लिए चौड़ा रोड फ्रंट", "5 से 10 साल के लंबे समय के लीज पर उपलब्ध", "स्पष्ट कमर्शियल नगर निगम मंजूरी"], btn: "विवरण और किराया जानें" }
    ]
  };

  function renderDynamicListings(lang = 'en') {
    const dynamicListingsContainer = document.getElementById('dynamicListingsContainer');
    if (!dynamicListingsContainer) return;

    const currentLang = lang || localStorage.getItem('preferred_language') || 'en';
    const listingsToRender = translatedListings[currentLang] || translatedListings.en;

    dynamicListingsContainer.innerHTML = '';
    listingsToRender.forEach(listing => {
      const card = document.createElement('div');
      card.className = 'service-card active';
      card.style.borderTop = '6px solid var(--accent-gold)';
      card.innerHTML = `
        <div class="tag" style="background: var(--primary); color: white; margin-bottom: 1rem;">${listing.tag}</div>
        <h3 style="font-size: 1.4rem; margin-bottom: 0.5rem; color: var(--primary-dark); font-weight: 700;">${listing.title}</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
          <i class="fa-solid fa-location-dot" style="color: var(--accent-gold);"></i> ${listing.location}
        </p>
        <ul class="service-list" style="margin-bottom: 1.5rem;">
          ${listing.details.map(detail => `<li><i class="fa-solid fa-circle-check" style="color: var(--accent-emerald);"></i> ${detail}</li>`).join('')}
        </ul>
        <button class="btn btn-primary" onclick="openModal('buy')" style="width: 100%; margin-top: auto;">${listing.btn}</button>
      `;
      dynamicListingsContainer.appendChild(card);
    });
  }

  function applyLanguage(lang) {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dictionary[lang] && dictionary[lang][key]) {
        el.innerHTML = dictionary[lang][key];
      }
    });
    renderDynamicListings(lang);
    localStorage.setItem('preferred_language', lang);
  }

  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      langBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const lang = btn.getAttribute('data-lang');
      applyLanguage(lang);
    });
  });

  const savedLang = localStorage.getItem('preferred_language') || 'en';
  const targetBtn = document.querySelector(`.lang-btn[data-lang="${savedLang}"]`);
  if (targetBtn) {
    langBtns.forEach(b => b.classList.remove('active'));
    targetBtn.classList.add('active');
  }
  applyLanguage(savedLang);

  const defaultSiteContent = {
    home: {
      heroTitle: "Your Premier Partner for <span>Rental Commercial Properties</span> in Gandhidham & Adipur",
      heroSubtitle: "Expert guidance for renting, leasing, buying, and listing commercial shops, corporate offices, showrooms, and commercial plots across Gandhidham & Adipur, Gujarat.",
      contactPhone: "+91 70162 70941",
      contactEmail: "shreejirealestate@gmail.com",
      storyHeadline: "Shreeji Real Estate Consultancy",
      storyParagraph: "Shreeji Real Estate is your dedicated commercial property & rental consultancy headquartered in Gandhidham, Kutch, Gujarat. With 10+ years of local market leadership, we connect business owners, retail brands, and corporate tenants with top commercial rental spaces, offices, and plots in Gandhidham and Adipur.",
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
  applyLanguage(savedLang);
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
    if (modalSub) modalSub.textContent = 'Partner with Shreeji to lease or sell to verified corporate & retail tenants.';
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
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registering...';
  }

  let payload = {
    role: role,
    timestamp: new Date().toISOString(),
    source: 'Shreeji Web Portal'
  };

  if (role === 'landlord') {
    payload.location = document.getElementById('sellerLoc')?.value || '';
    payload.area = document.getElementById('sellerArea')?.value || '';
    payload.name = document.getElementById('sellerName')?.value || '';
    payload.phone = document.getElementById('sellerPhone')?.value || '';
    payload.expected = document.getElementById('sellerExpected')?.value || '';
    payload.subject = `Landlord Property Listing: ${payload.location} (${payload.area})`;
  } else {
    payload.location = document.getElementById('buyerLoc')?.value || '';
    payload.category = document.getElementById('buyerCategory')?.value || '';
    payload.name = document.getElementById('buyerName')?.value || '';
    payload.phone = document.getElementById('buyerPhone')?.value || '';
    payload.notes = document.getElementById('buyerNotes')?.value || '';
    payload.subject = `Commercial Space Inquiry: ${payload.category} in ${payload.location}`;
  }

  // 1. Store locally as fail-safe
  try {
    const existing = JSON.parse(localStorage.getItem('shreeji_inquiries') || '[]');
    existing.push(payload);
    localStorage.setItem('shreeji_inquiries', JSON.stringify(existing));
  } catch (err) {
    console.warn('Local storage write skipped:', err);
  }

  // 2. Transmit to Backend Server (port 5000)
  try {
    const response = await fetch('http://localhost:5000/api/v1/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log('Backend response status:', response.status);
  } catch (networkErr) {
    console.log('Backend offline or starting up, inquiry securely logged locally:', payload);
  }

  // 3. Show Success Screen
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = originalBtnText;
  }
  const buyerForm = document.getElementById('buyerForm');
  const sellerForm = document.getElementById('sellerForm');
  const successBox = document.getElementById('formSuccess');

  if (buyerForm) buyerForm.style.display = 'none';
  if (sellerForm) sellerForm.style.display = 'none';
  if (successBox) successBox.style.display = 'block';
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



