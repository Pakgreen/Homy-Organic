import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Category from '@/models/Category';
import Product from '@/models/Product';
import Slider from '@/models/Slider';
import { generateSlug, getRandomImage } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    // Verify request origin for security
    const origin = req.headers.get('origin') || req.headers.get('referer');
    
    await connectDB();

    // Check if admin already exists
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Admin credentials not configured in environment variables' },
        { status: 400 }
      );
    }
    const normalizedAdminEmail = adminEmail.trim().toLowerCase();
    const escapedEmail = normalizedAdminEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const existingAdmin = await User.findOne({
      email: { $regex: `^${escapedEmail}$`, $options: 'i' },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { message: 'Admin already exists' },
        { status: 200 }
      );
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await User.create({
      name: 'Admin',
      email: normalizedAdminEmail,
      password: hashedPassword,
      role: 'admin',
    });

    // Create initial categories
    const categories = [
      {
        name: 'Design Services',
        slug: 'design-services',
        description: 'Professional design solutions for your brand',
        image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400',
      },
      {
        name: 'Digital Products',
        slug: 'digital-products',
        description: 'High-quality digital assets and templates',
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400',
      },
      {
        name: 'Branding',
        slug: 'branding',
        description: 'Complete branding solutions and identity design',
        image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400',
      },
    ];

    const createdCategories = await Category.insertMany(categories);

    // Create sample products
    const products = [
      {
        name: 'Logo Design Package',
        slug: 'logo-design-package',
        description:
          'Professional logo design with 5 unique concepts, unlimited revisions, and source files included. Perfect for startups and small businesses.',
        price: 299,
        category: createdCategories[2]._id,
        images: [
          'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400',
        ],
        brand: 'Kaarvix Studio',
        isFeatured: true,
      },
      {
        name: 'UI/UX Design Course',
        slug: 'ui-ux-design-course',
        description:
          'Complete UI/UX design course covering design principles, tools, and best practices in web and app design.',
        price: 149,
        category: createdCategories[1]._id,
        images: [
          'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400',
        ],
        brand: 'Kaarvix Studio',
        isFeatured: true,
      },
      {
        name: 'Website Design Service',
        slug: 'website-design-service',
        description:
          'Custom website design tailored to your brand identity. Includes responsive design and user experience optimization.',
        price: 999,
        category: createdCategories[0]._id,
        images: [
          'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400',
        ],
        brand: 'Kaarvix Studio',
        isFeatured: true,
      },
      {
        name: 'Social Media Kit',
        slug: 'social-media-kit',
        description:
          'Complete social media templates and branding guidelines for Instagram, Facebook, and Twitter.',
        price: 79,
        category: createdCategories[1]._id,
        images: [
          'https://images.unsplash.com/photo-1507842217343-583f7270bfed?w=400',
        ],
        brand: 'Kaarvix Studio',
        isFeatured: false,
      },
      {
        name: 'Brand Identity System',
        slug: 'brand-identity-system',
        description:
          'Complete brand identity package including logo, color palette, fonts, and comprehensive brand guidelines.',
        price: 499,
        category: createdCategories[2]._id,
        images: [
          'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400',
        ],
        brand: 'Kaarvix Studio',
        isFeatured: true,
      },
      {
        name: 'Graphic Design Templates',
        slug: 'graphic-design-templates',
        description:
          'Professional graphic design templates ready to customize for your projects. Includes Photoshop, Illustrator, and Figma files.',
        price: 49,
        category: createdCategories[1]._id,
        images: [
          'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400',
        ],
        brand: 'Kaarvix Studio',
        isFeatured: true,
      },
    ];

    await Product.insertMany(products);

    // Create sample sliders
    const sliders = [
      {
        title: 'Professional Logo Design',
        description: 'Get a custom logo that represents your brand identity. Our expert designers will create unique concepts for your business.',
        image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&h=600&fit=crop',
        buttonText: 'Get Started',
        buttonLink: '/products/logo-design-package',
        isActive: true,
        order: 1,
      },
      {
        title: 'UI/UX Design Course',
        description: 'Master the art of user interface and user experience design. Learn from industry experts and create stunning digital products.',
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&h=600&fit=crop',
        buttonText: 'Enroll Now',
        buttonLink: '/products/ui-ux-design-course',
        isActive: true,
        order: 2,
      },
      {
        title: 'Complete Brand Identity',
        description: 'Build a strong brand presence with our comprehensive brand identity system including logo, colors, fonts, and guidelines.',
        image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&h=600&fit=crop',
        buttonText: 'Learn More',
        buttonLink: '/products/brand-identity-system',
        isActive: true,
        order: 3,
      },
      {
        title: 'Website Design Service',
        description: 'Create stunning, responsive websites that engage your audience and drive conversions. Custom design tailored to your brand.',
        image: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=1200&h=600&fit=crop',
        buttonText: 'View Portfolio',
        buttonLink: '/products/website-design-service',
        isActive: true,
        order: 4,
      },
      {
        title: 'Social Media Design Kit',
        description: 'Get professional social media templates and branding assets. Ready-to-use designs for Instagram, Facebook, Twitter, and more.',
        image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1200&h=600&fit=crop',
        buttonText: 'Shop Now',
        buttonLink: '/products/social-media-kit',
        isActive: true,
        order: 5,
      },
    ];

    await Slider.insertMany(sliders);

    return NextResponse.json(
      { 
        message: 'Database seeded successfully',
        data: {
          adminCreated: true,
          categoriesCreated: true,
          productsCreated: true,
          slidersCreated: true
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Seed error:', error);
    
    // Provide more specific error information
    const errorMessage = error?.message || 'Failed to seed database';
    const errorCode = error?.code || 'SEED_ERROR';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        code: errorCode,
        details: process.env.NODE_ENV === 'development' ? error?.toString() : undefined
      },
      { status: 500 }
    );
  }
}
