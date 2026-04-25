// ============================================
// QUANTUM BUILD — PC Parts Catalog (Full)
// 15 Categories · 65+ Products
// ============================================
// hasImage: true  = actual image file in assets/images/parts/
// hasImage: false = CSS art placeholder shown
// artColor: gradient background for placeholder
// artIcon:  emoji shown in placeholder

const PARTS = [

    // ═══════════════════════════════════════════
    //  CPUs (Processors)
    // ═══════════════════════════════════════════
    {
        id: 'cpu-1', category: 'cpu', badge: 'FLAGSHIP',
        name: 'Intel Core i9-14900K',
        brand: 'Intel', socket: 'LGA1700', cores: '24-Core (8P+16E)',
        spec: '6.0 GHz Boost · 125W TDP · DDR5 · Intel 7',
        compatibility: 'LGA1700 · Z790 / B760 · DDR5 · PCIe 5.0',
        description: 'Intel\'s flagship 14th-gen processor with 24 cores for extreme multitasking and unmatched single-threaded gaming performance.',
        price: 59999, originalPrice: 69999,
        rating: 4.9, reviews: 312, popularity: 95,
        hasImage: true, artColor: '#1a3a6e', artIcon: '⚡',
        image: 'assets/images/parts/cpu_i9_14900k.png'
    },
    {
        id: 'cpu-2', category: 'cpu', badge: 'BEST SELLER',
        name: 'AMD Ryzen 9 7950X',
        brand: 'AMD', socket: 'AM5', cores: '16-Core / 32-Thread',
        spec: '5.7 GHz Boost · 170W TDP · DDR5 · Zen 4',
        compatibility: 'AM5 · X670E / B650 · DDR5 · PCIe 5.0',
        description: 'AMD\'s top-tier Zen 4 desktop CPU with 16 cores and blistering clock speeds for content creation and gaming.',
        price: 54999, originalPrice: 62999,
        rating: 4.8, reviews: 287, popularity: 90,
        hasImage: true, artColor: '#6e1a1a', artIcon: '🔴',
        image: 'assets/images/parts/cpu_r9_7950x.png'
    },
    {
        id: 'cpu-3', category: 'cpu', badge: 'GAMING KING',
        name: 'AMD Ryzen 7 7800X3D',
        brand: 'AMD', socket: 'AM5', cores: '8-Core / 16-Thread',
        spec: '5.0 GHz Boost · 120W TDP · 96MB 3D V-Cache',
        compatibility: 'AM5 · X670E / B650 · DDR5 · PCIe 5.0',
        description: 'The undisputed gaming champion featuring AMD\'s revolutionary 3D V-Cache for unbeatable frame rates.',
        price: 39999, originalPrice: 44999,
        rating: 4.9, reviews: 502, popularity: 98,
        hasImage: true, artColor: '#5c1a6e', artIcon: '🎮',
        image: 'assets/images/parts/cpu_ryzen_7800x3d.png'
    },
    {
        id: 'cpu-4', category: 'cpu',
        name: 'Intel Core i7-14700K',
        brand: 'Intel', socket: 'LGA1700', cores: '20-Core (8P+12E)',
        spec: '5.6 GHz Boost · 125W TDP · DDR5 · Intel 7',
        compatibility: 'LGA1700 · Z790 / B760 · DDR5 · PCIe 5.0',
        description: 'A powerful 20-core processor that balances gaming and productivity with excellent value.',
        price: 38999, originalPrice: 44999,
        rating: 4.7, reviews: 198, popularity: 82,
        hasImage: true, artColor: '#1a4a6e', artIcon: '⚡',
        image: 'assets/images/parts/cpu_i7_14700k.png'
    },
    {
        id: 'cpu-5', category: 'cpu',
        name: 'AMD Ryzen 5 7600X',
        brand: 'AMD', socket: 'AM5', cores: '6-Core / 12-Thread',
        spec: '5.3 GHz Boost · 105W TDP · DDR5 · Zen 4',
        compatibility: 'AM5 · X670E / B650 / A620 · DDR5 · PCIe 5.0',
        description: 'The best value Zen 4 processor — perfect for 1080p and 1440p gaming on a budget.',
        price: 22999, originalPrice: 26999,
        rating: 4.7, reviews: 614, popularity: 85,
        hasImage: true, artColor: '#6e3a1a', artIcon: '🔥',
        image: 'assets/images/parts/cpu_ryzen_7600x.png'
    },

    // ═══════════════════════════════════════════
    //  GPUs (Graphics Cards)
    // ═══════════════════════════════════════════
    {
        id: 'gpu-1', category: 'gpu', badge: 'TITAN',
        name: 'NVIDIA GeForce RTX 4090',
        brand: 'NVIDIA', vram: '24GB GDDR6X',
        spec: '2.52 GHz Boost · 450W TDP · DLSS 3 · Ada Lovelace',
        compatibility: 'PCIe 4.0 x16 · 3-slot · 12VHPWR · 850W+ PSU',
        description: 'The absolute king of GPUs — 4K gaming at 120+ FPS with ray tracing and AI-powered DLSS 3.',
        price: 169999, originalPrice: 189999,
        rating: 5.0, reviews: 94, popularity: 99,
        hasImage: true, artColor: '#0d2e0d', artIcon: '🎯',
        image: 'assets/images/parts/NVIDIA GeForce RTX 4090.jpg'
    },
    {
        id: 'gpu-2', category: 'gpu', badge: 'POPULAR',
        name: 'NVIDIA GeForce RTX 4080 SUPER',
        brand: 'NVIDIA', vram: '16GB GDDR6X',
        spec: '2.55 GHz Boost · 320W TDP · DLSS 3 · Ada Lovelace',
        compatibility: 'PCIe 4.0 x16 · 2.5-slot · 12VHPWR · 750W+ PSU',
        description: 'Premium 4K gaming with DLSS 3 Frame Generation — superb performance-per-watt.',
        price: 109999, originalPrice: 124999,
        rating: 4.8, reviews: 217, popularity: 88,
        hasImage: true, artColor: '#0d2e1a', artIcon: '🎯',
        image: 'assets/images/parts/NVIDIA GeForce RTX 4080 SUPER.png'
    },
    {
        id: 'gpu-3', category: 'gpu', badge: 'VALUE PICK',
        name: 'NVIDIA GeForce RTX 4070 Ti SUPER',
        brand: 'NVIDIA', vram: '16GB GDDR6X',
        spec: '2.61 GHz Boost · 285W TDP · DLSS 3 · Ada Lovelace',
        compatibility: 'PCIe 4.0 x16 · 2.5-slot · 12VHPWR · 700W+ PSU',
        description: 'The sweet spot for 1440p ultra gaming — 16GB VRAM meets DLSS 3 for futureproof performance.',
        price: 79999, originalPrice: 89999,
        rating: 4.8, reviews: 341, popularity: 92,
        hasImage: true, artColor: '#0d2e2e', artIcon: '🎯',
        image: 'assets/images/parts/NVIDIA GeForce RTX 4070 Ti SUPER.jpg'
    },
    {
        id: 'gpu-4', category: 'gpu',
        name: 'AMD Radeon RX 7900 XTX',
        brand: 'AMD', vram: '24GB GDDR6',
        spec: '2.50 GHz Boost · 355W TDP · FSR 3 · RDNA 3',
        compatibility: 'PCIe 4.0 x16 · 2.5-slot · 2×8-pin · 800W+ PSU',
        description: 'AMD\'s flagship GPU with 24GB VRAM — unbeatable in rasterization and compute workloads.',
        price: 89999, originalPrice: 99999,
        rating: 4.7, reviews: 163, popularity: 78,
        hasImage: true, artColor: '#3a0d0d', artIcon: '🔶',
        image: 'assets/images/parts/AMD Radeon RX 7900 XTX.jpg'
    },
    {
        id: 'gpu-5', category: 'gpu',
        name: 'NVIDIA GeForce RTX 4060 Ti',
        brand: 'NVIDIA', vram: '8GB GDDR6',
        spec: '2.54 GHz Boost · 160W TDP · DLSS 3 · Ada Lovelace',
        compatibility: 'PCIe 4.0 x16 · 2-slot · 8-pin · 550W+ PSU',
        description: 'Efficient 1080p/1440p gaming card with full ray tracing and DLSS 3 at an accessible price.',
        price: 39999, originalPrice: 44999,
        rating: 4.5, reviews: 489, popularity: 86,
        hasImage: true, artColor: '#1a3a0d', artIcon: '🎯',
        image: 'assets/images/parts/NVIDIA GeForce RTX 4060 Ti.jpg'
    },

    // ═══════════════════════════════════════════
    //  Motherboards
    // ═══════════════════════════════════════════
    {
        id: 'mb-1', category: 'motherboard', badge: 'TOP PICK',
        name: 'ASUS ROG Maximus Z790 Apex',
        brand: 'ASUS', socket: 'LGA1700', formFactor: 'ATX',
        spec: 'Z790 · DDR5 · PCIe 5.0 · 4× M.2 · WiFi 6E',
        compatibility: 'Intel 12th/13th/14th Gen · LGA1700 · DDR5',
        description: 'The ultimate overclocking motherboard with world-record DDR5 support and extreme VRM design.',
        price: 64999, originalPrice: 74999,
        rating: 4.9, reviews: 97, popularity: 88,
        hasImage: true, artColor: '#1a2e1a', artIcon: '🖥️',
        image: 'assets/images/parts/ASUS ROG Maximus Z790 Apex.jpg'
    },
    {
        id: 'mb-2', category: 'motherboard', badge: 'AMD BEST',
        name: 'ASUS ROG Crosshair X670E Hero',
        brand: 'ASUS', socket: 'AM5', formFactor: 'ATX',
        spec: 'X670E · DDR5 · PCIe 5.0 · WiFi 6E · USB 4',
        compatibility: 'AMD Ryzen 7000 Series · AM5 · DDR5',
        description: 'Premium AM5 motherboard with PCIe 5.0 everywhere, USB4, and world-class audio.',
        price: 54999, originalPrice: 62999,
        rating: 4.8, reviews: 134, popularity: 82,
        hasImage: true, artColor: '#2e1a1a', artIcon: '🖥️',
        image: 'assets/images/parts/ASUS ROG Crosshair X670E Hero.jpg'
    },
    {
        id: 'mb-3', category: 'motherboard',
        name: 'MSI MAG Z790 Tomahawk WiFi',
        brand: 'MSI', socket: 'LGA1700', formFactor: 'ATX',
        spec: 'Z790 · DDR5 · PCIe 5.0 · 3× M.2 · WiFi 6E',
        compatibility: 'Intel 12th/13th/14th Gen · LGA1700 · DDR5',
        description: 'Feature-packed mid-range Z790 board with outstanding VRM for the price.',
        price: 29999, originalPrice: 34999,
        rating: 4.7, reviews: 268, popularity: 80,
        hasImage: true, artColor: '#1a1a2e', artIcon: '🖥️',
        image: 'assets/images/parts/MSI MAG Z790 Tomahawk WiFi.jpg'
    },
    {
        id: 'mb-4', category: 'motherboard',
        name: 'Gigabyte B650 AORUS Elite AX',
        brand: 'Gigabyte', socket: 'AM5', formFactor: 'ATX',
        spec: 'B650 · DDR5 · PCIe 4.0 · 2× M.2 · WiFi 6E',
        compatibility: 'AMD Ryzen 7000 Series · AM5 · DDR5',
        description: 'Great value AM5 motherboard with solid features for mainstream builds.',
        price: 19999, originalPrice: 22999,
        rating: 4.6, reviews: 345, popularity: 78,
        hasImage: true, artColor: '#2e2e1a', artIcon: '🖥️',
        image: 'assets/images/parts/Gigabyte B650 AORUS Elite AX.jpg'
    },

    // ═══════════════════════════════════════════
    //  RAM (Memory)
    // ═══════════════════════════════════════════
    {
        id: 'ram-1', category: 'ram', badge: 'RGB',
        name: 'G.Skill Trident Z5 Neo RGB',
        brand: 'G.Skill', speed: 'DDR5-6000MHz',
        spec: '32GB (2×16GB) · CL30 · RGB · XMP 3.0',
        compatibility: 'DDR5 · AM5 / LGA1700 · EXPO & XMP 3.0',
        description: 'Premium DDR5 memory with stunning RGB and AM5-optimized EXPO profiles.',
        price: 14999, originalPrice: 17999,
        rating: 4.8, reviews: 421, popularity: 90,
        hasImage: true, artColor: '#1a1a5c', artIcon: '💡',
        image: 'assets/images/parts/G.Skill Trident Z5 Neo RGB.jpg'
    },
    {
        id: 'ram-2', category: 'ram', badge: 'FLAGSHIP',
        name: 'Corsair Dominator Platinum RGB',
        brand: 'Corsair', speed: 'DDR5-5600MHz',
        spec: '64GB (2×32GB) · CL40 · RGB · Intel XMP',
        compatibility: 'DDR5 · LGA1700 / AM5 · XMP 3.0',
        description: 'Corsair\'s flagship memory with iCUE RGB and premium Dominator heat spreader.',
        price: 24999, originalPrice: 28999,
        rating: 4.7, reviews: 188, popularity: 75,
        hasImage: true, artColor: '#1a3a5c', artIcon: '💡',
        image: 'assets/images/parts/Corsair Dominator Platinum RGB.jpg'
    },
    {
        id: 'ram-3', category: 'ram',
        name: 'Kingston Fury Beast DDR5',
        brand: 'Kingston', speed: 'DDR5-5200MHz',
        spec: '16GB (2×8GB) · CL40 · XMP 3.0',
        compatibility: 'DDR5 · LGA1700 / AM5 · XMP 3.0',
        description: 'Affordable DDR5 kit with solid performance and low-profile heat spreader.',
        price: 7999, originalPrice: 9499,
        rating: 4.6, reviews: 307, popularity: 80,
        hasImage: true, artColor: '#1a1a3a', artIcon: '🔵',
        image: 'assets/images/parts/Kingston Fury Beast DDR5.jpg'
    },
    {
        id: 'ram-4', category: 'ram',
        name: 'Corsair Vengeance DDR5 RGB',
        brand: 'Corsair', speed: 'DDR5-6400MHz',
        spec: '32GB (2×16GB) · CL32 · RGB · XMP 3.0',
        compatibility: 'DDR5 · LGA1700 / AM5 · XMP 3.0',
        description: 'High-frequency DDR5 with aggressive timings and dynamic RGB lighting.',
        price: 16999, originalPrice: 19999,
        rating: 4.8, reviews: 256, popularity: 85,
        hasImage: true, artColor: '#3a1a5c', artIcon: '💜',
        image: 'assets/images/parts/Corsair Vengeance DDR5 RGB.jpg'
    },

    // ═══════════════════════════════════════════
    //  Storage (SSD / HDD)
    // ═══════════════════════════════════════════
    {
        id: 'ssd-1', category: 'storage', badge: 'FASTEST',
        name: 'Samsung 990 Pro NVMe SSD',
        brand: 'Samsung', type: 'M.2 NVMe PCIe 4.0',
        spec: '2TB · 7,450 MB/s Read · 6,900 MB/s Write',
        compatibility: 'M.2 2280 · PCIe 4.0 x4 · NVMe 2.0',
        description: 'Samsung\'s fastest consumer SSD with class-leading sequential and random performance.',
        price: 22999, originalPrice: 26999,
        rating: 4.9, reviews: 509, popularity: 92,
        hasImage: true, artColor: '#1a2a1a', artIcon: '💾',
        image: 'assets/images/parts/Samsung 990 Pro NVMe SSD.jpg'
    },
    {
        id: 'ssd-2', category: 'storage', badge: 'POPULAR',
        name: 'WD Black SN850X NVMe',
        brand: 'Western Digital', type: 'M.2 NVMe PCIe 4.0',
        spec: '1TB · 7,300 MB/s Read · 6,600 MB/s Write',
        compatibility: 'M.2 2280 · PCIe 4.0 x4 · NVMe 1.4',
        description: 'WD\'s flagship gaming SSD with Xbox/PS5 compatibility and predictive loading.',
        price: 12999, originalPrice: 14999,
        rating: 4.8, reviews: 712, popularity: 88,
        hasImage: true, artColor: '#1a1a2a', artIcon: '💾',
        image: 'assets/images/parts/WD Black SN850X NVMe.jpg'
    },
    {
        id: 'ssd-3', category: 'storage',
        name: 'Seagate Barracuda HDD',
        brand: 'Seagate', type: '3.5" SATA HDD',
        spec: '4TB · 7200 RPM · 256MB Cache · SATA 6Gb/s',
        compatibility: 'SATA III · 3.5" Bay · Universal',
        description: 'Reliable bulk storage for games, media, and backups at unbeatable per-GB pricing.',
        price: 6499, originalPrice: 7499,
        rating: 4.5, reviews: 1004, popularity: 70,
        hasImage: true, artColor: '#2a1a1a', artIcon: '🗄️',
        image: 'assets/images/parts/Seagate Barracuda HDD.jpg'
    },
    {
        id: 'ssd-4', category: 'storage',
        name: 'Crucial P3 Plus NVMe SSD',
        brand: 'Crucial', type: 'M.2 NVMe PCIe 4.0',
        spec: '2TB · 5,000 MB/s Read · 4,200 MB/s Write',
        compatibility: 'M.2 2280 · PCIe 4.0 x4 · NVMe 1.4',
        description: 'Budget-friendly NVMe with solid speeds for gaming and everyday use.',
        price: 9999, originalPrice: 11999,
        rating: 4.6, reviews: 388, popularity: 76,
        hasImage: true, artColor: '#1a2a2a', artIcon: '💾',
        image: 'assets/images/parts/Crucial P3 Plus NVMe SSD.jpg'
    },

    // ═══════════════════════════════════════════
    //  Power Supply (PSU)
    // ═══════════════════════════════════════════
    {
        id: 'psu-1', category: 'psu', badge: 'BEST',
        name: 'Corsair HX1200i Platinum',
        brand: 'Corsair', wattage: '1200W',
        spec: '80+ Platinum · Fully Modular · ATX 3.0 · PCIe 5.0',
        compatibility: 'ATX · 12VHPWR Connector · RTX 40-Series Ready',
        description: 'Top-tier 1200W PSU with iCUE monitoring and 80+ Platinum efficiency.',
        price: 24999, originalPrice: 28999,
        rating: 4.9, reviews: 203, popularity: 85,
        hasImage: true, artColor: '#1a1a3a', artIcon: '🔌',
        image: 'assets/images/parts/Corsair HX1200i Platinum.jpg'
    },
    {
        id: 'psu-2', category: 'psu',
        name: 'be quiet! Dark Power 13',
        brand: 'be quiet!', wattage: '1000W',
        spec: '80+ Titanium · Fully Modular · ATX 3.0 · Ultra Silent',
        compatibility: 'ATX · 12VHPWR · Frameworkless Design',
        description: 'Titanium-rated PSU with near-silent operation and ATX 3.0 12VHPWR support.',
        price: 22999, originalPrice: 25999,
        rating: 4.9, reviews: 167, popularity: 78,
        hasImage: true, artColor: '#1a2a1a', artIcon: '🔌',
        image: 'assets/images/parts/be quiet! Dark Power 13.jpg'
    },
    {
        id: 'psu-3', category: 'psu',
        name: 'Seasonic Focus GX-850',
        brand: 'Seasonic', wattage: '850W',
        spec: '80+ Gold · Full Modular · 10-Year Warranty · Hybrid Fan',
        compatibility: 'ATX · 2× EPS · 4× PCIe 8-pin',
        description: 'Legendary reliability with 10-year warranty — the go-to gold PSU for builders.',
        price: 12999, originalPrice: 14999,
        rating: 4.8, reviews: 541, popularity: 82,
        hasImage: true, artColor: '#2a2a1a', artIcon: '🔌',
        image: 'assets/images/parts/Seasonic Focus GX-850.jpg'
    },
    {
        id: 'psu-4', category: 'psu',
        name: 'Cooler Master V850 SFX Gold',
        brand: 'Cooler Master', wattage: '850W',
        spec: '80+ Gold · SFX Form Factor · Fully Modular · 92mm Fan',
        compatibility: 'SFX / SFX-L · ATX Adapter Included · ITX Builds',
        description: 'Compact SFX power supply ideal for small form factor builds with full-size performance.',
        price: 14999, originalPrice: 17999,
        rating: 4.7, reviews: 189, popularity: 74,
        hasImage: true, artColor: '#2e1a2e', artIcon: '🔌',
        image: 'assets/images/parts/Cooler Master V850 SFX Gold.jpg'
    },

    // ═══════════════════════════════════════════
    //  PC Cases
    // ═══════════════════════════════════════════
    {
        id: 'case-1', category: 'case', badge: 'PREMIUM',
        name: 'Lian Li PC-O11 Dynamic EVO',
        brand: 'Lian Li', formFactor: 'Mid-Tower',
        spec: 'Dual Chamber · Tempered Glass · E-ATX · USB-C',
        compatibility: 'E-ATX/ATX/M-ATX/ITX · Up to 360mm AIO · GPU ≤385mm',
        description: 'The most iconic PC case in the enthusiast community — dual chamber design with unmatched aesthetics.',
        price: 14999, originalPrice: 16999,
        rating: 4.9, reviews: 876, popularity: 96,
        hasImage: true, artColor: '#1a1a2e', artIcon: '🗃️',
        image: 'assets/images/parts/Lian Li PC-O11 Dynamic EVO.jpg'
    },
    {
        id: 'case-2', category: 'case', badge: 'POPULAR',
        name: 'NZXT H9 Elite',
        brand: 'NZXT', formFactor: 'Mid-Tower',
        spec: 'Full Glass Panels · Dual Chamber · ATX · USB-C · 2× 360mm',
        compatibility: 'ATX/M-ATX/ITX · Up to 360mm AIO top+side · GPU ≤435mm',
        description: 'Stunning all-glass showcase case with dual-chamber thermal design and cable management.',
        price: 16999, originalPrice: 18999,
        rating: 4.8, reviews: 423, popularity: 88,
        hasImage: true, artColor: '#2e1a2e', artIcon: '🗃️',
        image: 'assets/images/parts/NZXT H9 Elite.jpg'
    },
    {
        id: 'case-3', category: 'case',
        name: 'Fractal Design Torrent',
        brand: 'Fractal Design', formFactor: 'Full-Tower',
        spec: 'Open Grill Airflow · E-ATX · Tempered Glass · 180mm Fans',
        compatibility: 'E-ATX/ATX/M-ATX · 2× 180mm + 3× 140mm Fans · GPU ≤461mm',
        description: 'Best-in-class airflow with huge 180mm fans — set it and forget it thermals.',
        price: 12999, originalPrice: 14999,
        rating: 4.7, reviews: 312, popularity: 80,
        hasImage: true, artColor: '#1a2a1a', artIcon: '🗃️',
        image: 'assets/images/parts/Fractal Design Torrent.jpg'
    },
    {
        id: 'case-4', category: 'case',
        name: 'Corsair 5000D Airflow',
        brand: 'Corsair', formFactor: 'Mid-Tower',
        spec: 'High Airflow Front · ATX · Tempered Glass · USB-C',
        compatibility: 'ATX/M-ATX/ITX · Up to 360mm AIO top+front · GPU ≤420mm',
        description: 'Spacious mid-tower with excellent airflow and iCUE RGB ecosystem integration.',
        price: 11999, originalPrice: 13999,
        rating: 4.7, reviews: 534, popularity: 84,
        hasImage: true, artColor: '#1a1a1a', artIcon: '🗃️',
        image: 'assets/images/parts/Corsair 5000D Airflow.jpg'
    },

    // ═══════════════════════════════════════════
    //  CPU Coolers (Air & Liquid)
    // ═══════════════════════════════════════════
    {
        id: 'cool-1', category: 'cooling', badge: 'TOP',
        name: 'NZXT Kraken Elite 360 RGB',
        brand: 'NZXT', type: '360mm AIO',
        spec: '3× 120mm Fans · LCD Display · AM5 & LGA1700 · RGB',
        compatibility: 'LGA1700 / LGA1200 / AM5 / AM4 · 360mm Rad',
        description: 'Premium AIO with a customizable LCD pump head — show GIFs, temps, or custom art.',
        price: 19999, originalPrice: 22999,
        rating: 4.8, reviews: 312, popularity: 86,
        hasImage: true, artColor: '#1a2e3a', artIcon: '❄️',
        image: 'assets/images/parts/NZXT Kraken Elite 360 RGB.jpg'
    },
    {
        id: 'cool-2', category: 'cooling',
        name: 'Corsair iCUE H150i Elite Capellix',
        brand: 'Corsair', type: '360mm AIO',
        spec: '3× 120mm LL RGB Fans · AM5 & LGA1700 · 33 LEDs Pump',
        compatibility: 'LGA1700 / LGA1200 / AM5 / AM4 · 360mm Rad',
        description: 'Corsair\'s flagship AIO with Capellix LEDs and iCUE Commander integration.',
        price: 17999, originalPrice: 20999,
        rating: 4.7, reviews: 478, popularity: 82,
        hasImage: true, artColor: '#1a1a3a', artIcon: '❄️',
        image: 'assets/images/parts/Corsair iCUE H150i Elite Capellix.jpg'
    },
    {
        id: 'cool-3', category: 'cooling', badge: 'LEGENDARY',
        name: 'Noctua NH-D15 Chromax.Black',
        brand: 'Noctua', type: 'Dual Tower Air',
        spec: '2× 140mm NF-A15 · TDP 250W · Universal Socket',
        compatibility: 'LGA1700 / LGA1200 / AM5 / AM4 · 165mm Height',
        description: 'The gold standard of air cooling — whisper-quiet with performance rivaling 360mm AIOs.',
        price: 9999, originalPrice: 11499,
        rating: 4.9, reviews: 891, popularity: 94,
        hasImage: true, artColor: '#2a1a0a', artIcon: '🌀',
        image: 'assets/images/parts/Noctua NH-D15 Chromax.Black.jpg'
    },
    {
        id: 'cool-4', category: 'cooling',
        name: 'DeepCool AK620 Digital',
        brand: 'DeepCool', type: 'Dual Tower Air',
        spec: '2× 120mm Fans · LCD Display · TDP 260W · Silent',
        compatibility: 'LGA1700 / LGA1200 / AM5 / AM4 · 160mm Height',
        description: 'Budget dual tower with a digital LCD readout — excellent performance for the price.',
        price: 6999, originalPrice: 7999,
        rating: 4.7, reviews: 234, popularity: 80,
        hasImage: true, artColor: '#1a2e2e', artIcon: '🌀',
        image: 'assets/images/parts/DeepCool AK620 Digital.jpg'
    },

    // ═══════════════════════════════════════════
    //  Cabinet Fans
    // ═══════════════════════════════════════════
    {
        id: 'fan-1', category: 'fans', badge: 'RGB',
        name: 'Lian Li UNI Fan SL120 Infinity',
        brand: 'Lian Li', size: '120mm',
        spec: 'ARGB · Daisy-Chain · 1850 RPM · 3-Pack',
        compatibility: '120mm mount · ARGB 5V 3-pin · PWM 4-pin',
        description: 'Beautiful infinity mirror ARGB fans with innovative daisy-chain cable management.',
        price: 5499, originalPrice: 6499,
        rating: 4.8, reviews: 612, popularity: 88,
        hasImage: true, artColor: '#2e1a2e', artIcon: '🌀',
        image: 'assets/images/parts/Lian Li UNI Fan SL120 Infinity.jpg'
    },
    {
        id: 'fan-2', category: 'fans', badge: 'KING OF SILENCE',
        name: 'Noctua NF-A12x25 PWM',
        brand: 'Noctua', size: '120mm',
        spec: 'Premium Quiet · 2000 RPM · AAO Frame · SSO2 Bearing',
        compatibility: '120mm mount · PWM 4-pin · Universal',
        description: 'The world\'s best 120mm fan — unmatched static pressure and near-silent operation.',
        price: 2999, originalPrice: 3499,
        rating: 4.9, reviews: 1204, popularity: 95,
        hasImage: true, artColor: '#2a1a0a', artIcon: '🌀',
        image: 'assets/images/parts/Noctua NF-A12x25 PWM.jpg'
    },
    {
        id: 'fan-3', category: 'fans', badge: 'RGB PACK',
        name: 'Corsair LL140 RGB Twin Pack',
        brand: 'Corsair', size: '140mm',
        spec: '16 LED RGB · 1300 RPM · Dual Light Loop · 2-Pack',
        compatibility: '140mm mount · RGB Hub Included · PWM 4-pin',
        description: 'Dual light loop design creates mesmerizing RGB effects — includes Lighting Node.',
        price: 4499, originalPrice: 5499,
        rating: 4.6, reviews: 389, popularity: 76,
        hasImage: true, artColor: '#1a1a3a', artIcon: '💡',
        image: 'assets/images/parts/Corsair LL140 RGB Twin Pack.jpg'
    },
    {
        id: 'fan-4', category: 'fans',
        name: 'be quiet! Silent Wings 4 Pro',
        brand: 'be quiet!', size: '120mm / 140mm',
        spec: 'PWM · 3000 RPM · Ultra Silent 7-Blade · Fluid Dynamic',
        compatibility: '120mm/140mm mount · PWM 4-pin · Anti-Vibe Mounts',
        description: 'High-speed fan with silent operation — perfect for radiators and high-airflow configurations.',
        price: 2499, originalPrice: 2999,
        rating: 4.8, reviews: 278, popularity: 74,
        hasImage: true, artColor: '#1a2a1a', artIcon: '🌀',
        image: 'assets/images/parts/be quiet! Silent Wings 4 Pro.jpg'
    },
    // ═══════════════════════════════════════════
    //  Gaming Headsets
    // ═══════════════════════════════════════════
    {
        id: 'hs-1', category: 'headset', badge: 'FLAGSHIP',
        name: 'SteelSeries Arctis Nova Pro Wireless',
        brand: 'SteelSeries', type: 'Headset',
        spec: 'ANC · Hi-Res Audio · Dual Battery · BT 5.0 + 2.4GHz',
        compatibility: 'PC · PS5 · Switch · Mobile · Bluetooth Multi-Connect',
        description: 'The ultimate wireless gaming headset with active noise cancellation and hot-swappable batteries.',
        price: 24999, originalPrice: 27999,
        rating: 4.7, reviews: 201, popularity: 86,
        hasImage: true, artColor: '#1a1a2e', artIcon: '🎧',
        image: 'assets/images/parts/SteelSeries Arctis Nova Pro Wireless.jpg'
    },
    {
        id: 'hs-2', category: 'headset', badge: 'BEST VALUE',
        name: 'HyperX Cloud III Wireless',
        brand: 'HyperX', type: 'Headset',
        spec: 'DTS Headphone:X · 120h Battery · 53mm Drivers · Memory Foam',
        compatibility: 'PC · PS5 · PS4 · Switch · USB-C 2.4GHz',
        description: 'Legendary comfort meets insane 120-hour wireless battery life and DTS spatial audio.',
        price: 10999, originalPrice: 12999,
        rating: 4.7, reviews: 534, popularity: 88,
        hasImage: true, artColor: '#2e0d0d', artIcon: '🎧',
        image: 'assets/images/parts/HyperX Cloud III Wireless.jpg'
    },
    {
        id: 'hs-3', category: 'headset',
        name: 'Razer BlackShark V2 Pro',
        brand: 'Razer', type: 'Headset',
        spec: 'THX Spatial · TriForce 50mm · HyperSpeed · 70h Battery',
        compatibility: 'PC · PS5 · Switch · Mobile · USB-C 2.4GHz',
        description: 'Esports-focused headset with THX Spatial Audio and HyperClear Super Wideband Mic.',
        price: 12999, originalPrice: 14999,
        rating: 4.6, reviews: 312, popularity: 80,
        hasImage: true, artColor: '#0d2e1a', artIcon: '🎧',
        image: 'assets/images/parts/Razer BlackShark V2 Pro.jpg'
    },
    {
        id: 'hs-4', category: 'headset',
        name: 'Logitech G Pro X 2 LIGHTSPEED',
        brand: 'Logitech', type: 'Headset',
        spec: 'Graphene Drivers · DTS:X · Bluetooth · 50h Battery',
        compatibility: 'PC · PS5 · Switch · Mobile · LIGHTSPEED + BT',
        description: 'Pro-grade wireless headset with graphene drivers for audiophile-level clarity.',
        price: 16999, originalPrice: 18999,
        rating: 4.7, reviews: 189, popularity: 78,
        hasImage: true, artColor: '#1a2e1a', artIcon: '🎧',
        image: 'assets/images/parts/Logitech G Pro X 2 LIGHTSPEED.jpg'
    },

    // ═══════════════════════════════════════════
    //  Thermal Paste
    // ═══════════════════════════════════════════
    {
        id: 'tp-1', category: 'thermal', badge: 'BEST',
        name: 'Noctua NT-H1 (3.5g)',
        brand: 'Noctua', type: 'Thermal Paste',
        spec: 'Hybrid Compound · Non-Conductive · Easy to Apply · 3.5g',
        compatibility: 'Universal · All CPU/GPU · Non-Curing',
        description: 'Industry-standard thermal paste — easy to apply, non-electrically conductive, excellent performance.',
        price: 899, originalPrice: 1099,
        rating: 4.8, reviews: 1567, popularity: 92,
        hasImage: true, artColor: '#2e2e2e', artIcon: '🧴',
        image: 'assets/images/parts/Noctua NT-H1 (3.5g).jpg'
    },
    {
        id: 'tp-2', category: 'thermal', badge: 'PRO',
        name: 'Thermal Grizzly Kryonaut',
        brand: 'Thermal Grizzly', type: 'Thermal Paste',
        spec: '12.5 W/mK · Non-Curing · High Performance · 1g',
        compatibility: 'Universal · CPU/GPU · Extreme OC',
        description: 'Premium thermal paste used by overclockers worldwide — class-leading thermal conductivity.',
        price: 1299, originalPrice: 1499,
        rating: 4.9, reviews: 892, popularity: 88,
        hasImage: true, artColor: '#1a2a2a', artIcon: '🧊',
        image: 'assets/images/parts/Thermal Grizzly Kryonaut.jpg'
    },
    {
        id: 'tp-3', category: 'thermal',
        name: 'Arctic MX-6 (4g)',
        brand: 'Arctic', type: 'Thermal Paste',
        spec: 'Non-Conductive · Non-Capacitive · 4g Syringe',
        compatibility: 'Universal · CPU/GPU · Long-Term Stable',
        description: 'Next-gen thermal compound with improved consistency and longevity at a budget price.',
        price: 599, originalPrice: 799,
        rating: 4.6, reviews: 678, popularity: 80,
        hasImage: true, artColor: '#0d2e2e', artIcon: '🧴',
        image: 'assets/images/parts/Arctic MX-6 (4g).jpg'
    },

    // ═══════════════════════════════════════════
    //  Cables & Accessories
    // ═══════════════════════════════════════════
    {
        id: 'cab-1', category: 'cables', badge: 'PREMIUM',
        name: 'CableMod Pro ModMesh Sleeved Kit',
        brand: 'CableMod', type: 'Cable Kit',
        spec: '24-pin ATX + 2× 8-pin EPS + 3× 8-pin PCIe · Sleeved',
        compatibility: 'Corsair / Seasonic / EVGA / be quiet! PSUs',
        description: 'Complete custom sleeved cable kit for a clean and stunning build aesthetic.',
        price: 7999, originalPrice: 9499,
        rating: 4.8, reviews: 312, popularity: 82,
        hasImage: true, artColor: '#2e1a1a', artIcon: '🔗',
        image: 'assets/images/parts/CableMod Pro ModMesh Sleeved Kit.jpg'
    },
    {
        id: 'cab-2', category: 'cables',
        name: 'CableMod 12VHPWR Adapter Cable',
        brand: 'CableMod', type: '12VHPWR Cable',
        spec: '12VHPWR to 3× 8-pin · 600W Rated · Right-Angle Option',
        compatibility: 'RTX 4090 / RTX 4080 · ATX 3.0 PSUs',
        description: 'Safe and reliable 12VHPWR adapter with right-angle connector to prevent melting issues.',
        price: 2999, originalPrice: 3499,
        rating: 4.7, reviews: 456, popularity: 78,
        hasImage: true, artColor: '#1a2e1a', artIcon: '🔌',
        image: 'assets/images/parts/CableMod 12VHPWR Adapter Cable.jpg'
    },
    {
        id: 'cab-3', category: 'cables',
        name: 'NZXT Internal USB Hub (Gen 3)',
        brand: 'NZXT', type: 'USB Hub',
        spec: '4× USB 2.0 Internal · Magnetic Mount · Molex Powered',
        compatibility: 'All Cases · Internal USB 2.0 Header',
        description: 'Expand your internal USB headers for RGB controllers, fan hubs, and AIO pumps.',
        price: 1999, originalPrice: 2499,
        rating: 4.5, reviews: 234, popularity: 68,
        hasImage: true, artColor: '#2e2e1a', artIcon: '🔗',
        image: 'assets/images/parts/NZXT Internal USB Hub (Gen 3).jpg'
    },
    {
        id: 'cab-4', category: 'cables', badge: 'RGB',
        name: 'Phanteks Neon Digital RGB Strip Kit',
        brand: 'Phanteks', type: 'RGB Strip',
        spec: '2× 400mm + 2× 550mm Strips · ARGB 5V · Diffused Silicone',
        compatibility: 'ARGB 5V 3-pin Header · Motherboard Sync',
        description: 'Smooth diffused ARGB light strips for edge-to-edge glow in your build.',
        price: 3499, originalPrice: 3999,
        rating: 4.6, reviews: 189, popularity: 72,
        hasImage: true, artColor: '#2e0d2e', artIcon: '🌈',
        image: 'assets/images/parts/Phanteks Neon Digital RGB Strip Kit.jpg'
    }
];

