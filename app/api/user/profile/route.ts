import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET user profile
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    // If user is logged in, fetch their data
    if (session?.user?.id) {
      const user = await User.findById(session.user.id).select('-password');
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
        address: user.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: '',
        },
      });
    }

    // For guests, return empty profile
    return NextResponse.json({
      name: '',
      email: '',
      phone: '',
      avatar: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      },
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to fetch user',
        code: 'USER_FETCH_ERROR',
        details: process.env.NODE_ENV === 'development' ? error?.toString() : undefined
      },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(req: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    // Only authenticated users can update their profile
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required to update profile' },
        { status: 401 }
      );
    }

    const data = await req.json();

    // Update user profile
    const user = await User.findByIdAndUpdate(
      session.user.id,
      {
        name: data.name,
        phone: data.phone,
        avatar: data.avatar,
        address: data.address,
      },
      { 
        new: true,
        runValidators: true,
        select: '-password'
      }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        address: user.address,
      }
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    
    let statusCode = 500;
    let errorMessage = error?.message || 'Failed to update user';
    
    if (error?.name === 'ValidationError') {
      statusCode = 400;
      errorMessage = `Validation error: ${Object.keys(error.errors).join(', ')}`;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        code: 'USER_UPDATE_ERROR',
        details: process.env.NODE_ENV === 'development' ? error?.toString() : undefined
      },
      { status: statusCode }
    );
  }
}
