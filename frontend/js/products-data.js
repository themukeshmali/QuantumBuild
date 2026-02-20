// Quantum Build — Product Catalog Data
const PRODUCTS = [
    {
        id: 1,
        name: "Quantum Titan X",
        category: "Full Tower",
        cpu: "Intel Core i9-14900K",
        gpu: "NVIDIA RTX 4090 24GB",
        ram: "64GB DDR5 6000MHz",
        storage: "2TB NVMe Gen5 SSD",
        price: 349999,
        originalPrice: 399999,
        images: ["assets/images/gaming_pc_1.png", "assets/images/gaming_pc_2.png"],
        description: "The ultimate gaming powerhouse. The Quantum Titan X delivers unmatched performance with the latest Intel Core i9 processor and NVIDIA RTX 4090, wrapped in a stunning full-tower chassis with 360mm liquid cooling and full RGB illumination.",
        cooling: "360mm AIO Liquid Cooling",
        psu: "1000W 80+ Platinum",
        fps: { cyberpunk: 120, fortnite: 244, valorant: 500, rdr2: 110 },
        badge: "FLAGSHIP",
        rating: 4.9,
        reviews: 127
    },
    {
        id: 2,
        name: "Quantum Phantom Pro",
        category: "Mid Tower",
        cpu: "AMD Ryzen 9 7950X",
        gpu: "NVIDIA RTX 4080 SUPER 16GB",
        ram: "32GB DDR5 5600MHz",
        storage: "1TB NVMe Gen4 SSD",
        price: 249999,
        originalPrice: 289999,
        images: ["assets/images/gaming_pc_2.png", "assets/images/gaming_pc_1.png"],
        description: "Where stealth meets power. The Phantom Pro combines AMD's finest processor with the RTX 4080 SUPER in a sleek mid-tower build featuring whisper-quiet cooling and mesmerizing RGB effects.",
        cooling: "280mm AIO Liquid Cooling",
        psu: "850W 80+ Gold",
        fps: { cyberpunk: 95, fortnite: 240, valorant: 480, rdr2: 85 },
        badge: "BEST SELLER",
        rating: 4.8,
        reviews: 203
    },
    {
        id: 3,
        name: "Quantum Spectre",
        category: "Mid Tower",
        cpu: "Intel Core i7-14700K",
        gpu: "NVIDIA RTX 4070 Ti SUPER 16GB",
        ram: "32GB DDR5 5200MHz",
        storage: "1TB NVMe Gen4 SSD",
        price: 179999,
        originalPrice: 209999,
        images: ["assets/images/gaming_pc_1.png", "assets/images/gaming_pc_2.png"],
        description: "Precision-engineered for competitive gaming. The Spectre delivers incredible frame rates and stunning visuals at 1440p, making every game feel buttery smooth.",
        cooling: "240mm AIO Liquid Cooling",
        psu: "750W 80+ Gold",
        fps: { cyberpunk: 75, fortnite: 240, valorant: 450, rdr2: 70 },
        badge: "POPULAR",
        rating: 4.7,
        reviews: 312
    },
    {
        id: 4,
        name: "Quantum Vortex",
        category: "Full Tower",
        cpu: "AMD Ryzen 9 7900X",
        gpu: "NVIDIA RTX 4080 16GB",
        ram: "64GB DDR5 5600MHz",
        storage: "2TB NVMe Gen4 SSD + 4TB HDD",
        price: 279999,
        originalPrice: 319999,
        images: ["assets/images/gaming_pc_2.png", "assets/images/gaming_pc_1.png"],
        description: "A content creator's dream machine. The Vortex handles 4K video editing, 3D rendering, and AAA gaming with effortless grace. Massive storage meets massive power.",
        cooling: "360mm AIO Liquid Cooling",
        psu: "1000W 80+ Gold",
        fps: { cyberpunk: 100, fortnite: 240, valorant: 490, rdr2: 90 },
        badge: "CREATOR'S PICK",
        rating: 4.8,
        reviews: 98
    },
    {
        id: 5,
        name: "Quantum Edge",
        category: "Small Form Factor",
        cpu: "AMD Ryzen 7 7800X3D",
        gpu: "NVIDIA RTX 4070 SUPER 12GB",
        ram: "32GB DDR5 5200MHz",
        storage: "1TB NVMe Gen4 SSD",
        price: 149999,
        originalPrice: 169999,
        images: ["assets/images/gaming_pc_1.png", "assets/images/gaming_pc_2.png"],
        description: "Maximum gaming in minimum space. The Edge packs AMD's gaming-optimized 3D V-Cache processor into a compact chassis without any performance compromises.",
        cooling: "Tower Air Cooler",
        psu: "650W 80+ Gold SFX",
        fps: { cyberpunk: 70, fortnite: 220, valorant: 400, rdr2: 65 },
        badge: "COMPACT BEAST",
        rating: 4.6,
        reviews: 176
    },
    {
        id: 6,
        name: "Quantum Nexus",
        category: "Mid Tower",
        cpu: "Intel Core i5-14600K",
        gpu: "NVIDIA RTX 4060 Ti 8GB",
        ram: "16GB DDR5 4800MHz",
        storage: "512GB NVMe Gen4 SSD",
        price: 99999,
        originalPrice: 119999,
        images: ["assets/images/gaming_pc_2.png", "assets/images/gaming_pc_1.png"],
        description: "Your gateway to premium gaming. The Nexus delivers solid 1080p and 1440p gaming performance at an incredible value, with room to upgrade as you grow.",
        cooling: "Tower Air Cooler",
        psu: "650W 80+ Bronze",
        fps: { cyberpunk: 55, fortnite: 165, valorant: 350, rdr2: 50 },
        badge: "VALUE KING",
        rating: 4.5,
        reviews: 421
    },
    {
        id: 7,
        name: "Quantum Omega",
        category: "Full Tower",
        cpu: "Intel Core i9-14900KS",
        gpu: "NVIDIA RTX 4090 24GB",
        ram: "128GB DDR5 6400MHz",
        storage: "4TB NVMe Gen5 SSD",
        price: 499999,
        originalPrice: null,
        images: ["assets/images/gaming_pc_1.png", "assets/images/gaming_pc_2.png"],
        description: "The apex predator. No compromises, no limits. The Omega is Quantum Build's most extreme machine — built for those who demand absolute perfection in gaming, streaming, and creation.",
        cooling: "Custom Loop Liquid Cooling",
        psu: "1200W 80+ Titanium",
        fps: { cyberpunk: 130, fortnite: 360, valorant: 600, rdr2: 120 },
        badge: "EXTREME",
        rating: 5.0,
        reviews: 42
    },
    {
        id: 8,
        name: "Quantum Pulse Mini",
        category: "Mini PC",
        cpu: "AMD Ryzen 7 7840HS",
        gpu: "NVIDIA RTX 4060 8GB",
        ram: "16GB DDR5 5600MHz",
        storage: "512GB NVMe Gen4 SSD",
        price: 89999,
        originalPrice: 99999,
        images: ["assets/images/gaming_pc_2.png", "assets/images/gaming_pc_1.png"],
        description: "Big gaming in a tiny package. The Pulse Mini is a palm-sized powerhouse that fits anywhere — your desk, your living room, or your backpack for LAN parties.",
        cooling: "Dual Fan Cooling System",
        psu: "200W External Adapter",
        fps: { cyberpunk: 50, fortnite: 144, valorant: 300, rdr2: 45 },
        badge: "MINI BEAST",
        rating: 4.4,
        reviews: 156
    }
];

// Format price in Indian Rupees
function formatPrice(price) {
    return '₹' + price.toLocaleString('en-IN');
}

// Get product by ID
function getProductById(id) {
    return PRODUCTS.find(p => p.id === parseInt(id));
}

// Get products by category 
function getProductsByCategory(category) {
    if (!category || category === 'All') return PRODUCTS;
    return PRODUCTS.filter(p => p.category === category);
}

// Get featured products
function getFeaturedProducts() {
    return PRODUCTS.filter(p => ['FLAGSHIP', 'BEST SELLER', 'POPULAR', 'EXTREME'].includes(p.badge));
}