// ═══════════════════════════════════════════
//  Category Config
// ═══════════════════════════════════════════
const CATEGORY_CONFIG = [
    { key: 'all', label: 'All Parts', icon: '🛒' },
    { key: 'cpu', label: 'CPUs', icon: '⚡' },
    { key: 'gpu', label: 'GPUs', icon: '🎯' },
    { key: 'motherboard', label: 'Motherboards', icon: '🖥️' },
    { key: 'ram', label: 'RAM', icon: '💡' },
    { key: 'storage', label: 'Storage', icon: '💾' },
    { key: 'psu', label: 'Power Supplies', icon: '🔌' },
    { key: 'case', label: 'Cases', icon: '🗃️' },
    { key: 'cooling', label: 'Coolers', icon: '❄️' },
    { key: 'fans', label: 'Fans', icon: '🌀' },
             { key: 'headset', label: 'Headsets', icon: '🎧' },
    { key: 'thermal', label: 'Thermal Paste', icon: '🧴' },
    { key: 'cables', label: 'Cables & Acc.', icon: '🔗' }
];

// ═══════════════════════════════════════════
//  Helpers
// ═══════════════════════════════════════════
function getPartsByCategory(cat) {
    if (cat === 'all') return [...PARTS];
    return PARTS.filter(p => p.category === cat);
}

function getAllBrands() {
    return [...new Set(PARTS.map(p => p.brand))].sort();
}

function getCategoryLabel(cat) {
    const cfg = CATEGORY_CONFIG.find(c => c.key === cat);
    return cfg ? cfg.label : cat.toUpperCase();
}

function getCategoryIcon(cat) {
    const cfg = CATEGORY_CONFIG.find(c => c.key === cat);
    return cfg ? cfg.icon : '📦';
}
