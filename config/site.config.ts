/**
 * SITE CONFIGURATION
 *
 * This file allows you to customize your e-commerce website.
 * Change these values to match your brand.
 */

export const siteConfig = {
  // ============================================
  // COMPANY INFORMATION
  // ============================================
  company: {
    name: "Moms Collections", // Your company name (shown in navbar, footer)
    fullName: "Moms Collections", // Full company name (used in meta tags)
    tagline: "your trusted source for quality products", // Site tagline
    description:
      "Moms Collections, provide a wide range of quality products to meet your needs.",
  },

  // ============================================
  // BRANDING & LOGO
  // ============================================
  branding: {
    logo: "/logo.png", // Path to your logo image (place in /public folder)
      logoWidth: 110, // Logo width in pixels
      logoHeight: 110, // Logo height in pixels
    favicon: "/logo.png", // Path to favicon
  },

  // ============================================
  // THEME COLORS
  // ============================================
  theme: {
    // Primary colors (used for buttons, highlights)
    primary: {
      bg: "bg-black", // Primary background color
      text: "text-white", // Primary text color
      hover: "hover:bg-gray-700", // Hover state
      border: "border-gray-700", // Border color
    },

    // Secondary colors (used for secondary buttons)
    secondary: {
      bg: "bg-white",
      text: "text-black",
      hover: "hover:bg-gray-50",
      border: "border-gray-300",
    },

    // Accent color (for badges, highlights)
    accent: {
      bg: "bg-black", // Used for cart badge, sale tags
      text: "text-white",
    },

    // Price color (for product prices)
    price: {
      text: "text-black", // Price text color
      highlight: "text-gray-700", // Sale/highlight price color
    },

    // Badge colors (for cart count, notifications)
    badge: {
      bg: "bg-black", // Badge background (cart count icon)
      text: "text-white", // Badge text color
      navbar: "bg-black", // Navbar badge color
      bottom: "bg-black", // Bottom nav badge color
    },

    loader: {
      spinner: "#000000", // Loading indicator color
      text: "text-gray-600", // Loading text color
    },

    text: {
      primary: "text-black", // Main text color
      secondary: "text-gray-600", // Secondary text
      muted: "text-gray-400", // Muted text
    },

    // Background colors
    background: {
      primary: "bg-white", // Main background
      secondary: "bg-gray-50", // Secondary background
      hover: "bg-gray-100", // Hover background
    },

    // Border colors
    border: {
      primary: "border-gray-200",
      secondary: "border-gray-300",
    },
  },

  // ============================================
  // CONTACT & SOCIAL
  // ============================================
  contact: {
    email: "info@momscollections.shop",
    phone: "+92 323 8137537",
    address: "Moms Collections,waliyatabad #1 Multan",
    hours: "Everyday: 7:00 AM - 11:00 PM",
  },

  social: {
    facebook: "https://facebook.com/momscollections",
    twitter: "https://twitter.com/momscollections",
    instagram: "https://instagram.com/momscollections",
  },

  // ============================================
  // ABOUT PAGE CONTENT
  // ============================================
  about: {
    title: "About Us",
    subtitle: "Your Trusted Shopping Destination",
    intro:
      "momscollections is your one-stop shop for quality products that cater to your needs.",
    mission:
      "Our mission is to make shopping easy, convenient, and enjoyable for everyone. With a wide selection of products and a user-friendly shopping experience, we strive to be your trusted destination for all your needs.",
    stats: {
      products: "100+",
      support: "24/7",
      delivery: "Fast",
    },
  },

  // ============================================
  // FEATURES & SETTINGS
  // ============================================
  features: {
    showCategoryNav: true, // Show category navigation on homepage
    showFeaturedProducts: true, // Show featured products section
    enableReviews: false, // Reviews disabled
    enableWishlist: false, // Enable wishlist feature (future)
    itemsPerPage: 12, // Products per page
  },

  // ============================================
  // PRICING & SHIPPING
  // ============================================
  pricing: {
    currency: "PKR",
    currencySymbol: "PKR",
    shippingCost: 200, // Fixed delivery price (applied if order < minOrderForFreeShipping)
    taxRate: 0.00, // 0% tax rate
    minOrderForFreeShipping: 1000, // Orders above this amount get free delivery
    discountPercent: 10, // Flat 10% discount on all orders
  },

  // ============================================
  // SEED DATA (EDIT TO CONTROL DEFAULT CONTENT)
  // ============================================
  seedData: {
    placeholders: {
      categoryImage: "/logo.png",
      productImage: "/logo.png",
      sliderImage: "/logo.png",
    },
    categories: [
      {
        name: "Design Services",
        slug: "design-services",
        description: "Professional design solutions for your brand",
      },
      {
        name: "Digital Products",
        slug: "digital-products",
        description: "High-quality digital assets and templates",
      },
      {
        name: "Branding",
        slug: "branding",
        description: "Complete branding solutions and identity design",
      },
    ],
    products: [
      {
        name: "Logo Design Package",
        slug: "logo-design-package",
        description:
          "Professional logo design with 5 unique concepts, unlimited revisions, and source files included. Perfect for startups and small businesses.",
        price: 299,
        categorySlug: "branding",
        isFeatured: true,
      },
      {
        name: "UI/UX Design Course",
        slug: "ui-ux-design-course",
        description:
          "Complete UI/UX design course covering design principles, tools, and best practices in web and app design.",
        price: 149,
        categorySlug: "digital-products",
        isFeatured: true,
      },
      {
        name: "Website Design Service",
        slug: "website-design-service",
        description:
          "Custom website design tailored to your brand identity. Includes responsive design and user experience optimization.",
        price: 999,
        categorySlug: "design-services",
        isFeatured: true,
      },
      {
        name: "Social Media Kit",
        slug: "social-media-kit",
        description:
          "Complete social media templates and branding guidelines for Instagram, Facebook, and Twitter.",
        price: 79,
        categorySlug: "digital-products",
        isFeatured: false,
      },
      {
        name: "Brand Identity System",
        slug: "brand-identity-system",
        description:
          "Complete brand identity package including logo, color palette, fonts, and comprehensive brand guidelines.",
        price: 499,
        categorySlug: "branding",
        isFeatured: true,
      },
      {
        name: "Graphic Design Templates",
        slug: "graphic-design-templates",
        description:
          "Professional graphic design templates ready to customize for your projects. Includes Photoshop, Illustrator, and Figma files.",
        price: 49,
        categorySlug: "digital-products",
        isFeatured: true,
      },
    ],
    sliders: [
      {
        title: "Professional Logo Design",
        description:
          "Get a custom logo that represents your brand identity. Our expert designers will create unique concepts for your business.",
        buttonText: "Get Started",
        buttonLink: "/products/logo-design-package",
        isActive: true,
        order: 1,
      },
      {
        title: "UI/UX Design Course",
        description:
          "Master the art of user interface and user experience design. Learn from industry experts and create stunning digital products.",
        buttonText: "Enroll Now",
        buttonLink: "/products/ui-ux-design-course",
        isActive: true,
        order: 2,
      },
      {
        title: "Complete Brand Identity",
        description:
          "Build a strong brand presence with our comprehensive brand identity system including logo, colors, fonts, and guidelines.",
        buttonText: "Learn More",
        buttonLink: "/products/brand-identity-system",
        isActive: true,
        order: 3,
      },
      {
        title: "Website Design Service",
        description:
          "Create stunning, responsive websites that engage your audience and drive conversions. Custom design tailored to your brand.",
        buttonText: "View Portfolio",
        buttonLink: "/products/website-design-service",
        isActive: true,
        order: 4,
      },
      {
        title: "Social Media Design Kit",
        description:
          "Get professional social media templates and branding assets. Ready-to-use designs for Instagram, Facebook, Twitter, and more.",
        buttonText: "Shop Now",
        buttonLink: "/products/social-media-kit",
        isActive: true,
        order: 5,
      },
    ],
  },
};

// Helper function to get theme classes
export const getThemeClass = (
  type: "button-primary" | "button-secondary" | "text-primary" | "bg-primary"
) => {
  const theme = siteConfig.theme;

  switch (type) {
    case "button-primary":
      return `${theme.primary.bg} ${theme.primary.text} ${theme.primary.hover} cursor-pointer transition-colors`;
    case "button-secondary":
      return `${theme.secondary.bg} ${theme.secondary.text} ${theme.secondary.hover} ${theme.secondary.border} border cursor-pointer transition-colors`;
    case "text-primary":
      return theme.text.primary;
    case "bg-primary":
      return theme.background.primary;
    default:
      return "";
  }
};
